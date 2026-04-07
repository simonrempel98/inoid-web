-- ============================================================
-- INOid.app – Bereich-Detailfelder
-- Migration: 004_organisation_details.sql
-- ============================================================

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
