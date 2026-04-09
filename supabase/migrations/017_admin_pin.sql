-- ============================================================
-- INOid.app – Platform Admin PIN
-- Migration: 017_admin_pin.sql
-- ============================================================

-- Gespeicherter PIN-Hash für kritische Admin-Aktionen
-- Format: {salt}:{pbkdf2-hash} (beide hex-kodiert)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_pin_hash text;
