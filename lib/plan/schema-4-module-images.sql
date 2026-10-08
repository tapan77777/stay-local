-- StayLocal Plan — Phase 4 schema (per-module card images on destinations).
-- Idempotent: safe to run multiple times. Builds on schema.sql + schema-2a.sql.
--
-- Why these live on `destinations` and not on each module table: the Journey
-- page renders ONE card per (destination, module) combo as a navigation tile
-- — the image is the tile artwork, not a per-row item image. Attaching the
-- URL to the destination keeps the admin edit flow in one form and avoids
-- introducing a nullable image per every itinerary_day / place / etc.
--
-- All columns are optional (empty string = "fall back to destination hero").
-- The customer-side renderer treats empty strings as "no override" without
-- fabricating a URL.

ALTER TABLE destinations ADD COLUMN IF NOT EXISTS itinerary_image_url   TEXT NOT NULL DEFAULT '';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS places_image_url      TEXT NOT NULL DEFAULT '';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS food_image_url        TEXT NOT NULL DEFAULT '';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS transport_image_url   TEXT NOT NULL DEFAULT '';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS stays_image_url       TEXT NOT NULL DEFAULT '';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS experiences_image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS map_image_url         TEXT NOT NULL DEFAULT '';
ALTER TABLE destinations ADD COLUMN IF NOT EXISTS notes_image_url       TEXT NOT NULL DEFAULT '';
