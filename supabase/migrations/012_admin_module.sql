-- ============================================================
-- INOid.app – Admin Module
-- Migration: 012_admin_module.sql
-- ============================================================

-- 1. Profiles: must_change_password Flag
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- 2. Organizations: user_limit + storage_limit_mb
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS user_limit integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS storage_limit_mb integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS contact_email text;

-- 3. Admin-Audit-Log: Alle Admin-Aktionen aufzeichnen
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,           -- z.B. 'create_org', 'reset_password', 'impersonate'
  target_type text,               -- 'organization' | 'user'
  target_id uuid,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 4. RLS für admin_audit_log: nur platform admins
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_log_platform_admin" ON admin_audit_log
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_platform_admin = true
    )
  );

-- 5. Funktion: is_platform_admin() für RLS-Nutzung
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(is_platform_admin, false)
  FROM profiles
  WHERE id = auth.uid();
$$;

-- 6. Index für Admin-Abfragen
CREATE INDEX IF NOT EXISTS idx_profiles_is_platform_admin ON profiles(is_platform_admin) WHERE is_platform_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password ON profiles(must_change_password) WHERE must_change_password = true;
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
