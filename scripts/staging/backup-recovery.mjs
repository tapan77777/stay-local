import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, chmod, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { once } from "node:events";
import {
  configuration,
  identity,
  pgEnvironment,
  fingerprintSQL,
  schemaSQL,
  BRANCH,
  PROJECT,
  ROOT,
  TABLES,
  safeFailure,
} from "./guard.mjs";
const BIN = process.env.STAYLOCAL_PG_BIN;
const run = (name, args, env) => {
  const r = spawnSync(`${BIN}/${name}`, args, {
    env,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 180000,
  });
  if (r.status !== 0) throw new Error(name.toUpperCase() + "_FAILED");
  return r.stdout.trim();
};
const hash = (value) => createHash("sha256").update(value).digest("hex");
let localEnv,
  started = false;
try {
  if (!BIN) throw new Error("POSTGRES_TOOLS_REQUIRED");
  const config = await configuration();
  console.log(await identity(config));
  const probe = JSON.parse(
    run(
      "psql",
      [
        "-X",
        "-A",
        "-t",
        "-c",
        "SELECT json_build_object('branch',current_setting('neon.branch_id',true),'project',current_setting('neon.project_id',true),'read_only',current_setting('transaction_read_only'))",
      ],
      pgEnvironment(config.direct),
    ),
  );
  if (
    probe.branch !== BRANCH ||
    probe.project !== PROJECT ||
    probe.read_only !== "on"
  )
    throw new Error("BACKUP_CONNECTION_IDENTITY_MISMATCH");
  const version = run("pg_dump", ["--version"], process.env);
  if (!/\b18\./.test(version)) throw new Error("POSTGRES_VERSION_MISMATCH");
  const backupRoot = new URL(".env.excel-predeploy/", ROOT);
  await mkdir(backupRoot, { recursive: true, mode: 0o700 });
  await chmod(backupRoot, 0o700);
  const dir = await mkdtemp(backupRoot.pathname + "verified-");
  await chmod(dir, 0o700);
  const [beforeRows, schemaRows, extensions] = await config.sql
    .transaction(
      [
        config.sql.query("SELECT set_config('TimeZone','UTC',true)"),
        config.sql.query(fingerprintSQL()),
        config.sql.query(schemaSQL),
        config.sql.query(
          "SELECT extname,extversion FROM pg_extension ORDER BY extname",
        ),
      ],
      { readOnly: true },
    )
    .then((r) => [r[1], r[2], r[3]]);
  const baseline = beforeRows[0].fingerprint,
    schema = schemaRows[0].schema;
  await writeFile(
    `${dir}/baseline.private.json`,
    JSON.stringify({ baseline, schema, extensions }),
    { mode: 0o600 },
  );
  await identity(config);
  const dump = `${dir}/staging-before.dump`;
  run(
    "pg_dump",
    ["--format=custom", "--no-owner", "--no-privileges", "--file", dump],
    pgEnvironment(config.direct),
  );
  await chmod(dump, 0o600);
  const checksum = hash(await readFile(dump));
  await writeFile(
    `${dir}/staging-before.sha256`,
    `${checksum}  staging-before.dump\n`,
    { mode: 0o600 },
  );
  const contents = run("pg_restore", ["--list", dump], process.env);
  await writeFile(`${dir}/archive.contents`, contents, { mode: 0o600 });
  if (
    !contents.includes("TABLE DATA") ||
    !TABLES.every((table) => contents.includes(table))
  )
    throw new Error("BACKUP_CONTENTS_MISSING");
  if (hash(await readFile(dump)) !== checksum)
    throw new Error("BACKUP_CHECKSUM_MISMATCH");
  console.log(
    JSON.stringify({
      backupPassed: true,
      archiveBytes: (await readFile(dump)).length,
      sha256: checksum,
      archiveContentsVerified: true,
      tools: version,
      extensions: extensions.map((e) => e.extname),
    }),
  );
  // Fresh, private local cluster. Unix socket only; remote URLs are never accepted here.
  const localRoot = await mkdtemp("/tmp/staylocal-excel-recovery-");
  await chmod(localRoot, 0o700);
  const socket = `${localRoot}/socket`;
  await mkdir(socket, { mode: 0o700 });
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((r) => server.close(r));
  localEnv = {
    ...process.env,
    PGHOST: socket,
    PGPORT: String(port),
    PGDATABASE: "postgres",
    PGUSER: "staylocal_recovery_admin",
    PGPASSWORD: "",
    PGSSLMODE: "disable",
    PGOPTIONS: "-c timezone=UTC",
  };
  run(
    "initdb",
    [
      "-D",
      `${localRoot}/data`,
      "--username=staylocal_recovery_admin",
      "--auth-local=trust",
      "--auth-host=reject",
      "--locale=C",
      "--encoding=UTF8",
      "--no-instructions",
    ],
    localEnv,
  );
  run(
    "pg_ctl",
    [
      "-D",
      `${localRoot}/data`,
      "-l",
      `${localRoot}/server.log`,
      "-o",
      `-k ${socket} -p ${port} -c listen_addresses= -c timezone=UTC`,
      "-w",
      "start",
    ],
    localEnv,
  );
  started = true;
  const localIdentity = JSON.parse(
    run(
      "psql",
      [
        "-X",
        "-A",
        "-t",
        "-c",
        "SELECT json_build_object('branch',current_setting('neon.branch_id',true),'local',inet_server_addr() IS NULL,'user',current_user,'data_directory',current_setting('data_directory'))",
      ],
      localEnv,
    ),
  );
  if (
    localIdentity.branch ||
    localIdentity.local !== true ||
    localIdentity.user !== "staylocal_recovery_admin" ||
    localIdentity.data_directory !== `${localRoot}/data`
  )
    throw new Error("DISPOSABLE_RESTORE_IDENTITY_FAILED");
  run("createdb", ["staylocal_excel_recovery"], localEnv);
  localEnv.PGDATABASE = "staylocal_excel_recovery";
  // Remove only the empty default public schema in this newly created,
  // identity-checked local database when the archive creates public itself.
  if (/\bSCHEMA - public\b/.test(contents)) {
    const objects = run(
      "psql",
      [
        "-X",
        "-A",
        "-t",
        "-c",
        "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'",
      ],
      localEnv,
    );
    if (objects !== "0") throw new Error("DISPOSABLE_DATABASE_NOT_EMPTY");
    run(
      "psql",
      ["-X", "-v", "ON_ERROR_STOP=1", "-c", "DROP SCHEMA public"],
      localEnv,
    );
  }
  // Fresh database: no --clean and no connection string arguments.
  run(
    "pg_restore",
    [
      "--dbname=staylocal_excel_recovery",
      "--exit-on-error",
      "--no-owner",
      "--no-privileges",
      dump,
    ],
    localEnv,
  );
  const restored = JSON.parse(
    run("psql", ["-X", "-A", "-t", "-c", fingerprintSQL()], localEnv),
  );
  const restoredSchema = JSON.parse(
    run("psql", ["-X", "-A", "-t", "-c", schemaSQL], localEnv),
  );
  if (JSON.stringify(restored) !== JSON.stringify(baseline))
    throw new Error("RESTORED_DATA_MISMATCH");
  if (JSON.stringify(restoredSchema) !== JSON.stringify(schema))
    throw new Error("RESTORED_SCHEMA_MISMATCH");
  const [[after]] = await config.sql
    .transaction(
      [
        config.sql.query("SELECT set_config('TimeZone','UTC',true)"),
        config.sql.query(fingerprintSQL()),
      ],
      { readOnly: true },
    )
    .then((r) => [r[1]]);
  if (JSON.stringify(after.fingerprint) !== JSON.stringify(baseline))
    throw new Error("STAGING_CHANGED_DURING_BACKUP");
  const receipt = {
    backupPassed: true,
    restorePassed: true,
    verifiedBranch: BRANCH,
    verifiedProject: PROJECT,
    backupDirectory: dir,
    sha256: checksum,
    archiveBytes: (await readFile(dump)).length,
    tables: TABLES.length,
    dataHashesMatch: true,
    schemaConstraintsAndEnumsMatch: true,
    stagingUnchanged: true,
    recoveryTarget: "private local PostgreSQL 18, Unix socket only",
    localRecoveryDirectory: localRoot,
    completedAt: new Date().toISOString(),
  };
  await writeFile(`${dir}/receipt.json`, JSON.stringify(receipt, null, 2), {
    mode: 0o600,
  });
  await writeFile(
    new URL(".env.excel-predeploy/latest-recovery.json", ROOT),
    JSON.stringify({ receipt: `${dir}/receipt.json` }),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(receipt));
} catch (error) {
  safeFailure(error);
} finally {
  if (started && localEnv)
    try {
      const data = run(
        "psql",
        ["-X", "-A", "-t", "-c", "SHOW data_directory"],
        localEnv,
      );
      run("pg_ctl", ["-D", data, "-m", "fast", "-w", "stop"], localEnv);
    } catch {
      console.error(
        "Local recovery server shutdown requires inspection. No remote operation attempted.",
      );
    }
}
