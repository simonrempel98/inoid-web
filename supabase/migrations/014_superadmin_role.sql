-- ============================================================
-- INOid.app – Superadmin-Rolle
-- Migration: 014_superadmin_role.sql
-- ============================================================

-- Für jede Organisation: den Admin mit dem frühesten created_at
-- als Superadmin festlegen (= Org-Ersteller).
-- Gibt es mehrere Admins mit gleichem created_at, wird nur einer
-- befördert (DISTINCT ON sorgt dafür).

UPDATE profiles
SET app_role = 'superadmin'
WHERE id IN (
  SELECT DISTINCT ON (organization_id) id
  FROM profiles
  WHERE app_role = 'admin'
    AND organization_id IS NOT NULL
  ORDER BY organization_id, created_at ASC NULLS LAST
);
