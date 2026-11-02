# Excel Import — controlled production release checklist

**Current existing-site release decision:** [latest focused report](staylocal-existing-production-release.md). Production identity is confirmed, all fresh code/build/browser tests pass, and local pnpm/deployment packaging is repaired. Production execution remains blocked on credential remediation, current backup/recovery, schema-6 migration and final approval. No new project/production branch is needed.

**2026-11-02 update:** the owner retrieved production identity from the authenticated diagnostic; fresh read-only SQL verified project `lucky-waterfall-84436365`, branch `br-broad-pond-b3nfbi06`. All 14 deployed baseline tables and 178 columns match. Earlier production-identity uncertainty below is historical. See [current production schema verification](excel-production-schema-verification.md). This does not approve migration or deployment.


**Original application identity checkpoint:** [fresh repository/Vercel verification](excel-original-application-identity.md) confirms `tapan77777/stay-local` → Vercel `stay-local`; v2 is separate. Original production Neon identity, and the relationship of the existing staging branch to it, remain unverified. Do not reset credentials or continue database operations until that mapping is established.

Prepared 2026-11-01 (Asia/Kolkata).

**Credential follow-up:** the exposed password is also present in `.env.local` for another unclassified endpoint. It is not proven staging-only. See [credential remediation and private verification steps](excel-credential-remediation.md). Rotation and production verification remain blocked; the private production placeholder file and read-only verifier are now prepared.

 **HOLD: production release is not approved or ready to execute.** Staging acceptance passed; production Neon identity/schema, credential remediation and production-specific recovery remain gates. No production database connection, backup, migration, write, environment change, deployment or Git push was performed during this release review. Public login/route checks and Vercel metadata/configuration reads were performed.

## Verified identity and outstanding target information

| Item | Result / evidence |
|---|---|
| Builder Vercel project | **VERIFIED:** `stay-local`, `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e`, team `team_0zlxAaQ3CsonSP48xRhd8ghC`, Node `24.x`. Local `.vercel/project.json` agrees. |
| Public builder | **VERIFIED:** `https://stay-local-beryl.vercel.app`. `/admin/plans` redirects to `/admin/login`; public login title is `StayLocal Admin — Sign in` and matches this repository's configured password form. No authentication POST or customer-plan page was requested. |
| Current production deployment | **VERIFIED at review:** `dpl_FYgpwS3iZ3xze1oJQciiz8USHHom`, `stay-local-qnuxes1vh-tapan77777s-projects.vercel.app`. Recheck immediately before release; do not roll back to a stale selection. |
| Other similarly named project | `staylocal-v2`, `prj_nBpytWrr3c0XzBDLVxX57OCI7lBz`, serves a different login page and has DATABASE_URL/NEXTAUTH_SECRET rather than this builder's admin variables. Do not deploy this release there without resolving that discrepancy. |
| Production Neon project/branch | **BLOCKED / NOT VERIFIED.** Vercel DATABASE_URL is sensitive; both environment pull and the read API return an empty value, not a usable connection URL. No production database query was attempted. Vercel variable presence is not proof of a valid URL or database identity. |
| Local database | `.env.local` remains unclassified and untouched. It is not a substitute for live Vercel production configuration. |
| Staging, for exclusion only | `excel-import-staging`, `br-cold-sea-b33m80x4`, project `lucky-waterfall-84436365`. Its production parent name does **not** independently establish which database the live builder uses. Never use this staging ID as the production target. |

Owner action: in the `stay-local` Vercel project's **Production** environment, establish which Neon endpoint is used. Because sensitive values cannot be downloaded here, recover the original URL from the authorized secret manager/Neon Console and compare its endpoint/database with the live configuration in an authorized console. If the endpoint cannot be inspected, request the project administrator's confirmation or an explicitly approved configuration reconciliation; do not silently replace the live URL. Record the Neon project's ID, branch ID, branch name and database, including whether it is protected/default. Obtain the **direct/unpooled URL for that same branch**. Configure these privately in `.env.excel-production.local` using `config/excel-production.env.example`, mode 600; never paste them into chat or alter `.env.local`.

