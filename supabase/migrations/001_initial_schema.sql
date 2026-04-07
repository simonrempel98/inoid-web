-- ============================================================
-- INOid.app – Initiales Datenbankschema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- ============================================================
-- 1. ORGANIZATIONS (Firmen/Mandanten)
-- ============================================================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  plan text NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free','starter','professional','enterprise','custom')),
  asset_limit integer NOT NULL DEFAULT 20,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'active',
  billing_email text,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================================
-- 2. USER PROFILES (Erweiterung von Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id),
  email text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  preferred_language text DEFAULT 'de',
  is_platform_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. ROLLEN (Custom Rollen pro Organization)
-- ============================================================
CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- ============================================================
-- 4. ORGANIZATION MEMBERS
-- ============================================================
CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role_id uuid NOT NULL REFERENCES roles(id),
  email text NOT NULL,
  invitation_token text,
  invitation_accepted_at timestamptz,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- ============================================================
-- 5. ASSETS (Maschinenkomponenten)
-- ============================================================
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  article_number text,
  serial_number text,
  order_number text,
  category text,
  description text,
  manufacturer text,
  image_urls text[] DEFAULT '{}',
  qr_code text,
  barcode text,
  nfc_uid text,
  location text,
  status text DEFAULT 'active'
    CHECK (status IN ('active','in_service','decommissioned')),
  technical_data jsonb DEFAULT '{}',
  commercial_data jsonb DEFAULT '{}',
  operating_hours_minutes integer DEFAULT 0,
  custom_fields jsonb DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- ============================================================
-- 6. DOKUMENTE
-- ============================================================
CREATE TABLE asset_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size_bytes integer,
  document_type text NOT NULL
    CHECK (document_type IN ('protocol','invoice','certificate','delivery_note','order_confirmation','manual','other')),
  description text,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. LIFECYCLE / SERVICEHEFT EVENTS
-- ============================================================
CREATE TABLE asset_lifecycle_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  event_type text NOT NULL
    CHECK (event_type IN ('maintenance','overhaul','coating','repair','cleaning','incident','inspection','installation','decommission','other')),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL DEFAULT now(),
  performed_by text,
  performed_by_user_id uuid REFERENCES auth.users(id),
  external_company text,
  cost_eur numeric(10,2),
  next_service_date timestamptz,
  attachments text[] DEFAULT '{}',
  notes text,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 8. NFC / QR TAG MAPPING
-- ============================================================
CREATE TABLE asset_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  tag_type text NOT NULL CHECK (tag_type IN ('nfc', 'qr', 'barcode')),
  tag_value text NOT NULL,
  raw_value text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tag_value)
);

-- ============================================================
-- 9. SENSOR DATA (Zukunft)
-- ============================================================
CREATE TABLE asset_sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  sensor_id text,
  sensor_type text,
  value numeric NOT NULL,
  unit text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- ============================================================
