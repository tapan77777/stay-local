# Original StayLocal — production identity and schema verification

Verified 2026-11-02. **PASS: confirmed production branch matches the original deployed Plan Builder's SQL baseline. No missing admin tables/columns or schema fix found.** No production writes, migrations, credential/environment changes, deployment or diagnostic deletion occurred during these checks.

## Identity chain

- Original repository: `tapan77777/stay-local`.
- Vercel project: `stay-local`, `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e`.
- Original live deployment: `dpl_FYgpwS3iZ3xze1oJQciiz8USHHom`, source commit `7e84d3d29acc0374384f39277b525bb8e59eb71f`.
- Owner authenticated to the temporary diagnostic and supplied Neon project **lucky-waterfall-84436365**, branch **br-broad-pond-b3nfbi06**.
- A fresh `.env.local` connection reported the same project/branch and read_only=on. Every subsequent remote schema/EXPLAIN transaction asserted those exact project/branch IDs and read-only mode before doing anything else. No shell/environment fallback was used for the connection.
- PostgreSQL 18.6. Previously owner-associated Neon display name: staylocal-2. A fresh Neon control-plane display-name/parent-relationship lookup was not available; do not infer another application's ownership from that name.
- Fresh read-only Vercel metadata reconfirmed original live source commit, primary alias, Production DATABASE_URL metadata and protection unchanged.

This resolves the original production database identity uncertainty: the owner-confirmed production-configured diagnostic and direct SQL metadata agree. Historical environment timestamps support that the original Git deployment uses the same production configuration; no secret URL was revealed or replaced.

## Prisma correction

**The original deployed application does not use Prisma.** Its package manifest has no Prisma client/tool dependency, its tracked source contains no schema.prisma, and its admin services use the existing Neon SQL client (`lib/plan/db.ts`). Its deployed schema is defined by five SQL files:

- lib/plan/schema.sql
- lib/plan/schema-2a.sql
- lib/plan/schema-3-devices.sql
- lib/plan/schema-4-module-images.sql
- lib/plan/schema-5-profile-photo.sql

A Prisma migration, db push or replacement ORM model would be unrelated to this application and is not recommended.

## Method and results

Loaded those five files from the exact original live Git commit into a disposable in-memory PostgreSQL instance to derive expected metadata. No expected-schema DDL ran against Neon. Compared production metadata in read-only, identity-pinned transactions with bounded statement/lock timeouts.

| Check | Result |
|---|---|
| Baseline tables | **14/14 present** |
| Required columns | **178/178 present** |
| Types, nullability, defaults and lengths | **Match** |
| Primary/unique/check/foreign-key constraints | **Match** |
| Enum labels | **Match** |
| Baseline indexes | **Match** |
| Schema usage and table SELECT permissions | **Pass** |
| Row-level-security flags | None enabled on inspected public tables |
| Missing tables affecting admin | **None found** |
| Missing columns affecting admin | **None found** |

Tables: customers, plans, destinations, itinerary_days, places, transports, stays, foods, experiences, map_pins, destination_notes, india_guide_items, plan_documents and plan_devices. In particular, the deployed profile-photo, module-image and device-cap fields are present.

Also ran **EXPLAIN without ANALYZE** for:

1. The exact dashboard counter query extracted from deployed plans.ts.
2. The exact joined recent-plan projection extracted from deployed plans.ts, with its ten-row limit.
3. The customer-list field projection.

All planned successfully. No actual customer query results were fetched; EXPLAIN plans were discarded, not published. This verifies query references/planning and SELECT access, not browser rendering, write behavior, concurrency or correctness of every customer row.

Structured receipt: `outputs/database-identity-diagnostic/production-schema-verification.json`.

## Excel schema distinction

The unreleased Excel schema-6 objects are absent:

- plans.content_version
- plan_excel_previews
- plan_excel_revisions

They are **not required by the currently live original admin**, so their absence is expected and not an admin repair. They still require the separate approved backup/recovery/migration/release process before Excel is deployed. No schema-6 DDL ran here.

## Smallest safe recommendation

**No database change.** Production already has the deployed admin's required schema. Do not run Prisma tools, baseline migrations or Excel schema-6 to troubleshoot an unspecified admin-page error.

If an admin page still fails, obtain its exact URL and error/digest, then inspect that original deployment's runtime logs and the failing application code. Fix the smallest demonstrated application/configuration issue; these schema checks do not establish the cause of an unprovided error. No guessed ALTER TABLE or model replacement is justified.

The exposed reused credential remains a separate remediation task requiring its consumer inventory and coordinated explicit approval; these read-only checks did not rotate it. Production backup/recovery and Excel release approval also remain separate gates.

## Diagnostic cleanup hold

The owner has retrieved the two identifiers and the relevant read-only checks are complete. **Request explicit deletion approval before removing `dpl_9ncc6Ao2kdcWtQtupBCNDm6D7wtt`.** Do not interpret sharing the IDs as deletion permission.

Keep its unique URL available meanwhile. Reverify original project, current alias bindings and diagnostic ID before any later approved removal; no original live alias/deployment may be removed. After deletion, verify deployment 404 and original live aliases/settings unchanged. This check did not delete or redeploy anything.
