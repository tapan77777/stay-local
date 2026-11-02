-- Additive Excel import history and optimistic concurrency; no existing data replaced.
ALTER TABLE plans ADD COLUMN IF NOT EXISTS content_version BIGINT NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS plan_excel_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  operation TEXT NOT NULL CHECK (operation IN ('IMPORT','UPDATE','RESTORE')),
  expected_version BIGINT,
  before_snapshot JSONB NOT NULL,
  after_snapshot JSONB NOT NULL,
  changes JSONB NOT NULL,
  actor TEXT NOT NULL DEFAULT 'admin',
  import_fingerprint TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '1 hour',
  completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS plan_excel_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  revision INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('BASELINE','IMPORT','UPDATE','RESTORE')),
  summary JSONB NOT NULL,
  snapshot JSONB NOT NULL,
  UNIQUE(plan_id, revision)
);
CREATE INDEX IF NOT EXISTS idx_excel_previews_expiry ON plan_excel_previews(expires_at);
CREATE OR REPLACE FUNCTION sl_excel_plan_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.content_version = OLD.content_version THEN
    NEW.content_version := OLD.content_version + 1;
  END IF;
  RETURN NEW;
END $$;
-- Keep replacement atomic even when this SQL file is applied as individual
-- statements; DO blocks also preserve PostgreSQL 13 compatibility.
DO $$ BEGIN
  DROP TRIGGER IF EXISTS sl_excel_plan_version ON plans;
  CREATE TRIGGER sl_excel_plan_version BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION sl_excel_plan_version();
END $$;
CREATE OR REPLACE FUNCTION sl_excel_child_version() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE old_pid UUID; new_pid UUID;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    IF TG_ARGV[0] = 'plan_id' THEN old_pid := OLD.plan_id;
    ELSE SELECT plan_id INTO old_pid FROM destinations WHERE id = OLD.destination_id; END IF;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    IF TG_ARGV[0] = 'plan_id' THEN new_pid := NEW.plan_id;
    ELSE SELECT plan_id INTO new_pid FROM destinations WHERE id = NEW.destination_id; END IF;
  END IF;
  -- Builder services lock the parent before the child statement; Excel does likewise.
  -- Triggers also version direct SQL changes. Avoid key locks needed only for FK changes.
  PERFORM id FROM plans WHERE id IN (old_pid,new_pid) ORDER BY id FOR NO KEY UPDATE;
  UPDATE plans SET content_version = content_version + 1 WHERE id IN (old_pid,new_pid);
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['destinations','india_guide_items','plan_documents'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS sl_excel_child_version ON %I',t);
    EXECUTE format('CREATE TRIGGER sl_excel_child_version BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION sl_excel_child_version(''plan_id'')',t);
  END LOOP;
  FOREACH t IN ARRAY ARRAY['itinerary_days','places','transports','stays','foods','experiences','map_pins','destination_notes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS sl_excel_child_version ON %I',t);
    EXECUTE format('CREATE TRIGGER sl_excel_child_version BEFORE INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION sl_excel_child_version(''destination_id'')',t);
  END LOOP;
END $$;
CREATE OR REPLACE FUNCTION sl_excel_guard(preview_id UUID) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE p plan_excel_previews%ROWTYPE; current_version BIGINT;
BEGIN
  SELECT * INTO p FROM plan_excel_previews WHERE id = preview_id FOR UPDATE;
  IF NOT FOUND OR p.expires_at <= now() THEN RAISE EXCEPTION 'EXCEL_PREVIEW_EXPIRED'; END IF;
  IF p.completed_at IS NOT NULL THEN RAISE EXCEPTION 'EXCEL_ALREADY_COMPLETED'; END IF;
  IF p.operation <> 'IMPORT' THEN
    SELECT content_version INTO current_version FROM plans WHERE id = p.plan_id FOR NO KEY UPDATE;
    IF NOT FOUND OR current_version <> p.expected_version THEN RAISE EXCEPTION 'EXCEL_STALE'; END IF;
  ELSE
    PERFORM id FROM customers WHERE id = p.customer_id FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'EXCEL_CUSTOMER_MISSING'; END IF;
  END IF;
END $$;
