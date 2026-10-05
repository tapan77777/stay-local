-- StayLocal Plan — Phase 3 schema (per-plan device limit + registry).
-- Idempotent: safe to run multiple times. Builds on schema.sql + schema-2a.sql.
--
-- Why a separate schema file: ALTER TABLE / CREATE TABLE are additive and
-- can be re-run safely. The migrate runner applies files in order, so this
-- lands after plans/customers already exist.

-- =========================================================================
-- Plans: configurable max devices
-- =========================================================================

-- Default of 1 matches the pre-feature behavior: existing plans continue to
-- work for the already-active device without opening up extra seats. A CHECK
-- constraint caps the value to a sane range so a stray admin edit can't set
-- "999 devices". 1 ≤ max_devices ≤ 20 covers family trips without becoming
-- a de-facto sharing hole.
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS max_devices INT NOT NULL DEFAULT 1;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'plans_max_devices_range'
  ) THEN
    ALTER TABLE plans
      ADD CONSTRAINT plans_max_devices_range
      CHECK (max_devices >= 1 AND max_devices <= 20);
  END IF;
END $$;

-- =========================================================================
-- plan_devices — one row per registered device per plan
-- =========================================================================
--
-- device_token_hash is a keyed SHA-256 of a cryptographically random token
-- the server generates and ships only in an httpOnly cookie. The raw token
-- is never persisted. revoked_at NULL = currently active.
--
-- "Active" means `revoked_at IS NULL`. last_seen_at is maintenance-only.

CREATE TABLE IF NOT EXISTS plan_devices (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id            UUID        NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  device_token_hash  TEXT        NOT NULL,
  device_label       TEXT,
  user_agent         TEXT,
  first_seen_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_ip_hash       TEXT,
  revoked_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uniqueness: a given (plan, token hash) can only exist once. Prevents a
-- race from inserting two rows for the same cookie, and lets the atomic
-- "register if under limit" CTE rely on INSERT … ON CONFLICT.
CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_devices_plan_token_unique
  ON plan_devices(plan_id, device_token_hash);

-- Hot path #1 — list all devices for a plan (admin UI).
CREATE INDEX IF NOT EXISTS idx_plan_devices_plan_id
  ON plan_devices(plan_id);

-- Hot path #2 — count ACTIVE devices (what the limit enforces).
-- Partial index on the same predicate the count query uses, so Postgres can
-- satisfy the count from the index without touching the heap.
CREATE INDEX IF NOT EXISTS idx_plan_devices_plan_active
  ON plan_devices(plan_id)
  WHERE revoked_at IS NULL;
