import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { readFile, writeFile } from "node:fs/promises";
import {
  configuration,
  identity,
  ROOT,
  BRANCH,
  fingerprintSQL,
  safeFailure,
} from "./guard.mjs";
let server;
try {
  const config = await configuration();
  console.log(await identity(config));
  const latest = JSON.parse(
    await readFile(
      new URL(".env.excel-predeploy/latest-recovery.json", ROOT),
      "utf8",
    ),
  );
  const recovery = JSON.parse(await readFile(latest.receipt, "utf8"));
  const migrated = JSON.parse(
    await readFile(recovery.backupDirectory + "/migration-result.json", "utf8"),
  );
  if (!migrated.passed || migrated.branch !== BRANCH)
    throw new Error("STAGING_MIGRATION_REQUIRED");
  const baseline = JSON.parse(
    await readFile(recovery.backupDirectory + "/baseline.private.json", "utf8"),
  ).baseline;
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((r) => probe.close(r));
  const env = {
    ...process.env,
    ...config.env,
    BASE_URL: `http://127.0.0.1:${port}`,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  server = spawn(
    process.execPath,
    [
      "--import",
      "./scripts/staging/transport-guard.mjs",
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", () => {});
  server.stderr.on("data", () => {});
  let ready = false;
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch(env.BASE_URL + "/admin/login")).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw new Error("STAGING_APP_START_FAILED");
  const suites = {};
  for (const file of [
    "scripts/plan-e2e-test.mjs",
    "scripts/plan-devices-test.mjs",
  ]) {
    await identity(config);
    const child = spawn(
      process.execPath,
      ["--import", "./scripts/staging/transport-guard.mjs", file],
      { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] },
    );
    let out = "";
    child.stdout.on("data", (b) => (out += b));
    child.stderr.on("data", () => {});
    const [code] = await once(child, "exit");
    const matches = [...out.matchAll(/(\d+) passed,\s*(\d+) failed/g)];
    const last = matches.at(-1);
    if (code !== 0 || !last || Number(last[2]) !== 0)
      throw new Error("STAGING_REGRESSION_FAILED");
    suites[file] = { passed: Number(last[1]), failed: Number(last[2]) };
    console.log(JSON.stringify({ suite: file, ...suites[file] }));
  }
  const results = await config.sql.transaction(
    [
      config.sql.query("SELECT set_config('TimeZone','UTC',true)"),
      config.sql.query(fingerprintSQL(baseline)),
    ],
    { readOnly: true },
  );
  if (JSON.stringify(results[1][0].fingerprint) !== JSON.stringify(baseline))
    throw new Error("REGRESSION_CHANGED_BASELINE");
  const result = {
    passed: true,
    branch: BRANCH,
    suites,
    preexistingBaselineUnchanged: true,
    completedAt: new Date().toISOString(),
  };
  await writeFile(
    recovery.backupDirectory + "/regression-result.json",
    JSON.stringify(result, null, 2),
    { mode: 0o600 },
  );
  console.log(JSON.stringify(result));
} catch (error) {
  safeFailure(error);
} finally {
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}
