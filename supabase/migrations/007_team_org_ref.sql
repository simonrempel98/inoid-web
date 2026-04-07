-- ============================================================
-- INOid.app – Team kann optional Standort oder Halle referenzieren
-- Migration: 007_team_org_ref.sql
-- ============================================================

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hall_id     uuid REFERENCES halls(id)     ON DELETE SET NULL;

-- Nur eine der drei Spalten (location_id, hall_id, area_id) sollte gesetzt sein.
-- Wird per App-Logik sichergestellt.
