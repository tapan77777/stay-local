# Excel staging readiness — security and migration remediation

Updated 2026-10-31.

**Staging execution update:** backup/recovery, schema-6 migration and real Neon acceptance have now passed. See [the final staging acceptance report](excel-staging-acceptance-report.md). The preparation findings below are retained as the pre-execution record. This report supersedes the **local** security/migration/UI findings in `excel-predeployment-verification.md`; that report remains the historical record of the original blocker review.

**Ready to begin staging acceptance once an owner provisions and verifies a separate Neon target. Not production-ready.** No configured Neon database was migrated or written. No deployment, Git push, infrastructure creation or live environment change was performed.

## Fixed locally

- Verified the Next.js Server Actions denial-of-service advisory applies to the original 16.3.7 application. Installed stable Next.js **16.4.3**, aligned **eslint-config-next 16.4.3**, and patched React/React DOM within their existing release line to **19.2.9**. Registry latest stable Next was 16.4.3; React latest 19.3.1 was deliberately not selected because a compatible 19.2.9 patch exists. Read the installed version-matched Next upgrade/action guides; AGENTS.md still points to bundled docs. [Next advisory](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [stable release](https://github.com/vercel/next.js/releases/tag/v16.4.3).
- Updated compatible transitive resolutions: **source-map-js 1.2.2**, **Zod 4.6.7**. Existing sharp **0.35.5** remains patched. Updated package-lock without forced major upgrades or automatic downgrade fixes. MapLibre retains the original 6.12.0 installed resolution.
- Migration runner no longer loads `.env.local` or uses `DATABASE_URL` for migration connections. It reads only the local file's database hostname as a denylist and refuses that unclassified endpoint, including pooler/direct equivalents. It requires explicit nonproduction intent, a separate direct Neon URL, exact expected hostname and exact expected branch ID, verified through a read-only query before any DDL. `--check` never applies DDL. These checks supplement operator verification; they cannot independently prove a deliberately mislabelled branch is nonproduction.
- Every schema file is loaded before connecting. All selected DDL executes in **one PostgreSQL transaction**, protected against concurrent migration runners by a transaction-scoped advisory lock. Failure rolls back all files. Lock timeout **5 seconds**, statement timeout **60 seconds**, total transaction timeout **300 seconds on PostgreSQL 17+**; older supported versions retain the first two timeouts. Errors never print connection strings or raw parameter values. The optional legacy `--import-json` path remains supported and joins the same transaction.
- Grouped trigger replacement into atomic DO blocks, preserving PostgreSQL 13 compatibility (CREATE OR REPLACE TRIGGER requires a newer server). The guarded runner still wraps the complete schema in one transaction. Existing content columns, enums, FKs and customer plans are retained. The migration remains additive; no schema/table data is deleted. A rollback test confirms even newly created types/tables and the Excel column disappear on a failed migration while pre-existing plans survive unchanged.
- All normal builder destination/module additions, updates, deletions and reorders now lock their **parent plan before executing the child statement**, matching Excel confirmation. The lock is a separate statement, so the following write gets a fresh READ COMMITTED snapshot after waiting. Parent locks use FOR NO KEY UPDATE, allowing FK key-share readers. The version triggers still cover direct SQL changes.
- Normal content and Excel transactions have lock timeout **5 seconds**, statement timeout **30 seconds**, total transaction timeout **120 seconds on PostgreSQL 17+**. Only PostgreSQL deadlock/serialization aborts (40P01 / 40001) retry, at most three attempts, with short backoff. Lost responses/network errors and stale-version conflicts are **not** blindly retried.

This removes the known parent/child inversion among supported application write paths without globally serializing unrelated plans. Arbitrary external SQL can still take locks in another order. Independent-session PostgreSQL contention and FK/cascade behavior remain staging acceptance checks, not claims established by serialized PGlite.

## Security audit

Fresh audit after remediation:

| Scope | Critical | High | Moderate |
|---|---:|---:|---:|
| Full dependency tree | 0 | 0 | 24 |
| Runtime only (`--omit=dev`) | 0 | 0 | 9 |

The remaining moderate entries are rooted in minimatch and UUID, with propagation through ExcelJS archive packages and development lint tools. UUID's reported issue concerns v3/v5/v6 buffer APIs; the inspected ExcelJS call sites use v4, and plan IDs use node:crypto. The application uses bounded in-memory XLSX/ZIP buffers rather than workbook-supplied filesystem glob patterns, so no affected Excel workflow path was identified. These are not declared fixed or universally non-exploitable. Retain tracking; upgrading old archive/minimatch callers across major APIs requires separate compatibility work. No remaining critical/high advisory was reported in either audit scope.

[UUID advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

## Verification evidence and limits

- PASS: 33 tests — 25 existing Excel tests plus 8 migration/transaction tests, all on disposable PGlite PostgreSQL.
- PASS: 19 existing device assertions using the isolated adapter.
- PASS: 37 existing running-app HTTP smoke assertions against the upgraded production Next server, backed only by disposable PGlite.
- PASS: clean `npm ci` from the updated lockfile, followed by the full test suite, TypeScript, ESLint, production build and whitespace checks.
- PASS: Browser verification used installed Google Chrome via Playwright, against the same isolated app. Desktop **1440×900**; mobile viewport emulation **390×844** and **320×568**. Screenshots/results are in `outputs/excel/browser/`, including `results.json` and the desktop/390px/320px preview captures. The final pass confirmed the ferry-only update, normal builder destination creation, history/restore preview, malformed-upload errors and zero browser runtime errors. This is Chromium viewport testing, not physical iOS/Android or Safari verification.
- Remaining usability limitation: the existing mobile shell has no direct Plans navigation; users can return via Dashboard or the page-level Back link. This was not redesigned in the security/migration task.
- BLOCKED: real Neon backup/restore drill; actual migration; real Andaman import/update/clear/delete/revision restore; simultaneous connections; and post-migration behavior of real manually created plans. Prior local success does not waive these gates.

Run commands:

```sh
npm test
npm run plan:test:devices:isolated
npm run lint
npx tsc --noEmit
npm run build
npm run plan:test:app:isolated
npm run plan:test:browser:isolated
npm audit --json
npm audit --omit=dev --json
```

Browser checks require Google Chrome installed, or modify the test harness to select another installed Playwright-supported browser. The test harness installs no database remotely and overrides all database connections with a deliberately invalid host and an authenticated loopback bridge to disposable PGlite. It verifies the ferry-only UI update with export content equality, normal builder destination creation, history/restore preview and malformed-upload errors. It does not run real Neon acceptance.

## Staging configuration inspection

The linked Vercel project is `stay-local`. Read-only Vercel inspection again found DATABASE_URL only for production; preview and development have no variables configured. The local endpoint still differs from the linked production endpoint, but remains **unclassified**, not assumed staging. No Neon control-plane credentials/CLI/connector were found. Previously identified local Neon project/branch IDs are in the historical verification report; they were not used for any migration in this work.

The Vercel environment comparison used private temporary files, emitted only equality/variable-name metadata, removed those files, and did not change any live values. There is no need to modify Vercel settings or publish a preview to begin local testing against a new staging branch.

## Exact owner setup steps

1. **Create and verify isolation in Neon Console.** Select the correct project → Branches → New branch → name `staylocal-excel-staging` → select **Schema only**, or create a separate empty project if unavailable. Do not copy customer data by default. Record its branch ID, direct/unpooled endpoint, pooled endpoint and database. Verify its purpose and separation from production and the unclassified local target. If permissions are missing, the Neon project owner must perform this step. [Neon branch instructions](https://neon.com/docs/guides/branching-schema-only).
2. **Create private local configuration.** The tracked `config/excel-staging.env.example` contains placeholders only:

   ```sh
   umask 077
   cp config/excel-staging.env.example .env.excel-staging.local
   chmod 600 .env.excel-staging.local
   ```

   Replace placeholders privately. DATABASE_URL is the new staging pooled URL; PLAN_MIGRATION_DATABASE_URL is its **direct/unpooled** URL; PLAN_MIGRATION_EXPECTED_HOST is that direct hostname; PLAN_MIGRATION_EXPECTED_BRANCH_ID is its Console branch ID. PLAN_MIGRATION_ENV must be staging or development. Generate fresh, distinct test-only admin/access secrets. Do not modify `.env.local` or live Vercel settings. Existing shell variables override Node --env-file values, so use a clean terminal and verify no inherited production overrides before proceeding.
3. **Run read-only preflight** only after owner verification:

   ```sh
   node --env-file=.env.excel-staging.local scripts/plan-migrate.mjs --check
   ```

   It must report the explicit staging branch verified. A mismatch, protected hostname, missing variable or unknown target is a stop condition. Setting an environment label alone is not proof of isolation.
4. **Establish a manual-plan baseline before migration.** Schema-only branching normally already supplies the five baseline schemas. On a separate empty project, initialize only those baseline files using the bounded single-transaction `psql` command in `docs/excel-predeployment-verification.md` step 3. Start the app with the explicit staging file (step 7 below) and create a synthetic manual plan through the existing builder. Record content/order/access behavior; stop the app before migration.
5. **Back up and prove recovery.** Install PostgreSQL 18-compatible psql/pg_dump/pg_restore clients. Use direct connections in private libpq services named `staylocal_excel_staging` and `staylocal_excel_restore`; see historical report steps 2 and 4 for exact service-file, full custom backup, checksum and restore commands. Restore only to a separate verified disposable target. Compare baseline data; do not apply schema-6 if recovery cannot be demonstrated. Never run a destructive restore command on production, the unclassified local target, or the staging source.
6. **Apply the pending migration on the verified staging branch**, after backup and recovery validation:

   ```sh
   node --env-file=.env.excel-staging.local scripts/plan-migrate.mjs --apply --only-excel
   ```

   The runner verifies branch identity read-only, then applies DDL atomically with bounded waits. Without `--only-excel`, it applies all baseline and Excel schema files together. No command falls back to the configured application's DATABASE_URL. No production mode is available. On any error, stop and inspect; do not increase timeouts blindly. Verify both Excel tables, column, indexes, functions and all twelve enabled triggers, and unchanged baseline content.
7. **Start locally against staging**, without deployment:

   ```sh
   node --env-file=.env.excel-staging.local node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3092
   ```

8. **Complete real acceptance.** Import `outputs/excel/andaman-sample.xlsx` as a DRAFT. Export; change only the ferry morning text from 08:00 to 09:30; re-import and compare unrelated content and settings. Test identical uploads/repeated confirmation; stale exports and post-preview edits; blanks and [CLEAR]; explicit deletes, child moves and invalid references; full revision restoration; and unchanged manual-plan behavior. Run separate PostgreSQL sessions for overlapping manual edits, Excel confirmation and duplicate submissions. Repeat desktop/mobile browser checks against staging. Record actual PASS/FAIL, including rollback/retry behavior and data comparisons.

**Readiness boundary:** local remediation is ready for this staging process. Staging provision/permissions and real-database acceptance are still required. Production readiness, any production migration, deployment and Git push remain outside this authorization.
