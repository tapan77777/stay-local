import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import {
  SCHEMA_FILES,
  applyMigration,
  splitSqlStatements,
  migrationCommands,
  migrationTarget,
  legacyImportCommands,
} from "../scripts/plan-migration-core.mjs";
import {
  contentMutationCommands,
  retryTransaction,
} from "../lib/plan/transactions";
const load = (name: string) => readFile(`lib/plan/${name}`, "utf8");
function client(pg: PGlite) {
  return {
    query: (text: string, values: unknown[]) => ({ text, values }),
    transaction: async (commands: { text: string; values: unknown[] }[]) =>
      pg.transaction(async (tx) => {
        for (const c of commands) await tx.query(c.text, c.values);
      }),
  };
}
test("SQL splitter preserves dollar bodies, quoted semicolons and comments", () => {
  assert.equal(
    splitSqlStatements(
      "SELECT 'a;b'; DO $body$ BEGIN PERFORM 1; END $body$; -- comment ;\nSELECT 3;",
    ).length,
    3,
  );
  assert.throws(
    () => splitSqlStatements("DO $$ BEGIN PERFORM 1;"),
    /Unterminated/,
  );
  assert.throws(
    () => migrationCommands(["CREATE INDEX CONCURRENTLY i ON plans(title);"]),
    /separate reviewed/,
  );
});
test("full migration is atomic, idempotent and settings are transaction-local", async () => {
  const pg = new PGlite();
  try {
    const sources = await Promise.all(SCHEMA_FILES.map(load));
    await applyMigration(client(pg), sources);
    await pg.query<Record<string, unknown>>(
      "INSERT INTO customers(id,name,email) VALUES('00000000-0000-4000-8000-000000000001','Manual','manual@example.invalid')",
    );
    await pg.query<Record<string, unknown>>(
      "INSERT INTO plans(id,customer_id,private_token,title) VALUES('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','manual-token','Original')",
    );
    const before = await pg.query<Record<string, unknown>>(
      "SELECT * FROM plans",
    );
    await applyMigration(client(pg), sources);
    assert.deepEqual(
      (await pg.query<Record<string, unknown>>("SELECT * FROM plans")).rows,
      before.rows,
    );
    const triggers = await pg.query<Record<string, unknown>>(
      "SELECT count(*)::int AS n FROM pg_trigger WHERE NOT tgisinternal AND tgname IN ('sl_excel_child_version','sl_excel_plan_version')",
    );
    assert.equal(triggers.rows[0].n, 12);
    assert.equal(
      (await pg.query<Record<string, unknown>>("SHOW lock_timeout")).rows[0]
        .lock_timeout,
      "0",
    );
  } finally {
    await pg.close();
  }
});
test("failing DDL rolls back the ENTIRE migration including earlier schema files", async () => {
  const pg = new PGlite();
  try {
    const sources = await Promise.all(SCHEMA_FILES.map(load));
    await assert.rejects(
      applyMigration(client(pg), [...sources, "SELECT 1/0;"]),
    );
    assert.equal(
      (
        await pg.query<Record<string, unknown>>(
          "SELECT to_regclass('public.plans') AS table",
        )
      ).rows[0].table,
      null,
    );
    assert.equal(
      (
        await pg.query<Record<string, unknown>>(
          "SELECT count(*)::int AS n FROM pg_type WHERE typname='plan_status'",
        )
      ).rows[0].n,
      0,
    );
  } finally {
    await pg.close();
  }
});
test("schema-6 failure preserves pre-existing plans and leaves no partial Excel schema", async () => {
  const pg = new PGlite();
  try {
    await applyMigration(
      client(pg),
      await Promise.all(SCHEMA_FILES.slice(0, -1).map(load)),
    );
    await pg.query<Record<string, unknown>>(
      "INSERT INTO customers(id,name,email) VALUES('00000000-0000-4000-8000-000000000001','Manual','test@example.invalid')",
    );
    await pg.query<Record<string, unknown>>(
      "INSERT INTO plans(customer_id,private_token,title) VALUES('00000000-0000-4000-8000-000000000001','keep-token','Keep this plan')",
    );
    const before = await pg.query<Record<string, unknown>>(
      "SELECT * FROM plans",
    );
    await assert.rejects(
      applyMigration(client(pg), [
        await load("schema-6-excel.sql"),
        "SELECT 1/0;",
      ]),
    );
    assert.deepEqual(
      (await pg.query<Record<string, unknown>>("SELECT * FROM plans")).rows,
      before.rows,
    );
    assert.equal(
      (
        await pg.query<Record<string, unknown>>(
          "SELECT to_regclass('public.plan_excel_revisions') AS table",
        )
      ).rows[0].table,
      null,
    );
    assert.equal(
      (
        await pg.query<Record<string, unknown>>(
          "SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='plans' AND column_name='content_version'",
        )
      ).rows[0].n,
      0,
    );
  } finally {
    await pg.close();
  }
});
test("migration refuses ambient DATABASE_URL, production labels and mismatched/pooler targets", () => {
  assert.throws(
    () => migrationTarget({ DATABASE_URL: "postgres://secret" }),
    /PLAN_MIGRATION_ENV/,
  );
  assert.throws(
    () => migrationTarget({ PLAN_MIGRATION_ENV: "production" }),
    /production is refused/,
  );
  const env = {
    PLAN_MIGRATION_ENV: "staging",
    PLAN_MIGRATION_DATABASE_URL:
      "postgresql://test:test@ep-test.neon.tech/neondb",
    PLAN_MIGRATION_EXPECTED_HOST: "ep-test.neon.tech",
    PLAN_MIGRATION_EXPECTED_BRANCH_ID: "br-test",
  };
  assert.equal(migrationTarget(env).branch, "br-test");
  assert.throws(
    () => migrationTarget(env, ["ep-test-pooler.neon.tech"]),
    /protected/,
  );
  assert.throws(
    () =>
      migrationTarget({
        ...env,
        PLAN_MIGRATION_EXPECTED_HOST: "another.neon.tech",
      }),
    /approved direct/,
  );
  assert.throws(
    () =>
      migrationTarget({
        ...env,
        PLAN_MIGRATION_DATABASE_URL:
          "postgresql://test:test@ep-test-pooler.neon.tech/neondb",
        PLAN_MIGRATION_EXPECTED_HOST: "ep-test-pooler.neon.tech",
      }),
    /unpooled/,
  );
  const run = spawnSync(
    process.execPath,
    ["scripts/plan-migrate.mjs", "--apply"],
    {
      env: {
        NODE_ENV: "test",
        PATH: process.env.PATH,
        DATABASE_URL:
          "postgresql://username:do-not-log@unclassified.invalid/db",
      },
      encoding: "utf8",
    },
  );
  assert.notEqual(run.status, 0);
  assert.ok(!run.stderr.includes("do-not-log"));
  assert.match(run.stderr, /PLAN_MIGRATION_ENV/);
});
test("parent lock is a separate statement before any child mutation; direct SQL remains versioned", async () => {
  const pg = new PGlite();
  try {
    await applyMigration(client(pg), await Promise.all(SCHEMA_FILES.map(load)));
    const c = (
      await pg.query<Record<string, unknown>>(
        "INSERT INTO customers(name,email) VALUES('Parent lock','test@example.invalid') RETURNING id",
      )
    ).rows[0];
    const p = (
      await pg.query<Record<string, unknown>>(
        "INSERT INTO plans(customer_id,private_token,title) VALUES($1,'parent-lock','Plan') RETURNING id,content_version",
        [c.id],
      )
    ).rows[0];
    const commands = contentMutationCommands(
      "destinations",
      "plan",
      String(p.id),
      "INSERT INTO destinations(plan_id,position,name) VALUES($1,0,'Island')",
      [p.id],
    );
    assert.match(commands[1].text, /FOR NO KEY UPDATE/);
    assert.match(commands[2].text, /INSERT INTO destinations/);
    await client(pg).transaction(commands);
    assert.equal(
      (
        await pg.query<Record<string, unknown>>(
          "SELECT content_version FROM plans WHERE id=$1",
          [p.id],
        )
      ).rows[0].content_version,
      1,
    );
    assert.throws(
      () =>
        contentMutationCommands(
          "arbitrary",
          "record",
          "id",
          "DELETE FROM x",
          [],
        ),
      /Unsupported/,
    );
    const dest = (
      await pg.query<Record<string, unknown>>("SELECT id FROM destinations")
    ).rows[0];
    const update = contentMutationCommands(
      "destinations",
      "record",
      String(dest.id),
      "UPDATE destinations SET name='Updated' WHERE id=$1",
      [dest.id],
    );
    await client(pg).transaction(update);
    assert.equal(
      (
        await pg.query<Record<string, unknown>>(
          "SELECT content_version FROM plans WHERE id=$1",
          [p.id],
        )
      ).rows[0].content_version,
      2,
    );
  } finally {
    await pg.close();
  }
});
test("only aborted deadlock/serialization transactions are retried, with a strict bound", async () => {
  let calls = 0;
  assert.equal(
    await retryTransaction(async () => {
      if (++calls < 3)
        throw Object.assign(new Error("rollback"), { code: "40P01" });
      return "saved";
    }),
    "saved",
  );
  assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(
    retryTransaction(async () => {
      calls++;
      throw Object.assign(new Error("conflict"), { code: "P0001" });
    }),
  );
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(
    retryTransaction(async () => {
      calls++;
      throw Object.assign(new Error("serialization"), { code: "40001" });
    }),
  );
  assert.equal(calls, 3);
});

