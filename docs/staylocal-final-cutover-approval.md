# StayLocal final cutover — approval required

Prepared 2026-11-02. **BLOCKED on the requested disposable-Neon recovery drill and execution approvals.** Safe preparation and a fresh read-only production backup are complete. No role/password, Vercel variable, migration, live alias or deployment was changed.

## Fixed target and completed checks

- Vercel **stay-local** / `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e`, existing three original aliases, primary `stay-local-beryl.vercel.app`.
- Neon **lucky-waterfall-84436365**, production **br-broad-pond-b3nfbi06**, database neondb. Never create another production project/database/branch.
- Fresh direct PostgreSQL connection verified those IDs in READ ONLY mode; TLS hostname/CA validation and channel binding required. Vercel live deployment/environment metadata still matches the verified original.
- Current runtime connection is neondb_owner with Neon administrative membership. Proposed least-privilege name staylocal_app_release is currently unused. No new role exists yet.

## Fresh backup — PASS; Neon recovery — BLOCKED

Backup: `.env.production-release-backups/verified-ZkYEsh/production-before.dump`.

- Created **2026-11-02T04:31:54Z**, PostgreSQL 18.6 custom archive, **91,636 bytes**.
- SHA-256 **d776103c80d7ecb13e5987379a8c9fe237324aceff839e6535b9da770b0136fe**; listing and re-read checksum passed.
- Directory 700 / archive 600, ignored by Git and deployment rules. Contains private production data; do not publish or attach it.
- Source baseline and pg_dump used **the same exported repeatable-read snapshot**. This avoids false integrity failures from normal device/user traffic between independent reads. Every source connection was read-only; no production row/schema write.
- An additional **private local PG18 recovery passed**: all 14 table counts/content fingerprints plus columns, constraints, enum definitions, indexes, functions and triggers matched. Local server was Unix-socket-only and is stopped. Tools image was mounted read-only, checksum verified, and unmounted after use.
- This is **not** the requested Neon acceptance. No disposable Neon endpoint/API access is configured; no Neon branch or restore was created. Requested **Neon restoration remains unexecuted**.
- Archive intentionally excludes ownership/ACL/role-password restoration (--no-owner --no-privileges). Ownership/grants must be separately checked/set on any recovery target. A backup is a point-in-time recovery asset; refresh it immediately before release if execution is delayed.

Private receipt: `.env.production-release-backups/verified-ZkYEsh/receipt.json`. Operator: `scripts/production/backup-snapshot.mjs`. Two baseline/protocol tests and two recovery-guard tests were added; **40 local tests, ESLint and TypeScript pass**. Normal application code is unchanged.

### Exact owner setup needed for the Neon drill

