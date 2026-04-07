-- ============================================================
-- INOid.app – Organisationsstruktur Detailfelder
-- Migration: 004_organisation_details.sql
-- ============================================================

-- Standorte: Kontakt, Fläche, Bilder, Dokumente
ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS contact_name    text,
  ADD COLUMN IF NOT EXISTS contact_phone   text,
  ADD COLUMN IF NOT EXISTS area_sqm        numeric,
  ADD COLUMN IF NOT EXISTS employee_count  integer,
  ADD COLUMN IF NOT EXISTS notes           text,
  ADD COLUMN IF NOT EXISTS image_urls      text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_urls   text[]  DEFAULT '{}';

-- Hallen: Nutzungsart, Maße, Kran, Bilder, Dokumente
ALTER TABLE halls
  ADD COLUMN IF NOT EXISTS usage_type       text    DEFAULT 'Produktion',
  ADD COLUMN IF NOT EXISTS area_sqm         numeric,
  ADD COLUMN IF NOT EXISTS height_m         numeric,
  ADD COLUMN IF NOT EXISTS year_built       integer,
  ADD COLUMN IF NOT EXISTS has_crane        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS crane_capacity_t numeric,
  ADD COLUMN IF NOT EXISTS notes            text,
  ADD COLUMN IF NOT EXISTS image_urls       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_urls    text[]  DEFAULT '{}';

-- Bereiche: Verantwortlicher, Prozess, Schicht, Risiko, Bilder, Dokumente
ALTER TABLE areas
  ADD COLUMN IF NOT EXISTS responsible_name text,
  ADD COLUMN IF NOT EXISTS process_type     text,
  ADD COLUMN IF NOT EXISTS shift_model      text,
  ADD COLUMN IF NOT EXISTS area_sqm         numeric,
  ADD COLUMN IF NOT EXISTS machine_count    integer,
  ADD COLUMN IF NOT EXISTS risk_level       text    DEFAULT 'niedrig',
  ADD COLUMN IF NOT EXISTS notes            text,
  ADD COLUMN IF NOT EXISTS image_urls       text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS document_urls    text[]  DEFAULT '{}';
