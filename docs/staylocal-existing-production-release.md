# StayLocal existing-site release — BLOCKED

**Latest preparation update:** a fresh production snapshot backup and additional local PostgreSQL recovery passed. The specifically requested disposable-Neon recovery remains blocked on target configuration. Credential cutover, exact migration and rollback approvals are prepared in [the current cutover package](staylocal-final-cutover-approval.md). No production mutation or deployment occurred.

Verified 2026-11-02. **Code/tests/build PASS. Deployment BLOCKED by the production data/security gates below. Nothing was deployed or changed in production.** No additional Vercel project, Neon project or production branch is needed.

## Confirmed existing target

- Vercel **stay-local**, `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e`; live domain **stay-local-beryl.vercel.app**.
- Neon **staylocal-2**, project **lucky-waterfall-84436365**, production branch **br-broad-pond-b3nfbi06**.
- Owner-authenticated production diagnostic identified those exact IDs; fresh identity-pinned read-only SQL matched them. Current Vercel production environment metadata is unchanged since that verification. Secret values were not exposed or replaced.
- Live commit remains **7e84d3d29acc0374384f39277b525bb8e59eb71f**, original repository `tapan77777/stay-local`. Existing production has all **14 baseline tables / 178 columns** and matches the current deployed builder. This application uses Neon SQL, not Prisma.

## What is not deployed

The existing website and manual Plan Builder are already live. The working-tree comparison identifies these completed, undeployed additions:

- Excel template download, workbook validation/preview and draft import.
- Export, selective update, blank preservation, explicit clearing/deletion, stale-edit and duplicate protection.
- Revision history and safe restoration.
- Builder parent-first transaction/locking safeguards supporting concurrent Excel edits.
- Next 16.4.3 / React 19.2.9 security updates and their dependencies.

No other changed application feature area was found outside the Plan Builder/Excel and dependency work. The tested release retains the existing website/customer-access implementation. Temporary diagnostic code is not included.

## Database requirement

**Apply only lib/plan/schema-6-excel.sql, before application release, after separate approval and successful production backup/recovery.** Production currently lacks plans.content_version, both Excel preview/revision tables, three functions, twelve version triggers and the preview-expiry index. Upload/preview/import cannot safely run without them.

The migration is additive; it does not replace customers/plans/trips, recreate the database, reset data or change existing private tokens/access secrets. It still takes DDL locks. The prepared wrapper is `scripts/production/schema-6-release.sql`: pinned identity arguments, one transaction, advisory lock, 5s lock / 60s statement / 300s transaction timeout on this PG18 server. SQL SHA-256: `5b160fc7ee41547429dbcbb7c21c668d49b968ebb50f8a4ce254da41e2f07540`.

Do not use the nonproduction-only generic migration runner on production or relabel production as staging. The separate existing staging acceptance passed, including backup/restoration, real Excel operations and concurrent writes; that does not replace the production-specific backup gate.

## Fresh verification

Validated the exact current deployment files in an isolated directory, with no private env files or production database credentials. Disposable PGlite supplied test data.

| Check | Result |
|---|---|
| Clean pnpm frozen install, exact Vercel command | PASS |
| Automated Excel/migration/verification tests | **36 PASS** |
| Existing device checks | **19 PASS** |
| Existing running-app HTTP checks | **37 PASS** |
| Browser: desktop 1440, mobile 390/320 | PASS; import/preview, ferry-only update, manual builder edit, history preview and error handling |
| TypeScript, ESLint, production build | PASS |
| Advisory audit | **0 critical/high**; 4 moderate full graph / 3 runtime findings (UUID and minimatch); tracked, not declared fixed |
| Secret/artifact/source scope checks | PASS; no temporary diagnostic or private env in candidate |

Browsers were headless Chrome viewport checks, not physical Safari/iOS/Android or load testing. No fresh staging/production write tests ran during this check; prior real-Neon staging results are documented separately.

Fixed the full application's local deployment configuration: one updated pnpm lock, pinned pnpm 9.15.9, explicit versioned install/prebuild/build commands in vercel.json, and `.vercelignore` excluding private envs/backups/operator outputs/tests/docs. TypeScript excludes generated outputs so diagnostic review artifacts cannot leak into compilation. No dashboard/environment settings were changed.

The 221 deployment-source files exactly match the tested candidate. Source fingerprint: **046c9fc3d7fc8111d4574a406d5d562cd66683275871abd0bb2583a7b48b3013**. Receipts, screenshots and file hashes: `outputs/full-release/`. Candidate source: `/tmp/staylocal-full-release-th97ny3d`. Changes remain local/uncommitted; no Git push is required or performed for this review. Pin/recheck the artifact before any approved execution.

## Exact remaining blockers

1. **Production schema-6 is not installed.** Do not deploy Excel first.
2. **Production backup and disposable restore verification have not run.** The staging recovery method passed, but a current production backup/recovery receipt is still required.
3. **Previously exposed database-role credential revocation is not confirmed.** The credential was found in the staging example and reused by `.env.local`; production DATABASE_URL metadata has not been updated. Confirm all consumers and perform a coordinated, explicitly approved remedy. Preserve ADMIN_SESSION_SECRET/PLAN_ACCESS_SECRET and existing customer tokens/device hashes. No credential was changed here.
4. **No final production execution approval.** Approval must cover the exact credential, backup, migration, intended live release and synthetic smoke-test scope; not an unspecified or temporary deployment.

## Smallest safe release sequence — future approval required

1. Approve and coordinate credential remediation/consumer updates and a short maintenance/edit window. Create a private, current consistent production backup and restore it into a disposable **local** PG18 database; verify schema/data/relationships and required ownership/grants. No new production project/branch. Account for background/device writes when making snapshots or comparing hashes; do not assume only admin traffic can write.
2. Pause content editors/integrations during migration/cutover to avoid overlap between old child-first writes and new version triggers. Reconfirm exact project/branch, apply **only schema-6** using the atomic wrapper, verify all new objects and preservation of existing customer/plan/content records. Treat legitimate device tracking updates separately from content-integrity comparisons.
3. After approval, release the exact tested **full application directly to existing stay-local production**. This approval must intentionally cover moving the existing live aliases to the full release. Do not use a shadow `--skip-domain` strategy: the diagnostic showed that an existing system alias can still move. No temporary diagnostic, new application, migration reset, database replacement or Git push.
4. Verify all intended aliases, admin/manual builder/customer access, Excel template download and one labelled synthetic DRAFT Andaman import → export → ferry update → revision restoration. No automatic publish and no edits to real customer plans. Synthetic production writes require the release approval's explicit scope.
5. On failure, stop writes and perform only the approved application rollback; retain additive schema/history. Do not drop tables or restore the whole database over production to undo one plan. Any disaster recovery uses an isolated restored copy, reconciliation and separately approved cutover.

**Decision: BLOCKED for production execution, with the application code and validation ready.** Clear the security/recovery/migration gates and approve this existing-site release; no further project/branch creation or model redesign is needed.
