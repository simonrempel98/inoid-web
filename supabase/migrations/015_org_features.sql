-- ============================================================
-- INOid.app – Organisation Feature Flags
-- Migration: 015_org_features.sql
-- ============================================================

-- Feature-Flags pro Organisation (z.B. serviceheft, wartung)
-- Default: alle Features aktiviert
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{"serviceheft": true, "wartung": true}'::jsonb;
