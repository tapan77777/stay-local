// Test-only preload: refuse any database connection except the pinned staging
// endpoint, and assert branch/project INSIDE every SQL transaction.
import { configuration, identity, ASSERT_TARGET } from "./guard.mjs";
const config = await configuration();
await identity(config);
const expectedHost = config.direct.hostname;
const original = globalThis.fetch;
globalThis.fetch = async (input, init = {}) => {
  const headers = new Headers(
    init.headers || (input instanceof Request ? input.headers : undefined),
  );
  const connection = headers.get("Neon-Connection-String");
  if (!connection) return original(input, init);
  let url;
  try {
    url = new URL(connection);
  } catch {
    throw new Error("STAGING_CONNECTION_REJECTED");
  }
  if (
    url.hostname.replace("-pooler.", ".") !== expectedHost ||
    url.pathname !== config.direct.pathname
  )
    throw new Error("NON_STAGING_CONNECTION_REJECTED");
  const body = JSON.parse(init.body),
    batch = Array.isArray(body.queries);
  const commands = batch ? body.queries : [body];
  let response;
  try {
    response = await original(input, {
      ...init,
      body: JSON.stringify({
        queries: [{ query: ASSERT_TARGET, params: [] }, ...commands],
      }),
    });
  } catch {
    throw new Error("STAGING_TRANSPORT_FAILED");
  }
  const data = await response.json();
  if (!response.ok) {
    const safe = [
      "EXCEL_STALE",
      "EXCEL_ALREADY_COMPLETED",
      "EXCEL_PREVIEW_EXPIRED",
      "EXCEL_CUSTOMER_MISSING",
      "STAGING_IDENTITY_MISMATCH",
    ].find((s) => String(data.message).includes(s));
    return Response.json(
      { message: safe || "STAGING_QUERY_FAILED", code: data.code },
      { status: response.status },
    );
  }
  const results = data.results?.slice(1);
  if (!results) throw new Error("STAGING_RESPONSE_INVALID");
  return Response.json(batch ? { results } : results[0]);
};
