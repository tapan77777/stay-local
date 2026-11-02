# Excel release — credential remediation and production verification

Reviewed 2026-11-01. **HOLD. Rotation is not complete; production identity/schema are not verified.** No password reset, database connection, production write, migration, live environment change, deployment or push was performed in this step.

## Exact incident scope (no secret values)

One Neon role/password credential was present in two URL forms, not two independent passwords:

- Role `neondb_owner`, database `neondb`, staging branch `excel-import-staging` / `br-cold-sea-b33m80x4`, Neon project ID `lucky-waterfall-84436365` (owner's name `staylocal-2`).
- Exposed file: `config/excel-staging.env.example`, under DATABASE_URL (pooled) and PLAN_MIGRATION_DATABASE_URL (direct). It was untracked/eligible for commit, not safely ignored. Both real URLs have already been replaced with placeholders. The earlier inspection also exposed the value in tool output; removing it from source does not revoke it or erase conversation/platform copies.
- Current private copies: `.env.excel-staging.local` contains the same role/password in its pooled/direct values; `.env.local` contains **the same password and role for a different endpoint**. Both are ignored and untracked. Neither was changed. `.env.local` remains unclassified; do not use it as production configuration. Its existing permissions were 644; the staging file was 600. Restrict the local file's filesystem access in an owner-approved way; no chmod/content change was made to it here.
- Workspace search excluding Git/dependency/build trees found this password only in those two private files after sanitization. No passwords/URLs are reproduced in this report. No admin/session secret exposure was found by the bounded known-secret scan.

**This is not proven staging-only.** The password is reused at another known endpoint, and production Vercel's sensitive values cannot be downloaded here. The exposed password could authenticate any branch where the same role/password remains valid; no cross-branch login probes were performed. Neon roles/password resets are branch-scoped, and reset credentials stop working for subsequent connections on that selected branch. Rotating staging does not revoke an identical password on a parent/sibling branch. [Neon role and password-reset documentation](https://neon.com/docs/manage/roles).

## Step 1 — establish dependencies; do this now, without resetting

1. In Neon Console select **staylocal-2 → excel-import-staging** and verify ID `br-cold-sea-b33m80x4`, then **Postgres database → Roles → neondb_owner**. Do not click Reset yet. Record only branch/project IDs and role name in nonsecret discussion.
2. Inventory consumers of this staging branch/role: private local Excel configuration, running test servers, backups/maintenance, CI, previews and any integrations. Console role selection alone does not prove all consumers are known. Pause staging jobs and plan to update all its clients together.
3. Identify the other endpoint in `.env.local` privately in Neon Console. The historical read-only report associated that file with `br-broad-pond-b3nfbi06`; this is not a fresh verification or a production classification. Confirm its branch/project purpose and consumers without connecting to an uncertain target. Do not reset it blindly.
4. In Vercel project **stay-local** / `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e`, inspect the **Production DATABASE_URL** dependency through an authorized owner/secret manager/integration record. Sensitive values return empty to this CLI. Do not substitute the database for `staylocal-v2`, infer identity from a branch named production, or overwrite Vercel to make a guessed URL fit.
5. Return nonsecret branch IDs, purposes and consumer names. If any affected branch is production or shared, stop and obtain explicit approval for its coordinated rotation/cutover. This task does not authorize production credential invalidation or Vercel changes.

## Step 2 — rotate the confirmed staging role only after Step 1 is complete

These are future owner actions, **not performed here**:

1. Recheck the staging branch ID in the Console immediately before the action. Ensure no production consumer actually points to this branch. If uncertain, stop.
2. On **that branch's neondb_owner**, choose **Reset password → Reset**. This changes credentials and can interrupt clients; do not do it to the production branch. Wait for the Neon operation to finish.
3. In **Connect**, choose the same staging branch/database/role. Copy a fresh connection string with pooling ON into `.env.excel-staging.local` DATABASE_URL and pooling OFF into PLAN_MIGRATION_DATABASE_URL. Use a private editor; no terminal echo, chat, tracked example or command argument. Keep the other staging auth secrets intact; do not edit `.env.local` or any Vercel production value. Update each confirmed staging consumer privately, then restart its local/test connection pools as needed.
4. Confirm the new password differs privately, Neon reports reset complete, and both new connections pass pinned **read-only** identity checks for `br-cold-sea-b33m80x4` / `lucky-waterfall-84436365`. Do not rerun migration or acceptance scripts that write data to check a password.
5. Branches where the old password was copied still require their own remediation. If the reused password is confirmed on production, coordinate an approved parallel-role or scheduled reset strategy, permissions, all consumer updates and deployment/reconnection handling. Creating a parallel role alone does not revoke the old credential. Do not reset/delete/disable production roles under this task's restrictions.
6. Mark overall rotation complete only when every confirmed use of the exposed password is revoked or its owner has independently verified it was never valid there. A new working staging URL alone does not prove that.

## Git and file evidence

- PASS: no exact known local/staging URLs/passwords/admin secret values or Neon password literals found in the 256 Git-eligible files scanned before the verifier additions.
- PASS: scanned **326 Git blobs**, covering all locally reachable refs and reflogs; no known credential matches or Neon password literals. Repository is not shallow. Local main and origin/main refs were included. The example path has **zero commits** in this clone.
- PASS: `.env.local`, `.env.excel-staging.local`, `.env.excel-production.local`, `.env.excel-production-service.conf`, `.env.excel-predeploy/` and `.vercel/` are covered by ignore rules and are not tracked. Do not force-add them.
- Limits: this is not a scan of unknown passwords, other machines/clones, newer remote refs, provider artifacts, all unreachable Git objects or conversation/platform retention. No fetch, history rewrite, force push or log deletion was performed. If any outside copy was published, coordinate its removal separately; rotation remains required even after removal.

## Private production setup — prepared

Created `.env.excel-production.local` only because it did not exist, from the production example, mode **600**, ignored and untracked. It currently contains placeholders and **no configured production credential**. Existing `.env.local` and live Vercel settings were not changed.

Privately fill these keys:

| Key | Value to obtain |
|---|---|
| DATABASE_URL | Production **pooled** URL for the independently confirmed live builder branch, database and application role. |
| PLAN_PRODUCTION_DIRECT_URL | Same branch/database/role, **direct/unpooled** URL. |
| PLAN_PRODUCTION_EXPECTED_BRANCH_ID | Actual `br-...` copied from the selected branch's details; not a display name. |
| PLAN_PRODUCTION_EXPECTED_PROJECT_ID | Actual Neon project ID from its settings/details; not Vercel's project ID or the owner's display name. |
| PLAN_PRODUCTION_IDENTITY_CONFIRMED | Set `yes` only after the owner confirms this branch/endpoint/database matches **stay-local Production**. |

In [Neon Console](https://console.neon.tech/), select the confirmed project and branch, click **Connect**, select the intended database and role, and copy with pooling enabled for DATABASE_URL. Toggle pooling off and copy again for the direct URL. Keep branch, role and database unchanged. The direct hostname must lack `-pooler`; this check alone does not establish production identity. Keep Neon's SSL options. Get the branch ID from branch details and project ID from project settings. Do not reset a production password just to reveal/copy a URL; use the authorized original secret if unavailable. [Neon connection instructions](https://neon.com/docs/connect/connect-from-any-app).

If no authorized original URL or deployment-to-endpoint mapping is available, stop and request the Vercel/Neon owner to reconcile it. No remote configuration change is authorized merely to make verification possible.

## Read-only verification commands — do not run connections until configured

```sh
# Configuration only: no remote connection, no environment fallback.
node scripts/production/verify-readonly.mjs

# Only after the private owner-confirmed values are configured:
node scripts/production/verify-readonly.mjs --connect
```

The verifier never loads `.env.local` or uses DATABASE_URL from the calling shell. It requires owner mapping confirmation, valid matching pooled/direct Neon URLs with TLS and a non-staging branch ID. It first checks **both** URLs in read-only transactions for project/branch/database/server identity, stopping before schema inspection on mismatch. Schema metadata is then inspected in another read-only transaction with an identity assertion, bounded query timeout, and no customer-row reads. Expected schema is built only in disposable in-memory PGlite, not Neon. Output contains identifiers/schema issues, never URLs, passwords or raw connection errors.

Compatibility checks cover all 14 baseline tables, their required columns/types/nullability/defaults, baseline constraints/enums and basic application content privileges. Existing schema-6 objects force review rather than assuming a partially applied migration is safe. DDL privileges, ownership/grants, additional custom policies/constraints/writers and production recovery still need operator review; this script is not a migration approval or complete security audit.

Executed here: configuration check stopped with **PRODUCTION_CONFIGURATION_INCOMPLETE**, before creating a network client. **36 local tests PASS**, including three new configuration/schema-check tests; TypeScript and lint PASS. No production identity/schema connection was run because production credentials/mapping remain absent. No need to rerun the application build for these operator/docs-only changes; the prior application build passed.

## Current decision

- Credential rotation: **NOT COMPLETE**, pending branch/consumer confirmation and owner action. Staging-only rotation will not address the confirmed password reuse by itself.
- Production identity/schema verification: **BLOCKED / NOT EXECUTED**, placeholders only.
- Ready for the production backup stage: **NO**. Finish dependency mapping and remediation, supply owner-confirmed private credentials, and pass read-only verification and outstanding schema/permission review first. Production backup/recovery and subsequent changes still require their separately scoped approval.
