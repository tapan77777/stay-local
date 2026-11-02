# Excel system pre-deployment verification

**Historical assessment.** Local remediation results and the current guarded staging procedure are documented in [excel-staging-readiness.md](excel-staging-readiness.md). This original report is retained as evidence of the initial review.

Assessment date: 2026-10-31. Decision: **NO-GO — not yet cleared for production deployment.**

This pass made no remote database writes, backups, migrations, plan imports, Git pushes or deployments. Application code, dependencies and environment files were not changed. Only this report was added. Previously passing isolated tests are historical evidence, not a substitute for real Neon verification.

## Verification matrix

FAIL / BLOCKED means a required verification could not be executed safely; it does not mean the application behavior was observed failing.

| # | Verification | Result | Evidence / reason |
|---|---|---|---|
| 1 | Identify database environment | **FAIL / BLOCKED** | Local `.env.local` contains a pooled Neon connection with SSL required. Read-only metadata reports PostgreSQL 18.6, project `lucky-waterfall-84436365`, branch `br-broad-pond-b3nfbi06`. No app environment label is set. Its normalized endpoint/database differs from the linked Vercel `stay-local` production connection; this does not prove it is development/staging. Vercel preview and development have no DATABASE_URL. Neon control-plane credentials/tooling are unavailable, so the branch name/role cannot be confirmed. Treat local target as potentially production. |
| 2 | Migration backward compatibility | **PASS (static data/schema review)** | Additive column, tables and functions; existing content columns/FKs are not removed or rewritten by migration DML. Existing services use explicit projections/inserts. Read-only metadata confirms plans exist and the Excel version column/revisions table are absent. |
| 2 | Migration operational readiness | **FAIL** | Existing migration runner executes individual statements without a wrapping transaction or lock/statement timeouts. Interrupted application can leave partial installation, including dropped-but-not-recreated triggers. Trigger lock contention/deadlocks require real multi-connection verification. |
| 3 | Do not modify production | **PASS** | Remote SQL was a SELECT-only transaction with Neon `readOnly: true`; only environment/schema metadata was queried, not customer records. Vercel operations only read environment configuration. Temporary secret downloads used a private directory and were removed. |
| 4 | Back up and migrate a confirmed nonproduction Neon target | **FAIL / BLOCKED** | No verified staging/development target. No backup or migration attempted. |
| 5 | Create Andaman sample on real Neon | **FAIL / BLOCKED** | Stopped before test writes. Sample workbook exists at `outputs/excel/andaman-sample.xlsx`. |
| 6 | Real export → ferry 08:00 to 09:30; unrelated data unchanged | **FAIL / BLOCKED** | No verified staging target; not executed in this pass. |
| 7 | Real stale edits, duplicates, deletion, clearing and restoration | **FAIL / BLOCKED** | Not executed on real Neon. Prior isolated tests cover semantics but cannot establish concurrent PostgreSQL locking behavior. |
| 8 | Existing manually created plans after real migration | **FAIL / BLOCKED** | Existing schema was inspected without reading customer content. No real migration was applied, so post-migration functionality remains unverified. |
| 9 | Desktop/mobile admin usability | **FAIL / BLOCKED** | Static UI review only; no new rendered desktop/mobile browser acceptance run. Mobile sidebar navigation is hidden and the mobile header provides only dashboard/sign-out; direct Plans navigation is absent. Preview table overflow, long values, file selection and confirmation focus require browser checks. |
| 10 | Dependency security clearance | **FAIL** | Fresh npm audit: 27 affected package entries — 1 critical, 2 high, 24 moderate. Next.js runtime requires remediation before release. Details below. |

