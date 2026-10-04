-- StayLocal Plan — Phase 1 schema
-- Idempotent: safe to run multiple times.
-- Requires Postgres >= 13 (uses built-in gen_random_uuid()).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_status') THEN
    CREATE TYPE plan_status AS ENUM (
      'DRAFT',
      'PREPARING',
      'READY',
      'ACTIVE',
      'COMPLETED',
      'DISABLED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS customers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  whatsapp    TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS plans (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       UUID        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  private_token     TEXT        NOT NULL UNIQUE,
  title             TEXT        NOT NULL DEFAULT '',
  subtitle          TEXT        NOT NULL DEFAULT '',
  start_date        DATE,
  end_date          DATE,
  status            plan_status NOT NULL DEFAULT 'DRAFT',
  access_starts_at  TIMESTAMPTZ,
  access_ends_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Access patterns:
--   • /plan/[token]           → lookup by private_token (unique index above)
--   • admin plans list        → ORDER BY created_at DESC
--   • dashboard counters      → COUNT(*) FILTER (WHERE status = …)
--   • customer page (future)  → list a customer's plans
CREATE INDEX IF NOT EXISTS idx_plans_customer_id ON plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_plans_status      ON plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_created_at  ON plans(created_at DESC);
