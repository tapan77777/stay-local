# Excel Import System — final staging acceptance

Executed 2026-10-31. **PASS: the requested staging acceptance gates completed. No blocking implementation defect was found in the tested scenarios. Ready for production release approval and a separately approved production backup/migration/deployment plan.** This report does not authorize or perform production operations.

## Target and safety

- Owner-confirmed project: `staylocal-2`; database-reported project ID: `lucky-waterfall-84436365`.
- Branch: `excel-import-staging`; verified ID: `br-cold-sea-b33m80x4`.
- Environment/branch/project were rechecked before backup, migration, acceptance and regression suites. The test application transport refused other endpoints and asserted the pinned branch/project inside every database transaction.
- The only remote writes targeted this staging branch. The separately authorized recovery drill wrote only to a newly created private local PostgreSQL instance, never production or the staging source.
- `.env.local` and live environment variables were not changed. No deployment or Git push occurred. Credentials, connection URLs, session cookies and private plan tokens were not printed.

## Results

| Gate | Result | Executed evidence |
|---|---|---|
| Staging identity | PASS | Both URLs matched the expected staging branch, project and database; direct backup connection reported read-only mode. |
| Backup | PASS | PostgreSQL 18.6 pg_dump custom archive; 35,553 bytes; archive contents and SHA-256 verified. Source connection forced read-only transactions. |
| Separate recovery | PASS | Restored to a fresh PostgreSQL 18.6 local database over a private Unix socket. All 14 baseline tables' row counts, IDs and data hashes matched. Columns, constraints and enum definitions matched. Staging remained unchanged during the drill. |
| Staging migration | PASS | Reconfirmed identity; read-only preflight passed; safe runner applied only schema-6 atomically. Verified two new tables, three functions, primary/unique/check/FK constraints, expiry index and 12 enabled version triggers. |
| Baseline preservation | PASS | All original rows across 14 baseline tables matched their pre-migration fingerprints after migration, Excel tests and existing regression suites. The new version column was excluded from historical row hashes and separately checked: original plans' version counters remained zero. |
| Sample import | PASS | Original Andaman workbook imported via the running application's authenticated Excel HTTP route. Exactly one DRAFT plan with its destination, itinerary day, stay, Overview and Help data. |
| Ferry-only update | PASS | Exported, changed Itinerary morning from `08:00 ferry to Havelock` to `09:30 ferry to Havelock`, previewed and confirmed. Compared the entire content snapshot; only morning changed. Customer/status/private token/device cap/access settings also remained unchanged. |
| Supported sections | PASS | Added Places, Transport, Food, Experiences, Maps, Notes, India Guide and Documents through an enriched update workbook. Read-back confirmed a record in every supported module; export/re-import produced no changes. |
| Duplicate protection | PASS | Identical new-plan upload returned existing-plan conflict; repeated confirmation returned the same plan without another revision. Two simultaneous confirmations of one update produced a single committed update/baseline revision pair. |
| Invalid input | PASS | Malformed workbook bytes rejected (400); nonexistent destination reference rejected (422). Unauthenticated template request rejected (401). |
| Blank / clearing / deletion | PASS | Blank preserved morning and produced no-change validation. [CLEAR] explicitly cleared morning. DELETE removed the selected stay; later restoration recovered it with its original identifier. |
| Stale export | PASS | A manual itinerary edit invalidated an earlier export (409). |
| Post-preview conflict | PASS | A manual edit after preview caused confirmation to reject (409). |
| Concurrent Excel updates | PASS | Two independent transactions used previews based on the same version. One confirmation succeeded (200), one conflicted (409); the persisted value matched the successful writer. |
| Manual/Excel overlap | PASS | A normal parent-first manual transaction held the plan lock; its presence was observed through a transaction-scoped advisory marker. Excel confirmation was submitted while that transaction was active. Manual write completed and stale Excel confirmation rejected; no manual change was lost and no transaction error surfaced. This verifies the tested overlap, not all possible workloads or server-internal retry counts. |
| Real transaction rollback | PASS | Intentional failure after a test-plan UPDATE rolled back its content, timestamp and version changes; full state equalled the pre-transaction state. |
| Revision restoration | PASS | Restored the original IMPORT revision after clearing/deletion, and again after section/concurrency testing. Full content snapshots matched the original records/relationships. |
| Manual builder | PASS | Real Chrome browser exercised manual Overview save, destination creation and Help save against the staging database. No browser runtime errors. |
| Existing HTTP regressions | PASS | Existing `scripts/plan-e2e-test.mjs`: 37 passed, 0 failed, against the running staging-connected application. |
| Existing device regressions | PASS | Existing `scripts/plan-devices-test.mjs`: 19 passed, 0 failed, using real staging transactions, including its five-request device-limit race. |
| Local automated suite | PASS | 33 tests after the staging scripts were added. |
| Build/static checks | PASS | TypeScript, ESLint, production build and whitespace checks. |
| Dependency audit | PASS for critical/high gate | Fresh full-tree npm audit: 0 critical, 0 high, 24 moderate entries. Moderate minimatch/UUID/archive-tooling findings remain tracked in the readiness report. |