The branch can be identified privately in the [Neon Console](https://console.neon.tech/). A matching endpoint alone cannot establish the intended environment; an owner must verify the project/branch purpose and isolation. No connection username, password or full URL is included here.

## Migration findings

Reviewed `lib/plan/schema-6-excel.sql`, `scripts/plan-migrate.mjs`, existing plan/content services and `lib/plan/excel/store.ts`.

1. **No direct destructive migration DML.** No existing content table is dropped, truncated, deleted from or converted. The new revision FK cascades only when its parent plan is deleted. Preview cleanup operates on the new preview table. Adding `BIGINT NOT NULL DEFAULT 0` uses PostgreSQL's fast constant-default mechanism on the observed server version, but still needs a table lock. [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html).
2. **Blocking DDL exists.** ALTER TABLE takes an ACCESS EXCLUSIVE lock unless a weaker form is documented; CREATE TRIGGER takes SHARE ROW EXCLUSIVE, which conflicts with writes. This migration installs triggers on plans and eleven child tables. Small tables do not eliminate lock waits behind long-running transactions. [PostgreSQL locking](https://www.postgresql.org/docs/17/explicit-locking.html).
3. **Runner is not atomic.** `scripts/plan-migrate.mjs:77` awaits each statement separately. The plan trigger DROP and CREATE are separate statements. Failure between them can remove concurrency protection. Use one reviewed transaction with bounded lock wait and total statement time, and verify rollback on failure. Do not run the generic runner on an unidentified connection.
4. **Runtime lock-order risk (static finding, not a reproduced real-database failure).** Excel confirmation locks the plan first (`sl_excel_guard`), then changes child records. A normal UPDATE/DELETE can lock a child tuple before its BEFORE trigger requests the plan lock. Overlap can produce a parent/child deadlock. PostgreSQL aborts a participant, so transaction rollback protects the content, but manual edits can fail; neither path has general serialization/deadlock retry. The per-plan lock also serializes all child edits and increments the plan version for every affected row. Resolve the lock-order/retry design or demonstrate acceptable handling with real concurrent sessions before release.
5. **New tables IF NOT EXISTS is not a schema-diff validator.** On a previously partially installed target, verify columns, constraints, functions and all twelve triggers explicitly. A successful re-run alone does not prove schema compatibility.
6. **Rollback should preserve content.** If application rollback is needed after a deployment, roll back the app and retain the additive column/tables until a separate cleanup is reviewed. Do not drop revision history or restore an entire database over production to undo one plan. Plan-level revision restoration and database disaster recovery are different operations.

## Dependency findings

Fresh npm audit was queried during this pass. Counts aggregate affected packages, not distinct CVEs. No upgrade or automatic audit fix was run.

| Dependency | Installed | Assessment / action |
|---|---|---|
| next | 16.3.7 | **Release blocker.** App Router Server Actions are present in `lib/plan/actions.ts` and `actions-2a.ts`. The advisory describes unauthenticated CPU exhaustion for apps with at least one Server Action. Upgrade to a reviewed patched release; npm audit currently recommends 16.4.3. Keep eslint-config-next aligned and rerun bundled-doc review, tests and build. [Server Actions advisory](https://github.com/advisories/GHSA-p3m5-59mp-jv5r). |
| next: image RCE advisory | 16.3.7 | Conditional issue; installed sharp is 0.35.5, meeting the advisory's documented workaround. Do not count the audit flag alone as proof of current exploitability. Retain the patched sharp resolution on Linux deployment; upgrading Next is still required for other issues. [Image advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw). |
| next: typed-array cache RCE advisory | 16.3.7 | No app `use cache` directives/cacheComponents configuration were found. The described trigger was not identified, but the maintainer recommends upgrading even without matching functions. [Cache advisory](https://github.com/advisories/GHSA-673q-mjm6-r5xr). |
| source-map-js | 1.2.1 | High. Reaches PostCSS/Tailwind and Next's PostCSS dependency. No user-uploaded source-map processing was found in the Excel path; runtime reachability has not been demonstrated. Update to at least 1.2.2 and validate build/tooling. [Advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q). |
| zod | 4.6.5 | High; installed through development ESLint dependencies. The Excel parser does not use Zod. Update compatible transitive resolution to at least 4.6.6; lower production exposure does not make the advisory fixed. [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). |
| uuid / ExcelJS | 8.3.2 / 4.4.0 | Moderate transitive advisory concerns buffer APIs in v3/v5/v6; inspected ExcelJS call sites use v4 and the import engine uses node:crypto IDs. No affected Excel workflow path found. Track/pin a compatible fix rather than blindly downgrading ExcelJS. [UUID advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq). |
| minimatch / archive tooling / ESLint | Several vulnerable transitive versions | Moderate glob matching issue. Import code uses bounded in-memory XLSX/ZIP buffers, not user-selected filesystem glob patterns. Upgrade compatible dependencies and test; forcing minimatch's latest major across old callers can break APIs. [Advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249). |

Do not use `npm audit fix --force`: audit suggests major downgrades for some unrelated tooling/packages. The only source change from this verification is this report.

## Exact safe setup steps (not executed)

### 1. Establish an isolated target

In Neon Console, locate the project/branch IDs above and verify their purpose. Do not rename an existing branch and infer that it is safe. Create a separate `staylocal-excel-staging` schema-only branch using Branches → New branch → select parent → name → Schema only → Create. This copies schema without customer data. If schema-only branches are unavailable, create a separate empty Neon project and initialize only the five baseline schema files; do not clone customer data by default. [Neon schema-only instructions](https://neon.com/docs/guides/branching-schema-only).

Record the staging project ID, branch ID and endpoint in a private operator note. Verify that both staging and a separate disposable restore-test endpoint differ from the linked Vercel production endpoint and the unclassified local endpoint. Do not change `.env.local` or any Vercel environment during this setup. No deployment is needed to test locally.

### 2. Configure private local credentials and client tools

Install PostgreSQL client tools matching the observed server major (18 or newer supporting this server). `psql`, `pg_dump`, and `pg_restore` are not currently available on PATH.

Create `.env.excel-staging-service.conf` locally with the following libpq service sections. Replace placeholders privately from Neon Console's **direct/unpooled** connection details. The restore target must be a separate, disposable nonproduction database. Never put real values into chat, commits or shell command arguments.

```ini
[staylocal_excel_staging]
host=<verified staging direct hostname>
port=5432
dbname=neondb
user=<staging role>
password=<staging password>
sslmode=verify-full
sslrootcert=system

[staylocal_excel_restore]
host=<separate disposable restore-test direct hostname>
port=5432
dbname=neondb
user=<restore-test role>
password=<restore-test password>
sslmode=verify-full
sslrootcert=system
```

Create `.env.excel-staging.local` with a pooled URL for that same verified staging branch and fresh test-only admin/access secrets:

```dotenv
DATABASE_URL=<verified staging pooled URL>
ADMIN_PASSWORD=<unique staging password>
ADMIN_SESSION_SECRET=<unique random staging secret>
PLAN_ACCESS_SECRET=<different unique random staging secret>
```

Both filenames are covered by the existing `.env*` ignore rule. Do not enable shell tracing. Restrict permissions before adding credentials. In a fresh terminal:

```sh
umask 077
chmod 600 .env.excel-staging-service.conf .env.excel-staging.local
export PGSERVICEFILE="$PWD/.env.excel-staging-service.conf"
psql -X --dbname='service=staylocal_excel_staging' -v ON_ERROR_STOP=1 -c 'SHOW server_version;'
```

Confirm in Console that the service and application connections select the same staging branch; the version query alone is not sufficient environment identification.

### 3. Initialize baseline only if needed; capture manual-plan baseline

A schema-only branch should already have baseline tables. On a newly created empty project only, apply the baseline in one transaction:

```sh
PGOPTIONS='-c lock_timeout=5s -c statement_timeout=60s' psql -X --dbname='service=staylocal_excel_staging' -v ON_ERROR_STOP=1 --single-transaction -f lib/plan/schema.sql -f lib/plan/schema-2a.sql -f lib/plan/schema-3-devices.sql -f lib/plan/schema-4-module-images.sql -f lib/plan/schema-5-profile-photo.sql
```

Start the local app with the staging file explicitly loaded; Node's pre-existing environment values take precedence, so first use a fresh terminal with no exported production/database/admin overrides. Never start with bare `npm run dev` for this verification because it loads the unclassified `.env.local` database.

```sh
node --env-file=.env.excel-staging.local node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3092
```

Create a test customer and a plan manually in existing Plan Builder, populate at least one record in each module, and record their content, order, status, customer association, access window, token/device settings and existing guest behavior. Use synthetic test customer details only. Do not open Excel history yet; schema-6 is not installed. Stop the local app before migration.

### 4. Back up and prove restoration before migration

Use full database backup rather than an incomplete table subset: plans, customers, destinations, every module, devices, existing functions/enums and constraints must stay consistent.

```sh
mkdir -p .env.excel-predeploy
pg_dump --dbname='service=staylocal_excel_staging' --format=custom --no-owner --no-privileges --file=.env.excel-predeploy/staging-before.dump
pg_restore --list .env.excel-predeploy/staging-before.dump > .env.excel-predeploy/staging-before.contents
shasum -a 256 .env.excel-predeploy/staging-before.dump > .env.excel-predeploy/staging-before.sha256
```

Then verify restoration **only to the separate disposable restore-test service confirmed in step 1**. The following command replaces objects on that disposable target; never substitute the staging, unclassified or production service:

```sh
pg_restore --dbname='service=staylocal_excel_restore' --clean --if-exists --exit-on-error --no-owner --no-privileges .env.excel-predeploy/staging-before.dump
```

Compare table row counts and the synthetic manual plan on staging and restored targets. A readable archive/list/checksum alone is not proof of successful recovery. Preserve the backup privately with its checksum. If any command fails, stop and do not migrate.

### 5. Apply only schema-6 safely on staging

After the backup/restore check and migration review, apply the pending file using one transaction and bounded waits. Do not use the current unguarded per-statement runner for pre-deployment acceptance:

```sh
PGOPTIONS='-c lock_timeout=5s -c statement_timeout=60s' psql -X --dbname='service=staylocal_excel_staging' -v ON_ERROR_STOP=1 --single-transaction -f lib/plan/schema-6-excel.sql
```

On a lock timeout/error, verify rollback and investigate; do not disable timeouts or rerun against a different endpoint. Check that content_version, both Excel tables, their constraints/functions/indexes and all twelve content-version triggers exist and are enabled. Verify baseline row counts and content did not change during DDL. Resume the local app with the explicit staging environment file.

### 6. Execute real workflow acceptance

1. Import `outputs/excel/andaman-sample.xlsx` for a new synthetic test customer. Verify exactly one DRAFT, expected destination/day/stay/help content, and unchanged manual plan. Record only test identifiers.
2. Export it. Change only Itinerary's morning ferry text from `08:00 ferry to Havelock` to `09:30 ferry to Havelock`. Upload/preview/confirm. Compare all plan/module content, status, access fields and other plans; only the intended text and expected technical version/timestamp/history/receipt fields may differ.
3. Retry the original import's identical bytes and repeat confirmation. Verify no new plan, rows or revisions are created.
4. Export, edit manually, upload stale export: conflict. Separately create preview, then edit manually before confirm: conflict and no partial writes.
5. On fresh exports, test blank preservation, `[CLEAR]`, adding rows, deleting a row, rejecting an invalid parent deletion, and explicitly deleting/moving linked records. Inspect before confirming.
6. Restore a previous revision. Verify restored identifiers/FKs/order and preserved customer/status/access/token/device settings; compare unrelated plan content byte-for-byte or through a canonical snapshot hash.
7. Run independent real PostgreSQL sessions for overlapping manual edits and Excel confirmation, concurrent duplicate confirms, and two competing updates. Reproduce/resolve the lock-order concern and verify rollback, retries/conflict behavior and absence of unintended overwrites. Disposable PGlite serial execution is insufficient.
8. Recheck the manually created plan's builder, customer entry/name/device/access behavior and all populated modules after migration and Excel operations.
9. In a real browser check desktop (1440×900) and mobile (390×844 and 320×568): plans entry links, customer select, file input, validation errors, long diff text, horizontal scrolling confined to tables, nested preview scroll, checkbox labels, keyboard focus, loading/disabled controls, confirmation navigation, save message, history and restore preview. Capture only synthetic test data. Fix or explicitly accept the mobile navigation limitation.
10. Complete the dependency remediation, rerun audit, isolated suites, real Neon suites, TypeScript/lint/build, and reassess release readiness. A local build pass cannot waive an unresolved runtime security advisory or unverified target.

Production migration and deployment remain separately gated on explicit owner approval. No production operation is included in these setup commands.
