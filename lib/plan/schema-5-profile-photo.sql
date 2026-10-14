-- StayLocal Plan — Phase 5 schema (per-plan guest profile photo).
-- Idempotent: safe to run multiple times.
--
-- Lives on `plans` (not `customers`) so the photo belongs to a specific
-- trip plan and cannot leak across other plans owned by the same
-- customer. Edited in the same admin Overview form as `traveler_name`.
--
-- Empty string means "no override, fall back to the initial placeholder".

ALTER TABLE plans ADD COLUMN IF NOT EXISTS profile_photo_url TEXT NOT NULL DEFAULT '';