The provided sample itself has no Transport/Places/Food/Experience/Map/Note/Guide/Document records. Those sections were exercised by the separate enriched workbook rather than claiming nonexistent sample rows were imported.

## Backup and recovery evidence

Private, Git-ignored backup directory:

`.env.excel-predeploy/verified-0FS56t/`

- `staging-before.dump`: custom-format database backup; permission 600, containing private staging data. Do not publish, attach to public reports or commit it.
- `staging-before.sha256`: `f77c2c6a1df64736f356ee4b16a0d9d2cb66d94c1d3a01b528e6bd78fe0bd89d`.
- `archive.contents`: pg_restore archive listing.
- `baseline.private.json`: schema and original row IDs/fingerprints; not customer data printed into this report.
- `receipt.json`: backup/recovery comparison receipt.
- `migration-result.json`: applied SQL SHA-256, object/constraint verification and baseline preservation.
- `acceptance-result.json`: 18 positive acceptance checks, fixture IDs and completion time.
- `regression-result.json`: actual staging HTTP/device suite results and final baseline check.
- `final-schema-check.json`: read-only verification of 16 public tables, expiry index, 12 enabled triggers and original-plan counters.

The custom dump deliberately used `--no-owner --no-privileges`, as documented. Recovery proved database data/schema consistency; it was not a restore of Neon infrastructure, cluster roles or original ACL ownership. The local recovery database was created with owner-only filesystem access, had no TCP listener, and was stopped after verification. The temporary tool image was unmounted; tools were not installed into Applications or system paths. The official tool image's SHA-256 matched its release metadata before use.

## Test data and operational scripts

Synthetic test customer: `31cbb6e4-7aea-420f-92b2-7749b11495ee`.

Main test plan: `8bbb1289-c9a7-4e7d-9c1a-17114be5b2e1`.

The main plan was restored to original imported content, then deliberately edited through the manual builder to verify normal editing. It remains in staging with the test traveler/support text and an additional manual test destination. Synthetic test fixtures are retained for inspection; they are not production/customer plans. The existing device suite also creates labelled test fixtures. No pre-existing baseline records were changed.

New operator scripts in `scripts/staging/` pin this exact staging branch and refuse other targets:

- `guard.mjs`: private configuration, identity assertions and fingerprint queries.
- `backup-recovery.mjs`: compatible-tool backup, checksum validation and private local restoration/comparison.
- `migrate-verified.mjs`: requires successful recovery evidence and unchanged staging baseline before applying only schema-6.
- `transport-guard.mjs`: test-only application preload enforcing endpoint and in-transaction branch/project assertions.
- `acceptance.ts`: real running-app Excel and concurrent-write acceptance.
- `regression.mjs`: existing HTTP/device regression suites with staging guards.
- `final-check.mjs`: final read-only schema/version inspection.

These are verification/operator scripts, not production application feature changes. The one-time backup/migration scripts must not be reused blindly after fixture changes; their baseline/receipt checks intentionally stop on changed state. No production mode was added to the migration runner.

## Remaining release conditions and limits

- No further blocking implementation fix was identified by these executed tests.
- Production backup/recovery planning, production schema preflight, an explicitly approved production migration procedure and deployment approval are still required. The migration runner deliberately refuses production; do not relabel a production connection as staging to bypass it.
- Moderate dependency advisories remain documented; 0 critical/high were reported by the fresh audit.
- The original mobile-shell navigation limitation remains: no direct Plans navigation in its mobile header. Prior Chromium mobile viewport checks passed on the isolated application; this run exercised manual forms in desktop Chrome against real Neon. Physical iOS/Android/Safari checks, sustained load and maximum-sized workbook performance were not executed here.
- Concurrent tests cover competing Excel updates, duplicate confirmations, the observed manual-write overlap and the existing device race. They do not prove correctness for arbitrary external SQL taking a different lock order or every possible workload.

**Decision:** staging functional, recovery and migration acceptance passed. Ready for controlled production release approval; production remains unchanged and deployment is not yet performed or authorized.
