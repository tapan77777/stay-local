// No environment loading or database connection side effects in this module.
export const SCHEMA_FILES = [
  "schema.sql",
  "schema-2a.sql",
  "schema-3-devices.sql",
  "schema-4-module-images.sql",
  "schema-5-profile-photo.sql",
  "schema-6-excel.sql",
];
// PostgreSQL-aware splitter: preserve quoted semicolons, comments and dollar bodies.
export function splitSqlStatements(source) {
  const out = [];
  let buffer = "",
    quote = null,
    dollar = null,
    line = false,
    block = 0;
  for (let i = 0; i < source.length; i++) {
    const c = source[i],
      next = source[i + 1];
    if (line) {
      buffer += c;
      if (c === "\n") line = false;
      continue;
    }
    if (block) {
      buffer += c;
      if (c === "/" && next === "*") {
        buffer += next;
        i++;
        block++;
      } else if (c === "*" && next === "/") {
        buffer += next;
        i++;
        block--;
      }
      continue;
    }
    if (dollar) {
      if (source.startsWith(dollar, i)) {
        buffer += dollar;
        i += dollar.length - 1;
        dollar = null;
      } else buffer += c;
      continue;
    }
    if (quote) {
      buffer += c;
      if (c === quote) {
        if (next === quote) {
          buffer += next;
          i++;
        } else quote = null;
      } else if (c === "\\" && quote === "'" && source[i + 1]) {
        buffer += source[++i];
      }
      continue;
    }
    if (c === "-" && next === "-") {
      buffer += "--";
      i++;
      line = true;
      continue;
    }
    if (c === "/" && next === "*") {
      buffer += "/*";
      i++;
      block = 1;
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      buffer += c;
      continue;
    }
    if (c === "$") {
      const match = source.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/);
      if (match) {
        dollar = match[0];
        buffer += dollar;
        i += dollar.length - 1;
        continue;
      }
    }
    if (c === ";") {
      if (buffer.trim()) out.push(buffer.trim());
      buffer = "";
    } else buffer += c;
  }
  if (quote || dollar || block)
    throw new Error("Unterminated SQL quotation/comment.");
  if (buffer.trim()) out.push(buffer.trim());
  return out;
}
export function migrationCommands(sources) {
  const ddl = sources.flatMap(splitSqlStatements);
  if (
    ddl.some((sql) =>
      /\b(?:CREATE|DROP)\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/i.test(sql),
    )
  )
    throw new Error(
      "Nontransactional DDL requires a separate reviewed migration.",
    );
  return [
    {
      text: "SELECT set_config('lock_timeout','5s',true),set_config('statement_timeout','60s',true),CASE WHEN current_setting('server_version_num')::int >= 170000 THEN set_config('transaction_timeout','300s',true) END",
      values: [],
    },
    { text: "SELECT pg_advisory_xact_lock(1937006969, 6)", values: [] },
    ...ddl.map((text) => ({ text, values: [] })),
  ];
}
export async function applyMigration(client, sources, dataCommands = []) {
  const commands = [...migrationCommands(sources), ...dataCommands];
  // Neon batches all statements into ONE PostgreSQL transaction. A DDL failure
  // rolls back every schema file and transaction-local settings, not just one file.
  await client.transaction(commands.map((c) => client.query(c.text, c.values)));
  return commands.length - 2;
}
export function migrationTarget(env, protectedHosts = []) {
  if (!["development", "staging"].includes(env.PLAN_MIGRATION_ENV))
    throw new Error(
      "Set PLAN_MIGRATION_ENV to development or staging; production is refused.",
    );
  if (
    !env.PLAN_MIGRATION_DATABASE_URL ||
    !env.PLAN_MIGRATION_EXPECTED_HOST ||
    !env.PLAN_MIGRATION_EXPECTED_BRANCH_ID
  )
    throw new Error(
      "Explicit migration URL, expected host and expected Neon branch ID are required. DATABASE_URL is never used.",
    );
  let url;
  try {
    url = new URL(env.PLAN_MIGRATION_DATABASE_URL);
  } catch {
    throw new Error("Invalid migration connection.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech") ||
    url.hostname !== env.PLAN_MIGRATION_EXPECTED_HOST ||
    url.hostname.includes("-pooler.")
  )
    throw new Error(
      "Migration requires the explicitly approved direct/unpooled Neon hostname.",
    );
  if (
    protectedHosts.some(
      (host) =>
        host.replace("-pooler.", ".") === url.hostname.replace("-pooler.", "."),
    )
  )
    throw new Error(
      "Migration target matches a protected/unclassified database. Refusing.",
    );
  if (!url.pathname || url.pathname === "/")
    throw new Error("An explicit migration database is required.");
  return {
    url: env.PLAN_MIGRATION_DATABASE_URL,
    branch: env.PLAN_MIGRATION_EXPECTED_BRANCH_ID,
    environment: env.PLAN_MIGRATION_ENV,
  };
}

// Preserve the existing opt-in legacy JSON migration; include data in the same
// schema transaction so invalid legacy input cannot leave a partial import.
export function legacyImportCommands(data) {
  const customers = Array.isArray(data.customers) ? data.customers : [];
  const plans = Array.isArray(data.plans) ? data.plans : [];
  return [
    ...customers.map((c) => ({
      text: "INSERT INTO customers(id,name,email,whatsapp,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING",
      values: [
        c.id,
        c.name,
        c.email,
        c.whatsapp ?? "",
        c.createdAt,
        c.updatedAt,
      ],
    })),
    ...plans.map((p) => ({
      text: "INSERT INTO plans(id,customer_id,private_token,title,subtitle,start_date,end_date,status,access_starts_at,access_ends_at,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6::date,$7::date,$8::plan_status,$9::timestamptz,$10::timestamptz,$11,$12) ON CONFLICT(id) DO NOTHING",
      values: [
        p.id,
        p.customerId,
        p.privateToken,
        p.title ?? "",
        p.subtitle ?? "",
        p.startDate,
        p.endDate,
        p.status,
        p.accessStartsAt,
        p.accessEndsAt,
        p.createdAt,
        p.updatedAt,
      ],
    })),
  ];
}
