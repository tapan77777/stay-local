# Original StayLocal admin error — read-only investigation

Investigated 2026-11-02. **Diagnostic cleanup completed. The reported admin error has not been reproduced or identified; its exact failing URL/request, error/digest and timestamp have not yet been provided. No root cause is claimed.**

## Cleanup verified

Deleted only `dpl_9ncc6Ao2kdcWtQtupBCNDm6D7wtt` after confirming original project identity, zero assigned aliases and all original aliases on the live deployment. Removal used the exact ID with --safe. Follow-up API returned **404 / deployment not found**.

All three original aliases remained on `dpl_FYgpwS3iZ3xze1oJQciiz8USHHom`:

- stay-local-beryl.vercel.app
- stay-local-tapan77777s-projects.vercel.app
- stay-local-git-main-tapan77777s-projects.vercel.app

Production target, environment metadata and protection were unchanged. Receipt: `outputs/database-identity-diagnostic/final-cleanup-result.json`.

## Runtime-log investigation

Queried only the original production deployment, with no follow/stream, no branch auto-filter and a 100-result cap:

1. Error-level runtime logs, last 24 hours: command succeeded, **0 records returned**.
2. HTTP 5xx request records, last 24 hours: command succeeded, **0 records returned**.

Both explicitly selected original project `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e`, original deployment and production environment. Raw CLI results are stored under owner-only, Git-ignored `.env.admin-error-investigation/`; no raw customer logs or credentials were published.

These are results within the available log service/retention/filter scope. They do not establish that an older, different-route, browser-side or different-deployment error never happened. The absence of matching records cannot establish a root cause.

## Exact request actually tested

Used the existing locally configured admin signing secret privately to make a short-lived signed session. A GET to the original production `/admin/login` returned 307 to `/admin`, confirming authentication. No login POST, session persistence, credential/cookie output or production setting change.

Then made one authenticated GET of the original dashboard, whose deployed server code was inspected and contains only SELECT queries:

| Field | Result |
|---|---|
| Host | stay-local-beryl.vercel.app |
| Method/path | GET /admin |
| Start, UTC | 2026-11-02T03:49:18.083Z |
| Local start, IST | 2026-11-02 09:19:18 IST |
| Complete, UTC | 2026-11-02T03:49:20.979Z |
| HTTP status | **200** |
| Dashboard content markers | Dashboard / Recent plans rendered |
| Server exception page | No |
| Error digest | None |
| Vercel request ID | bom1::iad1::swrmp-1793591358890-ee054c8af673 |

Response HTML/customer content was not persisted or printed. Receipt: `outputs/database-identity-diagnostic/original-admin-readonly-probe.json`.

This tests the dashboard root, not an unspecified nested admin page or the user's browser request. It does not establish browser-side rendering, asset/cache/session behavior or form submissions. No forms/actions were submitted and no application data was modified.

## Schema finding and smallest safe action

The separate identity-pinned production schema check passed all **14 tables and 178 columns**, constraints/types/defaults/enums/indexes/read permissions and admin query planning. Original persistence is Neon SQL, **not Prisma**. See [production schema verification](excel-production-schema-verification.md).

**No database, deployment, credential or settings fix is justified by the evidence.** A missing-table/column root cause was not found. Avoid Prisma tools or schema-6/baseline migrations as speculative fixes.

To identify the actual root cause and recommend a minimal evidenced fix, obtain:

- The exact failing admin URL (omit private customer plan tokens/details).
- HTTP status and visible error/digest, or browser console message if it is client-side.
- Approximate timestamp with timezone; a request ID if already available.
- Whether it happens on login, page navigation or form submission. Do not repeat a form that might mutate data merely to reproduce the problem under this read-only scope.

Then correlate that specific request in original-production logs, inspect its deployed source and, where safe, reproduce only its GET/read path. If the URL is for another application/deployment, establish that mapping rather than attributing it to this verified original Plan Builder.

**Current state:** cleanup PASS; original dashboard GET PASS; no matching historical errors found; actual reported root cause **unconfirmed, blocked on failing-request details**. No database modification, new deployment, environment/security change, migration or Git push occurred.