1. In **the same Neon project**, create a **disposable restore-only branch**, e.g. excel-release-recovery-20261102, using schema-only creation to avoid copying private rows before credentials are isolated. This is not a new production branch/application. Do not reuse production or existing acceptance staging.
2. Ensure **every inherited login role** on that restore branch has isolated credentials before production data is copied. Creating one new role while leaving a compromised inherited owner password valid is insufficient. Any role reset remains branch-scoped and needs the owner's explicit authorization; never reset the production role as part of restore-target preparation. [Neon roles](https://neon.com/docs/manage/roles).
3. Create an **empty restore-only database** within that disposable branch, e.g. staylocal_excel_recovery. Schema-only neondb already contains copied table definitions, so it is not an empty target for a full restore. Do not clear or overwrite an existing database. [Neon schema-only branches](https://neon.com/docs/guides/branching-schema-only).
4. Privately fill `.env.excel-recovery.local` from `config/excel-recovery.env.example`: direct URL, expected project/branch/database and owner confirmations. File is mode 600, ignored, placeholders only currently. Reply with branch ID/database name only, never passwords/URLs.
5. Run `node scripts/production/recovery-preflight.mjs`: **read-only/check-only**. It rejects production, existing acceptance staging, pooled URLs, source endpoint/password reuse, mismatched identity/database and any public objects. Current run stopped before connecting because placeholders remain.
6. After preflight, restore only into that empty disposable target. Reverify project/branch inside the restore transaction before DDL/data; reject the production branch. Use the frozen direct endpoint, --no-owner/--no-privileges, no --clean, abort-on-error, one transaction. If archive recreates public, remove only the verified empty default public schema inside that same guarded disposable transaction. Restore never targets production.
7. Compare all baseline data/schema/relationships against the **backup snapshot**, not a later changing production state. Keep the Neon drill and local drill results separate; do not claim Neon PASS until it executes. Cleanup of the recovery branch must explicitly name its verified disposable ID and never production.

## Credential cutover designed to avoid connection downtime

**Do not reset the active owner's password first.** Neon resets take effect for subsequent connections, while Vercel's existing deployments retain their saved environment values. [Neon reset behavior](https://neon.com/docs/manage/roles), [Vercel environment semantics](https://vercel.com/docs/environment-variables).

Prepared approach, **not executed**:

1. After approval, create **staylocal_app_release** through SQL on the pinned production branch, with a fresh privately generated password and no superuser, database/role creation, replication, BYPASSRLS or neon_superuser membership. Console-created Neon roles default to admin membership; use SQL for the restricted role. No password literal will go into tracked files, chat, command arguments or logs.
2. Leave neondb_owner and its current password valid during transition. Inventory all consumers: current Vercel deployments/aliases, private operator files, jobs/integrations and branch-specific copies. Current sessions alone do not prove the whole inventory.
3. Verify new pooled/direct credentials with read-only identity/planning checks. After Schema-6, apply the separately prepared `scripts/production/app-runtime-grants.sql` **only after approval**: explicit CRUD on the 16 application tables, schema/type usage and the three Excel functions, no CREATE/TRUNCATE/ownership/admin grants. Its guards refuse wrong project/branch/database, unprovisioned/admin app roles and missing Schema-6.
4. Only after schema/grants/read-only new-role checks pass, update **only the existing stay-local Production DATABASE_URL**, keeping it sensitive. The controlled operator can privately pass the new pooled URL on stdin to `vercel env update DATABASE_URL production --sensitive --yes`; do not use --value/--env or print the URL. Verify original project/team and existing variable ID/scope before update. No ADMIN_PASSWORD, ADMIN_SESSION_SECRET, PLAN_ACCESS_SECRET or other environment variable changes.
5. Vercel documents that variable changes apply to **new deployments only**. Therefore the old live deployment continues with still-valid old credentials while the approved full release is built with the new URL. Build/route the new release only after all database prerequisites pass. Existing private customer tokens and device hashes remain unchanged.
6. Verify the new deployment/aliases, credential provenance and smoke checks; wait for old in-flight work/consumers to drain. **Then**, with explicit revocation approval, replace the exposed production owner's password and update approved operator consumers. Do not drop the owner or change object ownership. If stale sessions must be terminated, that needs explicit scoped approval after drain. Other branches using copied passwords need their own separately approved remediation; no staging credential is changed by this production-only plan.

This overlap avoids deliberately invalidating the old application's connection before the new application is ready. **Actual zero-downtime behavior is not yet executed/proven**, and the credential transition should be rehearsed on the disposable Neon target after authorization. No one can guarantee zero interruption before provisioning/testing the new role and cloud cutover. DDL locks may still cause short waits; that is separate from credential cutover.

## Exact additive Schema-6 review

Source `lib/plan/schema-6-excel.sql`, SHA-256 **5b160fc7ee41547429dbcbb7c21c668d49b968ebb50f8a4ce254da41e2f07540**:

- Adds plans.content_version BIGINT NOT NULL DEFAULT 0; existing rows receive version zero without replacing content.
- Creates plan_excel_previews, plan_excel_revisions, an expiry index, three functions and 12 version triggers.
- **No executed DELETE, TRUNCATE, DROP TABLE, destructive ALTER or customer/plan content rewrite.** DROP TRIGGER only replaces the feature's own named triggers atomically. New child FKs do not delete parent data during installation.
- Trigger definitions contain future version-counter updates; they do not execute those updates retroactively on installation. Later authorized plan deletion can cascade its new history, as specified by its FK; migration itself deletes no plan/customer data.
- Primary/foreign keys, customer/plan IDs, private tokens, device caps and access secrets remain intact.
- PostgreSQL still needs DDL locks. `scripts/production/schema-6-release.sql` supplies branch/project guards, one transaction, advisory lock, 5s lock / 60s statement / 300s transaction timeouts, and object postconditions. Errors roll back the migration; inspect final state after a lost response rather than blindly retry.
- Read-only catalog checks confirmed the current migration role has ownership privileges on all 14 existing tables and CREATE on public; zero collisions with the three planned Excel function names.
- Old child-first edits can conflict with new parent-first versioning; pause admin/content/integration writes across migration/cutover. Account for device writes when taking integrity snapshots. No generic staging runner, Prisma tools or reset/import-json command belongs in this production operation.

Prepared invocation, **approval required and NOT RUN** (private PG service points to the confirmed direct production connection):

```sh
PGSERVICEFILE="$PWD/.env.excel-production-service.conf" PGSERVICE=staylocal_excel_production \
  "$STAYLOCAL_PG_BIN/psql" -X -v ON_ERROR_STOP=on \
  -v expected_branch_id=br-broad-pond-b3nfbi06 \
  -v expected_project_id=lucky-waterfall-84436365 \
  -v approved_release=REPLACE_WITH_APPROVED_RELEASE_ID \
  -f scripts/production/schema-6-release.sql
```

## Final release sequence — no execution approval yet

1. Complete the disposable **Neon** restore and credential rehearsal/consumer inventory. Refresh the consistent production backup at the approved release window. Record the verified archive, identity, original live deployment and all three alias mappings.
2. Obtain scoped credential, schema/grant, deployment and synthetic verification approvals. Provision/test the new app role; pause content edits; apply only Schema-6 atomically and then the minimal runtime grants. Recheck existing content/relationships, treating legitimate device activity appropriately.
3. Update only Production DATABASE_URL privately; existing deployment remains on valid old credentials. Verify tested full release source fingerprint **046c9fc3d7fc8111d4574a406d5d562cd66683275871abd0bb2583a7b48b3013**, pnpm frozen lock/build settings, no diagnostics/private artifacts. Local validation already passed 36 business/migration/operator tests, 19 device checks, 37 HTTP checks, Chrome desktop/mobile and build/type/lint; new backup/recovery tests are additional operator coverage.
4. After explicit live-release approval, deploy the full application directly to the **existing** stay-local project using production configuration. This approval must intentionally cover all existing aliases moving to the new release. Do not rely on --skip-domain for a no-alias staging strategy; it previously moved the system alias. No new production website/database/branch, push or parallel diagnostic.
5. Confirm READY, intended project, all intended aliases and unchanged non-database secrets/security settings. Check public site, admin/manual builder and existing customer access; template download; approved synthetic customer/DRAFT import → export → ferry-only update → stale validation → revision restoration. Production fixture writes require explicit scope. Never publish or edit a real customer plan as a smoke test.
6. Only after consumers/traffic drain and release checks pass, obtain/execute exposed-owner-credential revocation and approved operator updates. Remove only labelled smoke fixtures when authorized. Leave all existing customer/trip/plan records and links intact.

## Rollback

- Before migration commit: atomic rollback leaves existing schema/content intact. If client response is lost, inspect first.
- After migration/before release: keep old application and old credential valid; retain additive objects/history and the admin edit pause until a compatible release succeeds. Do not drop features' history or restore over the live database.
- Before old credential revocation: an explicitly approved rollback to the captured old deployment can use its still-valid snapshot, but retain edit restrictions because its code lacks parent-first locking.
- **After old credential revocation:** Vercel rollback to an old deployment restores its **old credential snapshot**, which would fail. Rebuild/redeploy the reviewed prior/compatibility code using the **current new credential**, or use a pretested compatibility deployment provisioned under separate approval. Never restore the leaked password just to make an old deployment work.
- Database disaster recovery: restore verified backup to an isolated target, reconcile legitimate writes after the snapshot, verify grants/data/relationships, then request separate approval for any production cutover. Never pg_restore --clean over production to undo one itinerary change.

## Exact approvals/input needed next

**Input first:** a disposable Neon branch ID, empty database and private direct connection with isolated login credentials. No Neon management access is available here to create it. This blocks the requested Neon recovery PASS.

After the recovery check passes, request these explicit scopes rather than blanket permission:

A. Create the restricted production app credential/role and grants; update **only** existing stay-local Production DATABASE_URL when ready. Keep the old password valid during the transition.

B. Apply the exact Schema-6 migration/grants and deploy the tested full app to existing stay-local, intentionally promoting all current aliases, plus bounded synthetic DRAFT smoke writes.

C. After successful cutover/drain, revoke/rotate the exposed production owner credential and update its remaining authorized consumers. Any other branch's credential change, session termination, rollback or disaster cutover needs its own identified approval.

**Current status:** backup PASS; additional local restore PASS; disposable-Neon restore BLOCKED; Schema-6 reviewed, unapplied; credential/cutover plan prepared, unexecuted; deployment unperformed. No production credentials, schema/data, live aliases, environment variables or security settings were changed in this preparation.