test("legacy JSON remains opt-in, idempotent and part of the schema transaction", async () => {
  const pg = new PGlite();
  try {
    const sources = await Promise.all(SCHEMA_FILES.map(load));
    const data = {
      customers: [
        {
          id: "00000000-0000-4000-8000-000000000011",
          name: "Legacy",
          email: "legacy@example.invalid",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      plans: [
        {
          id: "00000000-0000-4000-8000-000000000012",
          customerId: "00000000-0000-4000-8000-000000000011",
          privateToken: "legacy-test-only",
          title: "Legacy plan",
          status: "DRAFT",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    };
    await applyMigration(client(pg), sources, legacyImportCommands(data));
    await applyMigration(client(pg), sources, legacyImportCommands(data));
    assert.equal(
      (
        await pg.query<Record<string, unknown>>(
          "SELECT count(*)::int AS n FROM plans",
        )
      ).rows[0].n,
      1,
    );
    const before = (await pg.query("SELECT * FROM plans")).rows;
    await assert.rejects(
      applyMigration(client(pg), sources, [
        ...legacyImportCommands(data),
        { text: "SELECT 1/0", values: [] },
      ]),
    );
    assert.deepEqual((await pg.query("SELECT * FROM plans")).rows, before);
  } finally {
    await pg.close();
  }
});
