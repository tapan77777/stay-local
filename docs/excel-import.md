# Excel bulk import and update

## Setup

Run `npm ci`, then follow [the guarded staging setup](excel-staging-readiness.md). The migration runner now requires an explicit verified nonproduction target and never falls back to the configured application database. The additive `lib/plan/schema-6-excel.sql` migration creates `plan_excel_previews`, `plan_excel_revisions`, the `plans.content_version` column, and triggers/functions for concurrency protection. Existing tables and plans remain in place. Existing admin/database environment variables (`DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` or its existing fallback) are sufficient; the app needs no new environment variables. Migration operations require the separate PLAN_MIGRATION_* values documented in the staging guide. No remote migration was applied during implementation.

The UI routes are `/admin/plans/import` and `/admin/plans/import?plan=<selected-plan>`. The authenticated `/admin/plans/excel` handler serves downloads and validates/commits uploads. The existing Plan Builder remains the normal editing interface.

## Create a plan

1. Sign into admin. Create the customer first if necessary.
2. Choose **Plans → Import / Export → Download Blank Template**.
3. Read Instructions. Keep Metadata and header names unchanged. Asterisk headers are required for new records; positions begin at zero.
4. Change example rows from `EXAMPLE` to `UPSERT`, or replace them with your own rows. Unused examples remain ignored. Enter one Plan Overview row. Help is optional, also one row. All other sheets support multiple rows.
5. Assign stable `record_key` values, such as `havelock`, `day-1`, `beach`, `hotel`. Child rows refer to the destination's key in `destination_key`. Keys are unique within their worksheet, 1–80 letters/digits/hyphens/underscores; the `r_` prefix is reserved for exported records.
6. Select the existing customer in the admin interface, upload your `.xlsx`, then select **Validate and preview**.
7. Correct all reported worksheet/row/column errors and upload again. Review the plan summary, warnings and expanded field differences. You can deselect whole record changes. Linked additions/deletions must remain consistent.
8. Select **Confirm selected changes · create draft**. The system creates a DRAFT in one transaction and opens Plan Builder. No workbook can publish a plan or change access settings.

## Update and export

Open a plan and select **Export Excel**. Edit that copy, then select **Update from Excel / History**, upload it, inspect every change and confirm. Stable exported keys identify existing records *only within the selected plan*. Use a new human-readable key for additions. Preserve exported destination keys for references, or reference a newly added destination by its new key. Changing an exported key creates an addition; it never implicitly removes the old record.

