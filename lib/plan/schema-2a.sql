-- StayLocal Plan — Phase 2A schema (plan builder: destinations + modules).
-- Idempotent: safe to run multiple times. Builds on top of schema.sql.

-- =========================================================================
-- Enum types
-- =========================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_priority') THEN
    CREATE TYPE place_priority AS ENUM ('MUST_SEE', 'RECOMMENDED', 'OPTIONAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transport_type') THEN
    CREATE TYPE transport_type AS ENUM (
      'TRAIN', 'FLIGHT', 'TAXI', 'BUS', 'METRO', 'WALKING', 'OTHER'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pin_category') THEN
    CREATE TYPE pin_category AS ENUM (
      'PLACE', 'FOOD', 'STAY', 'EXPERIENCE', 'TRANSPORT', 'OTHER'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'note_type') THEN
    CREATE TYPE note_type AS ENUM (
      'MY_TAKE', 'GOOD_TO_KNOW', 'DONT_MISS', 'ID_SKIP', 'WATCH_OUT', 'LOCAL_TIP'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guide_category') THEN
    CREATE TYPE guide_category AS ENUM (
      'MONEY', 'SIM', 'TRANSPORT', 'CULTURE', 'PRACTICAL',
      'SCAMS', 'ARRIVAL', 'PACKING', 'EMERGENCY'
    );
  END IF;
END $$;

-- =========================================================================
-- Extend plans with trip-overview + plan-level essentials
-- =========================================================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS traveler_name       TEXT NOT NULL DEFAULT '';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS trip_days           INT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS travel_style        TEXT NOT NULL DEFAULT '';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS budget_style        TEXT NOT NULL DEFAULT '';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS special_preferences TEXT NOT NULL DEFAULT '';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS important_notes     TEXT NOT NULL DEFAULT '';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS whatsapp_contact    TEXT NOT NULL DEFAULT '';
ALTER TABLE plans ADD COLUMN IF NOT EXISTS support_info        TEXT NOT NULL DEFAULT '';

-- =========================================================================
-- Destinations (ordered children of a plan)
-- =========================================================================

CREATE TABLE IF NOT EXISTS destinations (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID        NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  position        INT         NOT NULL,
  name            TEXT        NOT NULL,
  intro           TEXT        NOT NULL DEFAULT '',
  arrival_date    DATE,
  departure_date  DATE,
  nights          INT,
  hero_image_url  TEXT        NOT NULL DEFAULT '',
  tapan_intro     TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destinations_plan_position
  ON destinations(plan_id, position);

-- =========================================================================
-- Destination modules
-- =========================================================================

CREATE TABLE IF NOT EXISTS itinerary_days (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id      UUID        NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position            INT         NOT NULL,
  day_label           TEXT        NOT NULL DEFAULT '',
  day_date            DATE,
  morning             TEXT        NOT NULL DEFAULT '',
  afternoon           TEXT        NOT NULL DEFAULT '',
  evening             TEXT        NOT NULL DEFAULT '',
  notes               TEXT        NOT NULL DEFAULT '',
  recommended_timing  TEXT        NOT NULL DEFAULT '',
  optional_items      TEXT        NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_itinerary_days_destination_position
  ON itinerary_days(destination_id, position);

CREATE TABLE IF NOT EXISTS places (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID            NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position        INT             NOT NULL,
  name            TEXT            NOT NULL,
  description     TEXT            NOT NULL DEFAULT '',
  why_visit       TEXT            NOT NULL DEFAULT '',
  duration        TEXT            NOT NULL DEFAULT '',
  best_time       TEXT            NOT NULL DEFAULT '',
  priority        place_priority  NOT NULL DEFAULT 'RECOMMENDED',
  map_url         TEXT            NOT NULL DEFAULT '',
  image_url       TEXT            NOT NULL DEFAULT '',
  tapan_note      TEXT            NOT NULL DEFAULT '',
  warning         TEXT            NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_places_destination_position
  ON places(destination_id, position);

CREATE TABLE IF NOT EXISTS transports (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID            NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position        INT             NOT NULL,
  transport_type  transport_type  NOT NULL DEFAULT 'OTHER',
  from_location   TEXT            NOT NULL DEFAULT '',
  to_location     TEXT            NOT NULL DEFAULT '',
  duration        TEXT            NOT NULL DEFAULT '',
  instructions    TEXT            NOT NULL DEFAULT '',
  booking_info    TEXT            NOT NULL DEFAULT '',
  price_guidance  TEXT            NOT NULL DEFAULT '',
  tapan_note      TEXT            NOT NULL DEFAULT '',
  warning         TEXT            NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transports_destination_position
  ON transports(destination_id, position);

CREATE TABLE IF NOT EXISTS stays (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID        NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position        INT         NOT NULL,
  name            TEXT        NOT NULL,
  area            TEXT        NOT NULL DEFAULT '',
  stay_type       TEXT        NOT NULL DEFAULT '',
  price_category  TEXT        NOT NULL DEFAULT '',
  why_recommended TEXT        NOT NULL DEFAULT '',
  map_url         TEXT        NOT NULL DEFAULT '',
  booking_url     TEXT        NOT NULL DEFAULT '',
  image_url       TEXT        NOT NULL DEFAULT '',
  tapan_note      TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stays_destination_position
  ON stays(destination_id, position);

CREATE TABLE IF NOT EXISTS foods (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID        NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position        INT         NOT NULL,
  name            TEXT        NOT NULL,
  category        TEXT        NOT NULL DEFAULT '',
  what_to_try     TEXT        NOT NULL DEFAULT '',
  location        TEXT        NOT NULL DEFAULT '',
  why_recommended TEXT        NOT NULL DEFAULT '',
  price_category  TEXT        NOT NULL DEFAULT '',
  map_url         TEXT        NOT NULL DEFAULT '',
  image_url       TEXT        NOT NULL DEFAULT '',
  tapan_note      TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_foods_destination_position
  ON foods(destination_id, position);

CREATE TABLE IF NOT EXISTS experiences (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID        NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position        INT         NOT NULL,
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  why_recommended TEXT        NOT NULL DEFAULT '',
  duration        TEXT        NOT NULL DEFAULT '',
  price           TEXT        NOT NULL DEFAULT '',
  location        TEXT        NOT NULL DEFAULT '',
  booking_url     TEXT        NOT NULL DEFAULT '',
  map_url         TEXT        NOT NULL DEFAULT '',
  image_url       TEXT        NOT NULL DEFAULT '',
  tapan_note      TEXT        NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_experiences_destination_position
  ON experiences(destination_id, position);

CREATE TABLE IF NOT EXISTS map_pins (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID              NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position        INT               NOT NULL,
  name            TEXT              NOT NULL,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  category        pin_category      NOT NULL DEFAULT 'PLACE',
  description     TEXT              NOT NULL DEFAULT '',
  map_url         TEXT              NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ       NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_pins_destination_position
  ON map_pins(destination_id, position);

CREATE TABLE IF NOT EXISTS destination_notes (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id  UUID        NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  position        INT         NOT NULL,
  title           TEXT        NOT NULL,
  note            TEXT        NOT NULL DEFAULT '',
  note_type       note_type   NOT NULL DEFAULT 'MY_TAKE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_destination_notes_destination_position
  ON destination_notes(destination_id, position);

-- =========================================================================
-- Plan-level essentials: India Guide, Documents
-- =========================================================================

CREATE TABLE IF NOT EXISTS india_guide_items (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID            NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  position    INT             NOT NULL,
  category    guide_category  NOT NULL DEFAULT 'PRACTICAL',
  title       TEXT            NOT NULL,
  content     TEXT            NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_india_guide_items_plan_position
  ON india_guide_items(plan_id, position);

CREATE TABLE IF NOT EXISTS plan_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id     UUID        NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  position    INT         NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  file_url    TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_documents_plan_position
  ON plan_documents(plan_id, position);