Then run read-only identity checks against **both** URLs and require the independently confirmed project/branch IDs, matching database and server major. Use `neon(...).transaction([...], {readOnly:true})` or the libpq read-only procedure below. Stop on null/mismatched identity. Until then the production migration cannot be assigned a real branch ID and its command below is deliberately incomplete.

## Source, secret and security review

- **FIXED release blocker:** `config/excel-staging.env.example` had real staging connection credentials. Replaced both URLs, hostname and branch with placeholders and added the missing staging ADMIN_PASSWORD placeholder. No private environment file was changed. The compromised credential must be rotated by its owner in Neon. Determine every branch/application using that role/password first; do not assume a cloned branch's credential is isolated. Any production-affecting rotation needs separate approval and a coordinated environment update. Update only the authorized private staging configuration afterward and rerun staging connectivity/acceptance as needed. Do not print the replacement credential.
- **PASS after fix:** 256 Git-eligible files scanned for exact known local/staging passwords, URLs and secret values: no remaining matches. URL-shaped values in the example are now explicit placeholders. No staging branch/preload/private-env references in application runtime sources. This is a bounded scan, not proof that every possible unknown secret is absent.
- **PASS:** `.env.local`, `.env.excel-staging.local`, `.env.excel-predeploy/` and `.vercel/` are ignored and untracked. `.env*` also covers future production private configuration/service/backup files. Do not use `git add -f` or wildcard copying of the workspace. Staging operator scripts contain public target IDs and are deliberately staging-only; they are not production configuration or imported by the app.
- Use a clean release checkout containing only the reviewed tracked release files for deployment; exclude all local secrets, dumps, receipts and browser artifacts. Existing changes remain uncommitted. Pin a reviewed release commit and lockfile before approval; current HEAD alone does not contain the new feature. Recheck staged diff and secret scan before any later commit/push. No push is authorized here.
- Reviewed feature schema, atomic confirmation/revision path, authorization/origin checks, parent-first mutation services, migration core and packaging changes. No new production runtime environment variable is required. Shared admin authentication records actor `admin`, not individual administrator identities.
- Fresh full-tree npm audit: **0 critical, 0 high, 24 moderate affected entries**. Roots: minimatch amplification and UUID v3/v5/v6 buffer bounds. ExcelJS uses v4; bounded workbook processing does not accept filesystem glob patterns. No affected Excel workflow call path was identified; these advisories remain tracked, not declared fixed. See [UUID](https://github.com/advisories/GHSA-w5hq-g745-h8pq) and [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249). Audit exits 1 because moderate findings remain. No forced dependency upgrade was performed.
- Local checks this review: **33/33 tests PASS; TypeScript PASS; ESLint PASS**. Production build PASS (39 static pages; dynamic admin/customer routes retained). Prior real Neon acceptance, 37 HTTP and 19 device assertions are historical executed staging evidence in `excel-staging-acceptance-report.md`; they were not rerun against production.

## Production environment gate

Vercel metadata confirms Production-scoped keys: `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_PLAN_MAP_DEBUG`. The public login shows the admin form configured. Actual secret values, strength, URL validity and equality with Neon are **not independently verified** because sensitive reads are empty.

- DATABASE_URL: verified production branch, TLS enabled, existing app role has required table/function privileges after migration. App may use pooled connection. DDL/backup use separately obtained **direct/unpooled** connection and an authorized migration/backup role. Check role ownership/default privileges; a dump with `--no-owner --no-privileges` does not preserve grants.
- Preserve ADMIN_PASSWORD and ADMIN_SESSION_SECRET during this feature release. PLAN_ACCESS_SECRET currently falls back to ADMIN_SESSION_SECRET (then NEXTAUTH_SECRET); do not introduce/rotate an access secret casually, because device hashes and customer sessions depend on it. No requirement to add a new one for Excel.
- NEXT_PUBLIC_SITE_URL is optional for existing sharing links, not required by Excel. Verify links use the intended production domain after deployment.
- No staging/migration/test preload key was returned for Production. Keep NODE_OPTIONS test transport guards and PLAN_MIGRATION_* out of Vercel runtime. Treat `NEXT_PUBLIC_PLAN_MAP_DEBUG=1` as an existing debug setting requiring owner review, not an Excel dependency; no live change was made.
- Reconfirm function request/response and duration limits. Upload cap is 3 MiB raw XLSX, below Vercel's [4.5 MB request/response limit](https://vercel.com/docs/functions/limitations). Large export/preview responses and maximum-sized workbook time/memory behavior were not acceptance-tested. Keep the controlled release to representative small plans until those limits are measured. Client/server transaction timeouts do not extend Vercel's function duration.

## Read-only production preflight — blocked until identity is supplied

Use PostgreSQL client tools compatible with the actual server major (PG18.6 tools were tested on staging). No compatible tools are currently installed globally; the verified Postgres.app 18.6 image used in staging is detached. Mount/install approved official clients first; verify the distribution checksum and use an absolute tool path. Do not use the old PG13 pg_dump for a PG18 server.

Prepare a **private**, mode-600 libpq service file `.env.excel-production-service.conf`, with service `[staylocal_excel_production]` containing the confirmed **direct** host, port, database, role, password and TLS verification settings. Use `sslmode=verify-full` and the trusted CA configuration supported by the installed client. No URL/password in argv or shell history. Configure a different `[staylocal_excel_restore]` only if using a separately verified disposable remote restore branch; a fresh local Unix-socket database is preferred for the recovery drill. Do not reuse staging/production service names interchangeably.

The following are **operator templates, not commands executed in this review**. Replace the two identity placeholders only after independent owner confirmation. Never set production credentials to PLAN_MIGRATION_ENV=staging to bypass the existing runner.

```sh
export STAYLOCAL_PG_BIN='/absolute/path/to/approved/postgresql/bin'
export PGSERVICEFILE="$PWD/.env.excel-production-service.conf"
export PGSERVICE=staylocal_excel_production
export STAYLOCAL_RELEASE_BRANCH='REPLACE_WITH_VERIFIED_PRODUCTION_BRANCH_ID'
export STAYLOCAL_RELEASE_PROJECT='REPLACE_WITH_VERIFIED_PRODUCTION_PROJECT_ID'
PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=30000 -c lock_timeout=5000' \
  "$STAYLOCAL_PG_BIN/psql" -X -v ON_ERROR_STOP=on -At \
  -c "SELECT current_setting('neon.branch_id',true),current_setting('neon.project_id',true),current_setting('transaction_read_only'),current_setting('server_version');"
```

Read-only schema inspection must check all 14 baseline tables; every column used by `lib/plan/excel/schema.ts` and existing SQL, types/nullability/defaults, destination/plan foreign keys, enums, UUID defaults, image/profile fields from schemas 4/5, permissions and existing triggers. Check for partial/conflicting schema-6 objects, not merely table existence. Compare with schemas 1–5 and staging's verified baseline. Inspect active transactions/DDL, table sizes and external jobs; do not terminate sessions. Schema-6 compatibility remains **UNEXECUTED** on production. If schema differs, stop and review; do not apply earlier schemas or destructive corrections blindly.

## Backup and tested recovery gate — after separate approval

The **method** was executed successfully on staging: PG18.6 custom dump, archive/checksum inspection, restoration to a new private local PG18.6 server, all 14 tables' row counts/IDs/data hashes plus columns/constraints/enums matching. It does not prove a production backup that has not yet been taken. This new production wrapper/procedure has not yet been executed end-to-end.

1. Obtain explicit approval for the verified production target, backup and disposable recovery. Establish an admin/content-edit freeze covering backup through migration, candidate smoke tests and promotion. Coordinate all old deployments, workers and direct SQL writers; merely asking one browser to stop is insufficient. Do not expose customer links or tokens in logs. If writes cannot be quiesced, stop and design a snapshot/PITR and change-reconciliation procedure; separate transactions' fingerprints would otherwise be incomparable.
2. Reconfirm source identity immediately before backup. Set an owner-only backup directory, e.g. `.env.excel-production-backup/RELEASE_ID`, with `umask 077`. Keep private data encrypted at rest/in approved storage with a defined retention policy. `--no-owner --no-privileges` backs up application schema/data, not Neon infrastructure, roles, grants or role passwords; record required ownership/grants privately and verify them separately.
3. Capture a repeatable-read baseline and full dump while the freeze remains active:

```sh
umask 077
export STAYLOCAL_RELEASE_BACKUP="$PWD/.env.excel-production-backup/REPLACE_WITH_RELEASE_ID"
mkdir -p "$STAYLOCAL_RELEASE_BACKUP"
PGOPTIONS='-c default_transaction_read_only=on -c lock_timeout=5000' \
  "$STAYLOCAL_PG_BIN/psql" -X -qAt -v ON_ERROR_STOP=on \
  -f scripts/production/baseline-readonly.sql > "$STAYLOCAL_RELEASE_BACKUP/before.private.txt"
PGOPTIONS='-c default_transaction_read_only=on -c lock_timeout=5000 -c statement_timeout=120000' \
  "$STAYLOCAL_PG_BIN/pg_dump" --format=custom --no-owner --no-privileges \
  --file="$STAYLOCAL_RELEASE_BACKUP/before.dump"
"$STAYLOCAL_PG_BIN/pg_restore" --list "$STAYLOCAL_RELEASE_BACKUP/before.dump" \
  > "$STAYLOCAL_RELEASE_BACKUP/archive.contents"
shasum -a 256 "$STAYLOCAL_RELEASE_BACKUP/before.dump" > "$STAYLOCAL_RELEASE_BACKUP/before.sha256"
shasum -a 256 -c "$STAYLOCAL_RELEASE_BACKUP/before.sha256"
```

4. Restore to a **new private local** database (no TCP listener). Before running, resolve every `/absolute/...` placeholder; socket directory must be owner-only and empty/new. Use a new cluster, not any existing database. These commands require local OS permission to run PostgreSQL. Never point PGHOST at Neon for this local drill:

```sh
export STAYLOCAL_RECOVERY_ROOT='/absolute/private/new/recovery-directory'
mkdir -m 700 "$STAYLOCAL_RECOVERY_ROOT"
mkdir -m 700 "$STAYLOCAL_RECOVERY_ROOT/socket"
env -u PGSERVICE -u PGSERVICEFILE "$STAYLOCAL_PG_BIN/initdb" \
  -D "$STAYLOCAL_RECOVERY_ROOT/data" -U staylocal_recovery_admin -A trust --no-locale
# Trust is confined to a private Unix socket; TCP is disabled explicitly.
env -u PGSERVICE -u PGSERVICEFILE "$STAYLOCAL_PG_BIN/pg_ctl" \
  -D "$STAYLOCAL_RECOVERY_ROOT/data" -l "$STAYLOCAL_RECOVERY_ROOT/server.private.log" \
  -o "-k $STAYLOCAL_RECOVERY_ROOT/socket -h ''" -w start
env -u PGSERVICE -u PGSERVICEFILE "$STAYLOCAL_PG_BIN/createdb" \
  -h "$STAYLOCAL_RECOVERY_ROOT/socket" -U staylocal_recovery_admin staylocal_excel_recovery
# Only when the archive creates public, remove the EMPTY LOCAL default schema.
if rg -q 'SCHEMA - public ' "$STAYLOCAL_RELEASE_BACKUP/archive.contents"; then
  env -u PGSERVICE -u PGSERVICEFILE "$STAYLOCAL_PG_BIN/psql" \
    -h "$STAYLOCAL_RECOVERY_ROOT/socket" -U staylocal_recovery_admin \
    -d staylocal_excel_recovery -X -v ON_ERROR_STOP=on <<'SQL'
DO $$ BEGIN
  IF current_setting('neon.branch_id',true) IS NOT NULL
    OR EXISTS (SELECT 1 FROM pg_class WHERE relnamespace='public'::regnamespace)
    OR EXISTS (SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace)
    OR EXISTS (SELECT 1 FROM pg_type WHERE typnamespace='public'::regnamespace)
  THEN RAISE EXCEPTION 'RESTORE_TARGET_NOT_EMPTY_LOCAL'; END IF;
  DROP SCHEMA public;
END $$;
SQL
fi
env -u PGSERVICE -u PGSERVICEFILE "$STAYLOCAL_PG_BIN/pg_restore" \
  -h "$STAYLOCAL_RECOVERY_ROOT/socket" -U staylocal_recovery_admin \
  --dbname=staylocal_excel_recovery --exit-on-error --single-transaction \
  --no-owner --no-privileges "$STAYLOCAL_RELEASE_BACKUP/before.dump"
env -u PGSERVICE -u PGSERVICEFILE "$STAYLOCAL_PG_BIN/psql" \
  -h "$STAYLOCAL_RECOVERY_ROOT/socket" -U staylocal_recovery_admin \
  -d staylocal_excel_recovery -X -qAt -v ON_ERROR_STOP=on \
  -f scripts/production/baseline-readonly.sql > "$STAYLOCAL_RELEASE_BACKUP/restored.private.txt"
cmp "$STAYLOCAL_RELEASE_BACKUP/before.private.txt" "$STAYLOCAL_RELEASE_BACKUP/restored.private.txt"
env -u PGSERVICE -u PGSERVICEFILE "$STAYLOCAL_PG_BIN/pg_ctl" \
  -D "$STAYLOCAL_RECOVERY_ROOT/data" -m fast -w stop
```

The conditional empty-schema preparation above applies only to the new local recovery database, matching the staging drill. Stop if its safety check fails. Do not use a recovery path containing whitespace with this pg_ctl `-o` example. Ensure unrelated ambient PGHOST/PGDATABASE/PGOPTIONS are cleared in the dedicated recovery shell; explicit host/database flags override their relevant connection settings. Stop on any error. A nonempty public schema from initdb normally already exists; this archive should restore into it without `--clean`. If pg_restore reports schema conflicts, inspect the archive and use a freshly prepared empty disposable target rather than retrying against production. Store the SHA, tool/server versions, matching receipts, identity, time and operator in a private recovery receipt. Verify the source baseline is still identical. **No migration until recovery passes.**

## Migration command and ordering — prepared, not executed

**Migrate before the new app becomes live.** New Excel routes require schema-6. It is additive for existing content: one constant-default BIGINT column, two new tables, one index, three functions, and twelve triggers; no existing plan data is replaced. Old app reads remain compatible. However old child-first edit paths can invert the new trigger lock order: keep admin/background content edits frozen from migration until all writers use the new parent-first code. Brief DDL table locks can delay customer reads too; schedule a low-traffic window. A 5-second lock timeout means stop/review and reschedule, not terminate blockers or loop blindly.

The existing `npm run plan:migrate` deliberately **refuses production**. Use the separately reviewed psql wrapper `scripts/production/schema-6-release.sql` only after owner approval and successful backup/recovery. It owns one transaction, checks the verified Neon project/branch, rejects the known staging branch, takes the same migration advisory lock, sets lock 5s / statement 60s / transaction 300s (PG17+), applies only schema-6 and checks core objects before COMMIT. Identity mismatch or any failure rolls back the whole transaction. A release label is an operator safeguard, **not** a substitute for actual approval. No production IDs are prefilled because none are verified yet.

```sh
# APPROVAL REQUIRED. Variables/services must already have passed identity checks.
shasum -a 256 lib/plan/schema-6-excel.sql
# Must equal 5b160fc7ee41547429dbcbb7c21c668d49b968ebb50f8a4ce254da41e2f07540
"$STAYLOCAL_PG_BIN/psql" -X -v ON_ERROR_STOP=on \
  -v expected_branch_id="$STAYLOCAL_RELEASE_BRANCH" \
  -v expected_project_id="$STAYLOCAL_RELEASE_PROJECT" \
  -v approved_release='REPLACE_WITH_OWNER_APPROVED_RELEASE_ID' \
  -f scripts/production/schema-6-release.sql
```

After COMMIT, read-only verify both tables' complete columns/check/unique/PK/FK constraints, expiry index, all three functions and twelve enabled triggers, and all baseline columns/constraints/enums. Capture `baseline-readonly.sql` into `after-migration.private.txt` and compare with `before.private.txt` while edits remain frozen. Original plans must have content_version=0 on the first installation. If schema-6 was already partly/fully installed, stop beforehand and establish a reviewed version-aware baseline instead. Record the SQL checksum, branch/project, commit, operator, timestamps and result. Do not assume IF NOT EXISTS repaired a conflicting object.

## Application deployment sequence — approval required, not executed

1. Resolve every HOLD gate, credential rotation and identity/schema check. Pin reviewed source/lockfile in a clean release checkout. Rerun npm ci, tests, TypeScript, lint, build, audit and secret scan there. The clean checkout must contain neither `.env.local` nor staging secrets/backups; build locally only with deliberately selected safe configuration. Obtain explicit approval identifying target, revision, migration, deployment and synthetic smoke writes.
2. Re-read current production deployment metadata and record the fallback deployment ID and aliases. Verify it is healthy; review security and schema compatibility before treating it as a fallback. The observed ID above is a checkpoint, not a permanent rollback target. Verify the candidate's repository/project/root directory matches the builder.
3. Start edit freeze; approved production backup and successful separate recovery; preflight; migrate only schema-6; post-migration baseline check. Do not promote on any failure.
4. Build a **production-target** candidate without changing live aliases. Explicit IDs prevent accidentally deploying `staylocal-v2`:

```sh
# APPROVAL REQUIRED — creates a deployment, not executed here.
VERCEL_ORG_ID=team_0zlxAaQ3CsonSP48xRhd8ghC \
VERCEL_PROJECT_ID=prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e \
  vercel deploy --prod --skip-domain
```

5. Verify candidate deployment metadata, production variable **scope**, intended database identity and function runtime. Test on its deployment URL using the owner's authorized access method. Do not disable Vercel deployment protection or expose private plan tokens. Keep old aliases/writers frozen. Do not promote a staging-configured Preview deployment: production configuration must be used when building this candidate.
6. Execute the separately approved synthetic smoke below, then `vercel promote <VERIFIED_CANDIDATE_DEPLOYMENT_ID>` from the verified project checkout. Check primary aliases/TLS, authentication and read-only customer viewing with an authorized pre-existing device/session. A new-device customer visit may write device records; do not treat that as a read-only check.
7. Release edit freeze only after all gates pass. Monitor timeouts, errors, lock waits, revision/version behavior and function resource usage without logging workbook/customer content. Retain fallback, recovery evidence and incident owner. No automatic publishing.

CLI `--prod --skip-domain` and promote behavior were checked against installed CLI help and [Vercel's deployment guidance](https://vercel.com/docs/cli/deploying-from-cli). No deployment command was executed.

## Approved post-deployment smoke checklist

Use only a labelled synthetic customer/plan. Even a workbook preview persists records, so it is a **write requiring approval**. Do not run staging acceptance/regression scripts against production; they intentionally reject production and perform broader fixture writes. Do not publish/share the synthetic draft; DRAFT is not an access boundary in the existing app.

- Unauthenticated Excel endpoint returns 401; admin login works; template downloads and opens with supported sheets/instructions/version/dropdowns and no customer secrets.
- In desktop Chrome and mobile viewport, import `outputs/excel/andaman-sample.xlsx` into the synthetic customer. Review sheet/row errors, destination/day/stay counts and confirm once. Plan remains DRAFT, opens in the existing builder; protected customer/token/device/window values remain unchanged. The sample does not contain every module; do not claim all-module coverage from it.
- Export; change itinerary morning text from `08:00 ferry to Havelock` to `09:30 ferry to Havelock`; upload through Update from Excel. Review exactly one intended modification, confirm and compare complete content. All unrelated fields/record relationships and customer-access settings remain unchanged.
- Retry upload/confirmation: no second plan or duplicate revision operation. Malformed/invalid-destination workbook rejects with understandable references.
- On the fixture only: blank preserves, `[CLEAR]` explicitly clears an optional field, `DELETE` explicitly removes a selected record; history restores the original IMPORT content/relationships. Verify revision entries and normal manual Overview/Help editing.
- Create an old export, make one manual fixture edit, confirm stale update rejects without lost data. A controlled two-preview race should produce one success and one stale conflict; never perform concurrency tests on a real customer's plan. Staging already proved this; production race execution requires its own explicit approval.
- Existing manual builder navigation/reads, destinations/forms, share-link generation and customer access remain functional. Any save/device registration is a production write and must be explicitly scoped. Physical Safari/iOS/Android, sustained load and maximum payload checks remain unexecuted; record browser/device actually used.
- Record nonsecret fixture IDs/result counts privately. Fixture cleanup is a separate approved action; delete only those recorded synthetic records after final inspection, not pre-existing data.

## Rollback / recovery

- **Migration fails before COMMIT:** wrapper/connection abort rolls back DDL; keep old app, verify baseline/object state read-only and retain freeze until understood. Do not rerun automatically after network loss: inspect commit state first. A missing CLI success message is not proof the server rolled back.
- **Migration succeeds but candidate fails:** do not promote; leave old app aliases. Retain additive schema/history. Old child-first writers remain a risk with the new triggers: continue edit freeze, then either fix the candidate or obtain separate approval for a reviewed compatibility solution. Do not disable/drop triggers casually and reopen writes.
- **After promotion:** capture incident evidence privately, freeze edits and stop Excel operations, verify current project/fallback ID, then obtain approval for `vercel rollback <VERIFIED_PREVIOUS_DEPLOYMENT_ID>`. This is a production-impacting deployment action. [Vercel rollback](https://vercel.com/docs/cli/rollback). Verify deployment/aliases/env, customer reads and schema compatibility afterward. An old dependency-vulnerable app is an emergency fallback, not a secure long-term release. Prefer a tested patched compatibility build retaining parent-first writes if rollback will last.
- **Database rollback:** no down migration/drop is prepared or authorized. Keep content_version, previews, revisions, functions and versioning while the feature can be restored safely. Individual plan problems use reviewed revision restoration, which adds another revision and preserves unrelated plans. Restoring content does not roll back customer/access status settings.
- **Disaster recovery:** restore the verified backup/PITR point into a **new isolated database/branch**, validate all data/schema/relationships and role grants, reconcile all legitimate changes since backup, then seek explicit approval for a controlled production cutover/environment change. Never pg_restore --clean over the live database or restore the whole database merely to undo one plan. Full restore can otherwise lose later customer/device/admin writes.

## Decision and approval boundary

**Ready for a controlled production release: NO.** Staging functional/recovery tests passed; production identity/schema, compromised-credential remediation, actual production backup/recovery, a pinned release revision and execution approval remain unresolved. Procedure files added here are prepared, not production-executed or proven against production. A disposable PGlite test passed four checks on their SQL bodies: identity mismatch rejects before DDL; a later failure rolls back all wrapper DDL; apply/rerun preserves baseline content; read-only baseline SQL executes. This does not test psql meta-command handling, libpq service configuration or the actual production recovery procedure. No production readiness is claimed.

Before requesting execution approval, supply/verify the actual production project/branch and direct connection privately and resolve the credential issue. Then present the final exact target, release revision, backup/recovery receipt plan, SQL checksum, low-traffic/edit-freeze window, candidate/promotion and synthetic-write scope for explicit owner approval. The requirement for approval comes from the user's instruction to stop before production-impacting actions.
