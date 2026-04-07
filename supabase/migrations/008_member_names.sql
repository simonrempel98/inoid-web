-- ============================================================
-- INOid.app – Vor- und Nachname bei Einladungen
-- Migration: 008_member_names.sql
-- ============================================================

ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name  text;