-- 10. AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 11. FEATURE FLAGS
-- ============================================================
CREATE TABLE feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  flag_key text NOT NULL,
  is_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, flag_key)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_assets_org ON assets(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_nfc ON assets(nfc_uid) WHERE nfc_uid IS NOT NULL;
CREATE INDEX idx_asset_tags_value ON asset_tags(tag_value);
CREATE INDEX idx_lifecycle_asset ON asset_lifecycle_events(asset_id, event_date DESC);
CREATE INDEX idx_documents_asset ON asset_documents(asset_id);
CREATE INDEX idx_members_org ON organization_members(organization_id);
CREATE INDEX idx_members_user ON organization_members(user_id);
CREATE INDEX idx_sensor_asset ON asset_sensor_readings(asset_id, recorded_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_roles_updated
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_members_updated
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_assets_updated
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_documents_updated
  BEFORE UPDATE ON asset_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_lifecycle_updated
  BEFORE UPDATE ON asset_lifecycle_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY – aktivieren
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_lifecycle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Gibt die organization_id des eingeloggten Users zurück
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Prüft ob User Platform Admin ist
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean AS $$
  SELECT COALESCE(is_platform_admin, false) FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- RLS POLICIES – ORGANIZATIONS
-- ============================================================
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "org_admin_all" ON organizations
  FOR ALL USING (is_platform_admin());

-- ============================================================
-- RLS POLICIES – PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ============================================================
-- RLS POLICIES – ROLES
-- ============================================================
CREATE POLICY "roles_select" ON roles
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "roles_insert" ON roles
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "roles_update" ON roles
  FOR UPDATE USING (organization_id = get_user_org_id() AND is_system_role = false);

CREATE POLICY "roles_delete" ON roles
  FOR DELETE USING (organization_id = get_user_org_id() AND is_system_role = false);

-- ============================================================
-- RLS POLICIES – ORGANIZATION MEMBERS
-- ============================================================
CREATE POLICY "members_select" ON organization_members
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "members_insert" ON organization_members
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "members_update" ON organization_members
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "members_delete" ON organization_members
  FOR DELETE USING (organization_id = get_user_org_id());

-- ============================================================
-- RLS POLICIES – ASSETS
-- ============================================================
CREATE POLICY "assets_select" ON assets
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "assets_insert" ON assets
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "assets_update" ON assets
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "assets_delete" ON assets
  FOR DELETE USING (organization_id = get_user_org_id());

-- ============================================================
-- RLS POLICIES – ASSET DOCUMENTS
-- ============================================================
CREATE POLICY "documents_select" ON asset_documents
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "documents_insert" ON asset_documents
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "documents_delete" ON asset_documents
  FOR DELETE USING (organization_id = get_user_org_id());

-- ============================================================
-- RLS POLICIES – LIFECYCLE EVENTS
-- ============================================================
CREATE POLICY "lifecycle_select" ON asset_lifecycle_events
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "lifecycle_insert" ON asset_lifecycle_events
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "lifecycle_update" ON asset_lifecycle_events
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "lifecycle_delete" ON asset_lifecycle_events
  FOR DELETE USING (organization_id = get_user_org_id());

-- ============================================================
-- RLS POLICIES – ASSET TAGS
-- ============================================================
-- Öffentlicher SELECT (für NFC-Scan ohne Login)
CREATE POLICY "tags_select_public" ON asset_tags
  FOR SELECT USING (true);

CREATE POLICY "tags_insert" ON asset_tags
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "tags_update" ON asset_tags
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "tags_delete" ON asset_tags
  FOR DELETE USING (organization_id = get_user_org_id());

-- ============================================================
-- RLS POLICIES – SENSOR READINGS
-- ============================================================
CREATE POLICY "sensors_select" ON asset_sensor_readings
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "sensors_insert" ON asset_sensor_readings
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

-- ============================================================
-- RLS POLICIES – AUDIT LOG
-- ============================================================
CREATE POLICY "audit_select" ON audit_log
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "audit_insert" ON audit_log
  FOR INSERT WITH CHECK (true); -- Service Role schreibt, User liest nur

-- ============================================================
-- RLS POLICIES – FEATURE FLAGS
-- ============================================================
CREATE POLICY "flags_select" ON feature_flags
  FOR SELECT USING (organization_id = get_user_org_id() OR organization_id IS NULL OR is_platform_admin());

CREATE POLICY "flags_manage" ON feature_flags
  FOR ALL USING (is_platform_admin());

-- ============================================================
-- SUPABASE STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('asset-images', 'asset-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('asset-documents', 'asset-documents', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies – asset-images (public read)
CREATE POLICY "images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'asset-images');

CREATE POLICY "images_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'asset-images' AND auth.role() = 'authenticated');

CREATE POLICY "images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'asset-images' AND auth.role() = 'authenticated');

-- Storage Policies – asset-documents (private, signed URLs)
CREATE POLICY "docs_auth_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'asset-documents' AND auth.role() = 'authenticated');

CREATE POLICY "docs_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'asset-documents' AND auth.role() = 'authenticated');

CREATE POLICY "docs_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'asset-documents' AND auth.role() = 'authenticated');
