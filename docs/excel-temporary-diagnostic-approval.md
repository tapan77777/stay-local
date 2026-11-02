# Temporary original StayLocal diagnostic — corrected pnpm candidate

**Execution update:** the corrected build is READY. The unexpected project alias reassignment was restored under explicit owner approval; all three original aliases now point to the original deployment. The diagnostic remains available only through its unique URL for owner-assisted identity retrieval. No diagnostic query or deletion was performed. See [current execution status](excel-diagnostic-execution-status.md).

Updated 2026-11-01. **READY FOR REVIEW/NEW DEPLOYMENT APPROVAL. No replacement was deployed.** The failed temporary deployment was deleted by its exact approved ID. Original live aliases, environment metadata and protection were verified unchanged afterward.

## Failed deployment cleanup

- Deleted only `dpl_HQZBvpnJYKUvgHHiQFCfM4SMYQzN` with `vercel remove <exact-ID> --safe --yes`.
- CLI confirmed removal, not skipping. A separate read-only API check returned **HTTP 404 / deployment not found**.
- All three original aliases still pointed to `dpl_FYgpwS3iZ3xze1oJQciiz8USHHom`; production environment metadata and `all_except_custom_domains` protection matched preflight.
- Receipts: `outputs/database-identity-diagnostic/deletion-result.json` and `cleanup-safety.json`.
- No database query, password reset, migration, Git push or production-setting change occurred. The approval to delete the failed deployment does not authorize a replacement deployment.

## Root cause and corrected package-manager policy

The original repository contains pnpm-lock.yaml format 9.0. Vercel selected pnpm, while earlier local testing used the separately repaired npm lock. The pnpm importer still named old Next/React versions and did not match the patched manifest. This caused ERR_PNPM_OUTDATED_LOCKFILE before application compilation. The previous npm-only readiness conclusion was insufficient.

The isolated candidate now:

