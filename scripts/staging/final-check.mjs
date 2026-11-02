import { readFile, writeFile } from "node:fs/promises";
import {
  configuration,
  identity,
  ROOT,
  BRANCH,
  ASSERT_TARGET,
  safeFailure,
} from "./guard.mjs";
try {
  const config = await configuration();
  await identity(config);
  const latest = JSON.parse(
    await readFile(
      new URL(".env.excel-predeploy/latest-recovery.json", ROOT),
      "utf8",
    ),
  );
  const recovery = JSON.parse(await readFile(latest.receipt, "utf8"));
  const baseline = JSON.parse(
    await readFile(recovery.backupDirectory + "/baseline.private.json", "utf8"),
  ).baseline;
  const [objects, versions] = await config.sql
    .transaction(
      [
        config.sql.query(ASSERT_TARGET),
        config.sql.query(
          "SELECT (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public') AS public_tables,EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='plan_excel_previews' AND indexname='idx_excel_previews_expiry') AS expiry_index,(SELECT count(*)::int FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal AND t.tgname IN ('sl_excel_child_version','sl_excel_plan_version') AND t.tgenabled='O') AS enabled_version_triggers",
        ),
        config.sql.query(
          "SELECT count(*)::int AS unexpected_versions FROM plans WHERE id=ANY($1::uuid[]) AND content_version<>0",
          [baseline.plans.ids],
        ),
      ],
      { readOnly: true },
    )
    .then((r) => r.slice(1));
  if (
    objects[0].public_tables !== 16 ||
    !objects[0].expiry_index ||
    objects[0].enabled_version_triggers !== 12 ||
    versions[0].unexpected_versions !== 0
  )
    throw new Error("FINAL_SCHEMA_CHECK_FAILED");
  const result = {
    passed: true,
    branch: BRANCH,
    readOnly: true,
    ...objects[0],
    originalPlanVersionCountersUnchanged: true,
    completedAt: new Date().toISOString(),
  };
  await writeFile(
    recovery.backupDirectory + "/final-schema-check.json",
    JSON.stringify(result, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(result));
} catch (error) {
  safeFailure(error);
}
