# StayLocal production release — 2026-11-02

Released with the owner's explicit approval to apply only reviewed additive Schema-6 and deploy the tested application, retaining the existing credential and deferring the Neon recovery drill. No Git push, credential rotation, environment update, reset or existing-data deletion was performed.

- Live URL: https://stay-local-beryl.vercel.app
- Existing Vercel project: stay-local / prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e.
- Deployment: dpl_EFAY76EX8L2aXuV4YUBgxTykzDVk; Vercel API independently confirmed READY, production target and live alias.
- Production Neon identity verified read-only before execution: lucky-waterfall-84436365 / br-broad-pond-b3nfbi06, database neondb. Migration independently guarded the same identity inside its transaction.
- Verified existing backup: 91,636 bytes; SHA-256 d776103c80d7ecb13e5987379a8c9fe237324aceff839e6535b9da770b0136fe. Previous local PG18 restoration passed; disposable Neon recovery was not executed, per revised owner scope.
- Migration SHA-256: 5b160fc7ee41547429dbcbb7c21c668d49b968ebb50f8a4ce254da41e2f07540. Only scripts/production/schema-6-release.sql executed; COMMIT and schema postconditions passed. Atomic transaction, identity guards, advisory lock, 5s lock/60s statement/300s transaction timeouts. No grants or role/password changes.
- All 221 deployment files matched the tested source manifest. Existing 40-test/build verification was reused. Vercel built the application with Next 16.4.3 and frozen pnpm9 lockfile.
- CLI polling ended with EADDRNOTAVAIL after compilation; this was a client transport error. A read-only Vercel API lookup confirmed the SAME deployment READY with no deployment error. No second deployment was started.

## Live verification — PASS

13 live smoke checks passed: production identity; public/admin/customers/plan/import pages; authenticated template download and unauthenticated rejection; pre-existing customer/plan content matches backup (device activity allowed); existing plan opens; Andaman draft import; duplicate upload and repeated confirmation protection; export; ferry-only 08:00 → 09:30 update with all other exported fields identical; stale export rejection; malformed workbook rejection; revision history/restoration; disposable draft opens in existing Plan Builder.

Chrome read-only browser checks passed on both Plan Builder and Excel update screens at widths 1440, 390 and 320: six screen checks, no horizontal overflow or runtime exceptions. Initial browser assertion used an incorrect exact label; correcting only the test locator to the actual UI labels passed. No production code fix was required.

Labelled synthetic customer/draft retained for inspection; draft plan ID 5ff13d4a-614c-4d0a-ac78-d68452061a4c. It was never published. No existing customer plan was edited. Production DATABASE_URL metadata and deployment protection remained unchanged.

Evidence: outputs/production-release/{migration.log,deployment.log,deployment-status.json,smoke.json,browser.json,final-verification.json}. These operational outputs are excluded from deployment.

## Follow-up and rollback

Credential rotation remains a separate urgent follow-up because the previously exposed shared credential remains valid by owner instruction. Prior audit had zero critical/high and four moderate advisories; no audit rerun or dependency changes during release.

The primary live domain points to the new release. The project and git-main convenience aliases still point to dpl_FYgpwS3iZ3xze1oJQciiz8USHHom; these were not separately reassigned. Use the primary live URL above for the released application.

If application rollback becomes necessary, restore the previous deployment on the primary live alias only with scoped authorization; retain additive Schema-6 and all customer/import/history data. Do not restore the full database backup over legitimate later writes or drop the new tables/counters. Previous credential remains valid for both old and new deployments during this release. Any future credential revocation changes rollback requirements as documented in staylocal-final-cutover-approval.md.