1. Uses **pnpm 9.15.9**, compatible with the original format-9 pnpm lock. It is pinned in `package.json` as `packageManager: "pnpm@9.15.9"`.
2. Removes the competing **package-lock.json from the isolated candidate only**. The main Excel checkout's files were not changed.
3. Regenerates pnpm-lock.yaml against the patched manifest, preserving original unrelated dependency ranges/resolutions. Every importer specifier was checked against package.json. Next/React patch changes and compatible Zod remediation are the version changes; the original pnpm graph already had source-map-js 1.2.2.
4. Adds candidate-local **vercel.json** with an explicit pinned install command and explicit prebuild/build commands. These are source-controlled per-deployment settings, not Vercel dashboard/environment changes. No Corepack environment switch or global pnpm activation is required.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "npx --yes pnpm@9.15.9 install --frozen-lockfile",
  "buildCommand": "npx --yes pnpm@9.15.9 run prebuild && npx --yes pnpm@9.15.9 run build"
}
```

The npx bootstrap is pinned too, avoiding Vercel's ambiguous default pnpm 9/10 selection or the old pnpm fallback for an unversioned custom install command. The explicit prebuild preserves the original MapLibre worker-copy step without depending on pnpm's optional pre/post-script behavior. [Vercel package-manager and per-deployment override documentation](https://vercel.com/docs/package-managers).

## Exact local verification matching the candidate configuration

Moved previous node_modules and .next outside the isolated candidate, then ran the **literal installCommand and buildCommand from vercel.json**, in CI mode with database/admin/access credentials and test preloads removed from the child environment. This used normal dependency install scripts, not ignore-scripts, force, no-frozen-lockfile or a linked external toolchain.

| Check | Executed result |
|---|---|
| Clean frozen installation | **PASS**, pnpm 9.15.9; exit 0; pnpm-lock.yaml unchanged. |
| Exact configured prebuild/build | **PASS**, Next 16.4.3; exit 0; lockfile unchanged. |
| pnpm lint | **PASS**. |
| TypeScript | **PASS** after `pnpm exec next typegen`; Next-generated PageProps/LayoutProps require type generation before standalone tsc on a fresh directory. Build's TypeScript check also passed. |
| Focused diagnostic security tests | **5 PASS**: auth before query, exact safe projection, invalid/read-write identity rejection, raw-error redaction/expiry and HEAD handling. |
| Rebuilt Next HTTP tests | **7 scenario groups PASS** with actual candidate Next/React packages: missing/tampered/expired admin cookies denied without SQL; valid admin cookie returns exactly two IDs; real Neon read-only flag; methods/cache/errors; unchanged PostgreSQL canary; Excel routes absent. |
| Disposable read-only enforcement | PostgreSQL returned transaction_read_only=on and refused a separate attempted canary UPDATE with 25006. No remote database connection. |
| Frozen manifest/lock matching | Every importer specifier equals the corresponding package.json requirement. Only pnpm lockfile remains. |
| Source archive integrity | Extracted archive and compared every allowlisted file hash; 216 files, no private env/build/cache/node_modules/symlink payload. |
| Vercel cloud replacement build | **NOT EXECUTED**: no replacement deployment authorized yet. Local command parity does not guarantee cloud success. |

Installed versions: Next/eslint-config-next **16.4.3**; React/React DOM **19.2.9**; MapLibre **6.12.0**; source-map-js **1.2.2**; Zod **4.6.7**; sharp **0.35.5**. Existing MapLibre worker is unchanged.

Fresh audits used the **actual pnpm graph**:

- `pnpm audit --prod --json`: **0 vulnerabilities**.
- `pnpm audit --json`: **0 critical/high; 2 moderate findings**, both minimatch versions reached through development lint tooling. Runtime audit is clean. This counting differs from npm's propagated package-entry count; do not compare the number directly to the earlier npm report.
- Moderate advisory remains tracked: [minimatch amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249). No forced unrelated major tooling upgrade. Existing ESLint 9 and pnpm/Node deprecation notices are not claimed fixed.

Receipts/logs: `pnpm-install-result.json`, `pnpm-build-result.json`, their `.log` files, `unit-results.txt`, `http-results.json`, `audit-full.json`, `audit-runtime.json` in `outputs/database-identity-diagnostic/`.

## Application scope and identity

Base: original deployed GitHub `tapan77777/stay-local`, commit **7e84d3d29acc0374384f39277b525bb8e59eb71f**.

Target for a separately approved deployment: **stay-local**, project `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e`, team `team_0zlxAaQ3CsonSP48xRhd8ghC`. Never staylocal-v2.

Of 214 original tracked files:

- **211 unchanged** application files, including existing auth/db/builder code and the public MapLibre worker.
- Modified only package.json and pnpm-lock.yaml; removed package-lock.json.
- Added only two diagnostic runtime files plus vercel.json.
- No Excel application code, schema-6, migrations, private environment file or test preload in the candidate.

Isolated source: `/tmp/staylocal-original-identity-87z6lnf2`. Main Excel checkout application/package files remain untouched.

## Diagnostic security behavior — unchanged

`GET /admin/diagnostics/database-identity` uses existing admin-cookie authentication before obtaining a database client. It uses the original runtime DATABASE_URL and one Neon transaction with readOnly:true, transaction-local 5s statement/1s lock timeouts, 8s HTTP timeout and 15s function limit.

It reads only neon.project_id, neon.branch_id and transaction_read_only. Success requires exactly one row, non-null restricted-format IDs and read_only='on'. It explicitly returns only:

```json
{"project_id":"<Neon project ID>","branch_id":"<Neon branch ID>"}
```

No credential, role/database name, customer row, schema or raw exception is returned/logged. Generic 401/503 errors, explicit HEAD rejection/no POST handler, dynamic/private/CDN no-store, Cookie variation and no CORS permission remain tested. No new production environment variable or secret is needed.

Fixed expiry remains **2026-11-03 03:30 UTC / 09:00 IST**. After expiry, authenticated requests fail before SQL. Recheck the time before approval/deployment; an expiry extension would require review, repackaging and retesting. Expiry is not deployment deletion.

## Corrected review artifacts

`outputs/database-identity-diagnostic/` now contains the corrected source archive, combined release.patch, manifest/lock/Vercel-config review copies and complete file hashes in source-verification.json. The prior npm artifact is superseded; do not redeploy it.

- Source archive SHA-256: **2ead509bbf99505a12410aeaebd1e296914157464f80f57c53a50bff642ce56c**.
- Combined patch SHA-256: **16e5eb2e0bb6ced070457782e41c69bd68f967d417cf4c2cb81dc14e207ea688**.
- `candidate-source.sha256` is the machine-readable archive check.
- The two diagnostic runtime files themselves are unchanged from the previously reviewed diagnostic-only patch.

## Plan for a NEW approval — not executed

1. Obtain explicit approval for this corrected artifact, one protected unpromoted temporary deployment and the owner's authenticated read-only check. Confirm cleanup timing separately; do not delete before the owner confirms retrieval unless otherwise instructed.
2. Immediately before execution, reverify candidate hashes/expiry and original project, live deployment/aliases, protection and environment metadata. Live checkpoint: `dpl_FYgpwS3iZ3xze1oJQciiz8USHHom`, main alias `stay-local-beryl.vercel.app`. Stop if changed. No new settings, install-command dashboard override, secret or protection bypass is required.
3. Only after approval, deploy the verified isolated source with production configuration and live alias assignment disabled:

```sh
# FUTURE APPROVED ACTION ONLY — not run for this corrected candidate
VERCEL_ORG_ID=team_0zlxAaQ3CsonSP48xRhd8ghC \
VERCEL_PROJECT_ID=prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e \
  vercel deploy /tmp/staylocal-original-identity-87z6lnf2 --prod --skip-domain
```

The original source includes about 70 MB of media; allow sufficient upload time. If a CLI response is lost, reconcile deployment records before any retry to avoid duplicates. Never promote or change live domains.

4. Require READY, correct original project, no assigned live aliases, unchanged original live mappings/settings and existing Vercel protection. A cloud failure is a stop, not permission for another deployment or setting change.
5. Owner signs in to Vercel and normal StayLocal admin on the unique temporary URL, then opens `/admin/diagnostics/database-identity` and shares only the two IDs. No credentials/cookies/HAR output. No plan edits or device registration.
6. After the owner's retrieval/cleanup confirmation, verify the recorded temporary deployment ID is not live and has no assigned live aliases, remove only it with --safe, verify 404 and original live state afterward. Never remove by project name or live domain.

The diagnostic identifies its runtime production-configured connection. Historical live equivalence still depends on confirming no deployment-specific override; the existing database variable metadata predates the original Git deployment. No original production Neon project/branch identity is claimed until the owner retrieves the result.

**Decision:** failed deployment cleanup verified; corrected pnpm candidate passes the local frozen-install, exact-build and security gates and is ready for a NEW narrowly scoped deployment approval. No replacement was deployed; production data, credentials and environment settings remain unchanged.
