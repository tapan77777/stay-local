# Step 1 — staging connection verification

**Later execution:** staging backup/recovery, schema-6 and acceptance completed successfully. See [excel-staging-acceptance-report.md](excel-staging-acceptance-report.md). The absent Excel objects reported below describe the verified pre-migration state.

Verified 2026-10-31 using `.env.excel-staging.local`. **PASS: ready for the separate backup/recovery and migration-testing step.** No migration or remote data write was performed. Future backup or migration operations remain subject to explicit authorization.

## Intended target and identity

The owner identified Neon project `staylocal-2`, branch `excel-import-staging`, parent `production`. The branch ID saved from Neon Console was verified against the database-reported identity:

- Branch ID: `br-cold-sea-b33m80x4`.
- Database-reported project ID: `lucky-waterfall-84436365`.
- PostgreSQL server: 18.6.
- Both application and migration connections return the same project, branch and database.
- The branch ID differs from the previously identified protected/unclassified branch `br-broad-pond-b3nfbi06`; the endpoint differs from the protected `.env.local` endpoint.

Branch/project display-name and parent mapping rely on the owner's Neon Console selection and supplied expected branch ID. No Neon control-plane credentials were available for a separate API lookup of display names or parentage. Database identity itself was checked, not inferred from an environment label or hostname alone.

## Checks

| Check | Result |
|---|---|
| Application and migration URLs parse as complete Neon PostgreSQL URLs | PASS |
| App connection is pooled; migration connection is direct/unpooled | PASS |
| Both retain required SSL settings | PASS |
| Normalized endpoint and database agree before any network connection | PASS |
| PLAN_MIGRATION_EXPECTED_HOST automatically extracted and matches direct hostname | PASS — already matched; no value replacement necessary |
| Expected branch ID exists and has valid shape | PASS |
| Direct server identity matches expected branch ID | PASS |
| Pooled server identity matches verified direct identity | PASS |
| Read-only enforced on both identity transactions | PASS — transaction_read_only reported on |
| Baseline schema: 14 tables, required columns, foreign-key relationships and enums | PASS — none missing |
| Excel content_version column, preview/revision tables, functions and triggers | Not installed — expected pending migration state |
| Migration runner --check | PASS — read-only preflight; no DDL applied |
| Private file permissions | PASS — 600 |
| Git ignore / tracked-file check | PASS — ignored by .env*; not tracked |

Only PostgreSQL system catalogs, information_schema and connection metadata were read. No customer records, passwords, tokens or full database URLs were printed or included in this report. The initial sandbox network restriction was resolved by rerunning the same read-only verifier with network access; no target or database safety policy was relaxed.

The existing migration runner was invoked with **only --check** in a child process with ambient DATABASE_URL and PLAN_MIGRATION_* overrides removed, so the dedicated staging file supplied its connection settings. No --apply command was executed. No backup, restore, application startup, deployment, live environment change or Git push was performed.

## Next step

The staging connection is verified for backup and migration testing. Install/check compatible PostgreSQL backup clients, capture the staging backup, and prove restoration on a separate disposable target before authorizing migration application. Use the direct connection for administrative backup/migration operations. See `docs/excel-staging-readiness.md` for the guarded sequence.
