import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes, createHmac } from "node:crypto";
import { once } from "node:events";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pg, isolatedFetch } from "./isolated-neon.mjs";
const secret = randomBytes(24).toString("hex");
const bridge = createServer(async (req, res) => {
  if (req.headers["x-test-secret"] !== secret) {
    res.writeHead(403).end();
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const result = await isolatedFetch("", {
    body: Buffer.concat(chunks).toString(),
  });
  res
    .writeHead(result.status, { "content-type": "application/json" })
    .end(await result.text());
});
bridge.listen(0, "127.0.0.1");
await once(bridge, "listening");
const portProbe = createServer();
portProbe.listen(0, "127.0.0.1");
await once(portProbe, "listening");
const port = portProbe.address().port;
await new Promise((resolve) => portProbe.close(resolve));
const base = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  ADMIN_PASSWORD: "isolated-test-only",
  STAYLOCAL_TEST_BRIDGE: `http://127.0.0.1:${bridge.address().port}`,
  STAYLOCAL_TEST_BRIDGE_SECRET: secret,
  NEXT_TELEMETRY_DISABLED: "1",
  BASE_URL: base,
};
const server = spawn(
  process.execPath,
  [
    "--import",
    "./tests/isolated-neon.mjs",
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { env, stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
server.stdout.on("data", (b) => (logs += b));
server.stderr.on("data", (b) => (logs += b));
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    try {
      if ((await fetch(`${base}/admin/login`)).status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, logs);
  const legacy = spawn(
    process.execPath,
    ["--import", "./tests/isolated-neon.mjs", "scripts/plan-e2e-test.mjs"],
    { env, stdio: "inherit" },
  );
  const [legacyCode] = await once(legacy, "exit");
  assert.equal(legacyCode, 0, "existing HTTP smoke suite");
  assert.equal(
    (await fetch(`${base}/admin/plans/excel?mode=template`)).status,
    401,
  );
  const now = Math.floor(Date.now() / 1000),
    body = Buffer.from(
      JSON.stringify({ v: 1, sub: "admin", iat: now, exp: now + 3600 }),
    ).toString("base64url");
  const cookie = `sl_admin=${body}.${createHmac("sha256", env.ADMIN_SESSION_SECRET).update(body).digest("base64url")}`;
  const headers = { cookie, origin: base };
  const response = await fetch(`${base}/admin/plans/import`, { headers });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Download Blank Template/);
  const template = await fetch(`${base}/admin/plans/excel?mode=template`, {
    headers,
  });
  assert.equal(template.status, 200);
  assert.ok((await template.arrayBuffer()).byteLength > 1000);
  const customer = (
    await pg.query(
      "INSERT INTO customers(name,email) VALUES('App smoke','smoke@example.invalid') RETURNING id",
    )
  ).rows[0];
  const upload = await fetch(
    `${base}/admin/plans/excel?mode=preview&customer=${customer.id}`,
    {
      method: "POST",
      headers: { ...headers, "x-file-name": "andaman.xlsx" },
      body: await readFile("outputs/excel/andaman-sample.xlsx"),
    },
  );
  const preview = await upload.json();
  assert.equal(upload.status, 200, JSON.stringify(preview));
  const confirm = await fetch(`${base}/admin/plans/excel?mode=confirm`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({
      preview: preview.preview,
      selected: preview.changes.map((c) => c.key),
    }),
  });
  const saved = await confirm.json();
  assert.equal(confirm.status, 200, JSON.stringify(saved));
  const builder = await fetch(`${base}/admin/plans/${saved.planId}`, {
    headers,
  });
  assert.equal(builder.status, 200);
  assert.match(await builder.text(), /Update from Excel/);
  if (process.argv.includes("--browser")) {
    const { verifyBrowser } = await import("./excel-browser-check.mjs");
    await verifyBrowser({ base, cookie, planId: saved.planId, pg });
  }
  console.log(
    "Excel running-app smoke: authenticated template, import page, preview, confirmation and builder passed.",
  );
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  server.kill("SIGTERM");
  await once(server, "exit");
  await new Promise((resolve) => bridge.close(resolve));
  await pg.close();
}
