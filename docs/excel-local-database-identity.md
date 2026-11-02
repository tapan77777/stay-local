# Local database identity — original StayLocal

**2026-11-02 update:** the owner retrieved production identity from the authenticated diagnostic; fresh read-only SQL verified project `lucky-waterfall-84436365`, branch `br-broad-pond-b3nfbi06`. All 14 deployed baseline tables and 178 columns match. Earlier production-identity uncertainty below is historical. See [current production schema verification](excel-production-schema-verification.md). This does not approve migration or deployment.


Fresh read-only verification on 2026-11-01. Read `.env.local` directly without process.env, Next environment-loading or Vercel fallback. All remote queries ran in a Neon transaction with `readOnly: true`; the server confirmed transaction_read_only=on. No customer rows were read. No passwords, URLs, environment variables, databases or deployments were changed.

| Item | Result |
|---|---|
| Original repository | `tapan77777/stay-local` |
| Original Vercel project | `stay-local`, `prj_9FAWBUHlqxFlk00cFMMSU9uVWV8e` |
| Original production alias | `https://stay-local-beryl.vercel.app` |
| Local Neon project ID | `lucky-waterfall-84436365` |
| Local Neon branch ID | `br-broad-pond-b3nfbi06` |
| Local database / role | `neondb` / `neondb_owner` |
| PostgreSQL | 18.6 |
| Explicit app environment label | None; does not prove development or production |
| Plan Builder schema | All 14 baseline tables present; no Excel tables in the returned public base-table list |

## Project comparison

The existing verified staging receipt associates the owner-identified project **staylocal-2** with `lucky-waterfall-84436365`, branch **excel-import-staging** / `br-cold-sea-b33m80x4`. The local connection and that staging target therefore report the **same Neon project ID, different branch IDs**. The project display-name association comes from the owner-confirmed staging setup, not an independent fresh Neon management API response.

The separate project named **staylocal** cannot be compared independently: no Neon management connector/CLI or API credential was available. Its project/branch IDs and its relationship to the original application's live DATABASE_URL remain unknown. A project name alone is not evidence that it serves the original or v2 application.

Vercel's sensitive Production DATABASE_URL was previously unavailable to the inspection session. This local query does not verify its value, endpoint, project or branch. Earlier claims that a blank/redacted Vercel value differed from the local URL must not be treated as a valid endpoint comparison.

## Does another staging branch need to be created?

**Do not create another branch yet.** The existing staging branch is in the same Neon project as `.env.local`, but the actual original production mapping is still missing.

- If the authorized owner confirms the original `stay-local` Production DATABASE_URL maps to `lucky-waterfall-84436365` / `br-broad-pond-b3nfbi06`, and Neon confirms the existing staging branch was created from that source with the intended baseline, the existing staging branch may be reused. No duplicate branch is needed solely because the project is named staylocal-2. Resolve credential remediation first.
- If the original live app uses the other Neon project or a different source branch/baseline, prepare isolated staging from that **verified original source** and rerun the relevant migration/recovery/acceptance checks. Existing staging tests alone do not prove compatibility with that different source. Branch creation is not authorized/performed here.

Safest next step: an authorized owner privately maps **Vercel stay-local → Production DATABASE_URL** to the endpoint in Neon Console, then records the actual project ID and branch ID. Use an original secret-manager/integration record if Vercel cannot reveal the sensitive value. Do not reset a password, overwrite live variables or copy a guessed URL to force a match. Save matching pooled/direct URLs only in the prepared ignored `.env.excel-production.local` and confirm the mapping before the read-only production verifier connects. Do not paste secrets into chat.

**Stop state:** local database identity verified; original live production database unverified. No further database operations, resets, migrations or deployments are appropriate until that mapping is established.
