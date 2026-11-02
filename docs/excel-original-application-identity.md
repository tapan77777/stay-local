# Excel Import — original application identity checkpoint

**2026-11-02 update:** the owner retrieved production identity from the authenticated diagnostic; fresh read-only SQL verified project `lucky-waterfall-84436365`, branch `br-broad-pond-b3nfbi06`. All 14 deployed baseline tables and 178 columns match. Earlier production-identity uncertainty below is historical. See [current production schema verification](excel-production-schema-verification.md). This does not approve migration or deployment.


Verified 2026-11-01 using local Git/source/link configuration and fresh read-only Vercel project/deployment metadata. **Original repository and Vercel target verified. Production Neon identity remains uncertain: STOP.** No database connections, password resets, migrations, database writes, environment changes, deployment or push were performed in this checkpoint.

## Original application — verified

| Identity | Verified value |
|---|---|
| Local repository | `/Users/tapannaik/Desktop/Projects/Stay-local` |
| GitHub origin | `https://github.com/tapan77777/stay-local.git` |
| Vercel project | `stay-local` |
| Vercel project ID | `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e` |
| Vercel team ID | `team_0zlxAaQ3CsonSP48xRhd8ghC` |
| Vercel Git integration | GitHub `tapan77777/stay-local`, repository ID `1395556378`, production branch `main`, repository root |
| Production alias | `https://stay-local-beryl.vercel.app` |
| Current production deployment | `dpl_FYgpwS3iZ3xze1oJQciiz8USHHom`, state READY, target production |
| Deployment URL | `https://stay-local-qnuxes1vh-tapan77777s-projects.vercel.app` |
| Deployed source | `tapan77777/stay-local`, `main`, commit `7e84d3d29acc0374384f39277b525bb8e59eb71f` |

The deployment's source commit equals this checkout's HEAD. The Excel implementation is still local/uncommitted and is not part of that deployed commit. Source inspection confirms it extends the existing Personalized Plan Builder's routes, services, authentication and schema in **this original repository**:

- `app/admin/plans/excel/route.ts` uses existing `lib/plan/auth` and the Excel database adapter.
- `app/admin/plans/import/page.tsx` uses existing customers/plans and admin components.
- `lib/plan/excel/*`, `lib/plan/schema-6-excel.sql` and existing builder mutation services are in this checkout.
- Local `.vercel/project.json` points to the original project's ID above.

## StayLocal v2 — separate, excluded

Fresh Vercel metadata identifies a different project/repository:

- Project `staylocal-v2`, ID `prj_nBpytWrr3c0XzBDLVxX57OCI7lBz`.
- Git integration `tapan77777/staylocal-v2`, repository ID `1241342751`.
- Production alias `https://staylocal-v2.vercel.app`.
- Current production deployment `dpl_BCdxSHnkJrD8wE1T2229J7e9VnLJ`, source `7305285b76b19d758f3e656b1388b43283c46197`.

It is not the Excel release target. No v2 source checkout was changed during the reviewed Excel work.

## Previous preparation review

- Earlier discovery read metadata/environment availability and public unauthenticated routes for **both** projects to distinguish them. Those read-only comparisons did include v2; they were not deployments or database operations.
- The release checklist's prepared command explicitly uses the original `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e` project and its team, not v2's project ID. It has not been executed.
- Existing staging guards pin `br-cold-sea-b33m80x4` / `lucky-waterfall-84436365`. Real staging acceptance used this pinned target, with the original repository's running application. This proves the code ran on that staging schema, **not that the staging branch was cloned from the original application's actual production database**.
- No evidence in the reviewed Excel release artifacts shows a v2 production migration, password reset, write, deployment or push. This statement is scoped to these artifacts/actions; it is not an organization-wide audit of all activity.
- **Unresolved risk:** the owner-provided Neon name `staylocal-2` can be confused with the v2 application. Neither this name, its branch named `production`, nor the local database URL proves a link to the original Vercel project. Re-establish that mapping before credential remediation or production preparation continues.

## Neon and production environment — not verified

| Item | Status |
|---|---|
| Original Vercel Production environment | Project/deployment scope verified as original `stay-local`. Prior metadata lists DATABASE_URL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET and NEXT_PUBLIC_PLAN_MAP_DEBUG; sensitive values were not readable. |
| Original production Neon project name/ID | **UNKNOWN / NOT VERIFIED** |
| Original production Neon branch name/ID | **UNKNOWN / NOT VERIFIED** |
| Original production endpoint/database mapping | **UNKNOWN / NOT VERIFIED** |
| Configured private verification URLs | None: `.env.excel-production.local` still has placeholders and owner confirmation is false. |
| Previously used staging project | Owner name `staylocal-2`; SQL-verified project `lucky-waterfall-84436365`; branch `excel-import-staging`, `br-cold-sea-b33m80x4`. Association with original production remains unproven. |
| Local `.env.local` | Historically reported `br-broad-pond-b3nfbi06`; unclassified, not a production target and not queried here. |

An accessible production-scoped variable **name** is not verification of its value or target database. Do not substitute `.env.local`, a v2 URL, staging's parent or a guessed production branch. Do not rotate the shared password while these dependencies remain uncertain.

## Required next evidence

The authorized owner must establish the endpoint/database/role referenced by **Vercel stay-local → Settings → Environment Variables → Production DATABASE_URL** using its authorized secret manager or integration/connection records, and map that endpoint to Neon Console's project and branch. If the sensitive value is hidden there too, obtain the original secret/mapping from its owner; do not replace live configuration merely to enable inspection.

Record the actual original Neon project name/ID and production branch name/ID (nonsecret). Save the matching pooled and direct URLs only in `.env.excel-production.local`, never chat or tracked files, and set owner confirmation only after the mapping is independently established. No need to change `.env.local` or any Vercel environment value.

Only then may the already-authorized read-only verifier check both endpoints and schema. If that identifies a different Neon project/parent from the staging acceptance target, stop and prepare correctly isolated staging from the original application database, then reassess relevant acceptance gates before release. Do not reuse the existing staging success as proof of original-production compatibility.

**Decision:** importer is implemented in the correct original repository; original Vercel project is verified; original Neon production identity is not verified. Production preparation, password resets and all production-impacting actions remain on hold.