- **Blank cells:** preserve the current value when updating; new records use existing database-compatible defaults.
- **Missing rows or sheets:** preserve current records when updating. Removing a row from Excel is not deletion.
- **`[CLEAR]`:** clears optional text to empty, optional dates/numbers to null, and optional enums to their supported default. Required name/title/position cannot be cleared.
- **`DELETE` in action:** explicitly deletes the matched record. Preview displays its previous fields. Delete every linked child explicitly before deleting a destination. Plan deletion is unsupported.
- **`EXAMPLE`:** ignores that row. Convert examples to UPSERT intentionally.
- **Positions:** zero-based, nonnegative whole numbers, unique within a destination/section (or the plan's destinations/guide/documents). They need not be consecutive.
- **Dates:** ISO `YYYY-MM-DD` strings or actual Excel date cells; no time component. Destination and itinerary dates must fit their enclosing ranges.
- **Numbers:** decimal numbers with no currency symbol/group separators for position, days, nights or coordinates. Both coordinates are required together.
- **Prices/timing:** existing fields are descriptive text, so use `INR 2,500 per person`, `mid-range`, `08:00 ferry`, etc. There is no structured currency or ferry-time enum. FERRY is not a supported transport enum; use OTHER with instructions.
- **URLs:** complete HTTP/HTTPS text values, no credentials. Paste URLs as plain text; Excel hyperlink objects and formulas are rejected.

Updates/restores preserve status, customer, private token, device limits, device registrations and access windows. New plans use the existing DRAFT mechanism. The current application does **not** treat DRAFT as a customer-access denial; visibility continues to use the existing private-link/name/device/access-window rules. Review settings before sharing a new plan.

## Conflicts and repeated submissions

Exports record their original plan and content version. A manual Plan Builder edit, reorder, deletion, settings change or another Excel update invalidates the export. A new edit after preview also blocks confirmation. Export a fresh workbook and reapply your intended changes. Confirmation does not overwrite concurrent changes.

Each preview expires after one hour and is committed at most once. Retrying a completed confirmation returns the same plan. Identical uploaded file bytes for the same customer reuse the import preview/receipt, preventing duplicate new plans on upload retries. Re-saving a workbook changes its bytes; this protection is for repeated submissions, not fuzzy matching trips. Download a fresh template for a separate trip.

Transactions cover all writes, version checks, revision history and the completion receipt. On an error, no partial plan or content is committed. Invalid selection combinations (for example accepting an itinerary without its new destination) are rejected atomically.

## History and restoration

Open **Update from Excel / History → Load revision history**. Each Excel save stores a numbered content snapshot with timestamp, shared administrator identity (`admin`), operation and counts. A baseline records the immediate content before each update/restore, including intervening manual edits. Ordinary builder edits are not individually versioned, but they advance the conflict counter.

Choose **Inspect / restore** to compare a revision to the current plan. Expand field differences, accept the intended records and confirm. Restoration creates a new revision; it does not erase history. It restores content relationships and record identifiers for this plan only. Access/customer/device settings are excluded. The UI shows the latest 100 revisions; stored history is retained.

## Upload safety and data retention

Only valid `.xlsx` archives up to 3 MiB and 2,000 populated non-example/example data rows total are accepted. Each worksheet is bounded to 2,002 rows and 40 columns; generated dropdowns extend to row 501, and server validation applies beyond them. Uncompressed archive content is limited to 16 MiB, individual parts to 8 MiB, and archives to 150 parts. Unknown sheets and mismatched columns are rejected. Macros, embedded objects, external data/links, formulas, XML entities and encrypted archives are rejected. The application never evaluates formulas. Normal strings beginning with `=` remain literal text cells, not formulas.

Names/titles: 200 characters; other text: 10,000. No credentials, private plan tokens or customer database IDs appear in workbooks. Export scope and stable record keys are selectors, not authorization. Authorization is checked server-side on every request, with same-origin mutation checks.

Unconfirmed previews contain plan content and expire after an hour; expired previews are purged on subsequent preview creation. Confirmed receipts retain identity/fingerprint for idempotency but have their content cleared. Revision content is retained with its plan and cascades on plan deletion. There is no scheduled retention job or per-user audit identity because the existing app uses a shared administrator account.

## Verify with the Andaman sample

1. Follow [the verified staging setup](excel-staging-readiness.md), including its guarded migration command and explicit `node --env-file=.env.excel-staging.local` app launch. Do not use the unclassified `.env.local` connection for testing.
2. Run `npm test` to generate `outputs/excel/andaman-sample.xlsx` and verify the isolated database suite.
3. Create/select a test customer. Import this sample via Plans → Import / Export.
4. Preview the Andaman plan, Havelock destination, Day 1 ferry at 08:00, stay and Help text. Confirm and check the existing builder/customer preview.
5. Export the created plan. In Itinerary, change morning to `09:30 ferry to Havelock`. Rename the hotel in Stays. Upload through that plan's Update from Excel screen, expand the differences and confirm.
6. Export again. Add a Places row with a new record_key, the exported Havelock destination_key, position 0, name `Radhanagar Beach`, priority `MUST_SEE`. Preview and confirm.
7. Set that Places row's action to DELETE and re-upload a fresh export. Inspect the deletion before confirming. Omit another row or blank an optional value to verify it remains unchanged. Use [CLEAR] when you intend to clear it.
8. Load history, inspect the original IMPORT revision and confirm a restoration. Verify the ferry/stay and relationships are restored while settings and other plans remain unchanged.
9. Export, make a manual builder edit, then upload the old export: expect a stale conflict. Repeat confirmation or the identical new-plan file upload: expect idempotent completion or an already-imported message.

## Verification commands and scope

- `npm test` / `npm run plan:test:excel`: isolated PostgreSQL (PGlite) tests for template, parser, merge engine, actual SQL transactions, handler authorization, update, delete, revision/restore, deduplication and conflicts; no configured remote database is touched.
- `npm run plan:test:devices:isolated`: existing device test script through a disposable PostgreSQL adapter. This validates existing SQL semantics, not multi-connection PostgreSQL lock contention.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- `npm run plan:test:app:isolated` (after build): starts the production Next app against an authenticated loopback bridge to disposable PGlite, runs the existing HTTP smoke suite, then exercises Excel authorization/template/preview/confirmation and Plan Builder. No configured remote database is used. The isolated tests do not replace staging verification of multi-connection Neon races or a real Excel desktop/mobile UI pass.

Dependency audit during implementation reported existing critical/high Next.js and other tooling advisories, plus moderate ExcelJS transitive advisories (archive glob matching/UUID APIs). The upload implementation uses bounded in-memory workbooks, not filesystem glob/archive paths or workbook-supplied UUID generation. A framework/dependency security upgrade remains separate work; no automated major downgrades were applied.

## Actual worksheet field mapping

Every content sheet begins with `record_key`, `action`; destination modules also include `destination_key`. Journey is represented by Destinations. Instructions and Metadata are informational/versioning sheets, not database tables.

| Worksheet | Database | Fields |
|---|---|---|
| Plan Overview | `plans` | `title` (required on add), `subtitle`, `traveler_name`, `start_date`, `end_date`, `trip_days`, `travel_style`, `budget_style`, `special_preferences`, `important_notes`, `profile_photo_url` |
| Destinations | `destinations` | `position` (required on add), `name` (required on add), `intro`, `tapan_intro`, `arrival_date`, `departure_date`, `nights`, `hero_image_url`, `itinerary_image_url`, `places_image_url`, `transport_image_url`, `stays_image_url`, `food_image_url`, `experiences_image_url`, `map_image_url`, `notes_image_url` |
| Itinerary | `itinerary_days` | `position` (required on add), `day_label`, `day_date`, `morning`, `afternoon`, `evening`, `notes`, `recommended_timing`, `optional_items` |
| Places | `places` | `position` (required on add), `name` (required on add), `description`, `why_visit`, `duration`, `best_time`, `priority`, `map_url`, `image_url`, `tapan_note`, `warning` |
| Transport | `transports` | `position` (required on add), `transport_type`, `from_location`, `to_location`, `duration`, `instructions`, `booking_info`, `price_guidance`, `tapan_note`, `warning` |
| Stays | `stays` | `position` (required on add), `name` (required on add), `area`, `stay_type`, `price_category`, `why_recommended`, `map_url`, `booking_url`, `image_url`, `tapan_note` |
| Food | `foods` | `position` (required on add), `name` (required on add), `category`, `what_to_try`, `location`, `why_recommended`, `price_category`, `map_url`, `image_url`, `tapan_note` |
| Experiences | `experiences` | `position` (required on add), `name` (required on add), `description`, `why_recommended`, `duration`, `price`, `location`, `booking_url`, `map_url`, `image_url`, `tapan_note` |
| Maps | `map_pins` | `position` (required on add), `name` (required on add), `latitude`, `longitude`, `category`, `description`, `map_url` |
| Notes | `destination_notes` | `position` (required on add), `title` (required on add), `note`, `note_type` |
| India Guide | `india_guide_items` | `position` (required on add), `category`, `title` (required on add), `content` |
| Documents | `plan_documents` | `position` (required on add), `title` (required on add), `description`, `file_url` |
| Help | `plans` | `whatsapp_contact`, `support_info` |

## Implementation files and final checks

- `lib/plan/excel/schema.ts`: verified field/enum allowlist and defaults.
- `lib/plan/excel/workbook.ts`: styled template/export generation, ZIP preflight and bounded XLSX parser.
- `lib/plan/excel/merge.ts`: typed validation, stable references, diffs and selected-change validation.
- `lib/plan/excel/store.ts`, `database.ts`: content snapshots, preview receipts, transactional writes, revisions and restoration using the existing Neon client.
- `lib/plan/excel/http.ts`, `app/admin/plans/excel/route.ts`: authenticated, same-origin download/upload/confirm/history endpoints.
- `app/admin/plans/import/page.tsx`, `components/admin/excel-import-panel.tsx`: import/update previews and history UI.
- `app/admin/plans/page.tsx`, `app/admin/plans/[id]/page.tsx`: entry points, export link and save confirmation.
- `lib/plan/schema-6-excel.sql`, `scripts/plan-migrate.mjs`: additive migration and registration.
- `tests/excel.test.ts`, `tests/isolated-neon.mjs`, `tests/excel-app-smoke.mjs`: isolated workbook/database, legacy-device and running-app verification.
- `package.json`, `package-lock.json`: runtime XLSX/ZIP packages, isolated-test dependencies and commands.
- `docs/excel-import-audit.md`, this guide, `outputs/excel/andaman-sample.xlsx`, `outputs/excel/staylocal-template.xlsx`: audit, admin/engineering documentation, sample and blank template.

Verified: 25 Excel tests, 19 existing device assertions, 37 existing HTTP smoke assertions, Excel running-app smoke, TypeScript, ESLint and production build. All database tests ran against disposable PostgreSQL; no configured remote database was migrated or written. No push or deployment occurred.

Remaining release checks: real multi-connection Neon contention, desktop Excel/Numbers rendering and browser mobile visual inspection. Existing dependency audit advisories remain as described above. Selection operates on whole records rather than individual fields. History covers Excel operations and their pre-operation baselines, not each manual edit.
