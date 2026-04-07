-- ============================================================
-- Asset Vorlagen (Templates)
-- ============================================================
CREATE TABLE asset_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,                        -- z.B. "Bohrkrone PDC"
  description text,
  category text,
  manufacturer text,
  technical_fields jsonb DEFAULT '[]',       -- [{"label": "Durchmesser", "unit": "mm"}]
  commercial_fields jsonb DEFAULT '[]',      -- [{"label": "Lieferant"}]
  default_values jsonb DEFAULT '{}',         -- Vorausgefüllte Werte
  icon text DEFAULT '📦',
  usage_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_templates_org ON asset_templates(organization_id);

ALTER TABLE asset_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select" ON asset_templates
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "templates_insert" ON asset_templates
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "templates_update" ON asset_templates
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "templates_delete" ON asset_templates
  FOR DELETE USING (organization_id = get_user_org_id());

CREATE TRIGGER trg_templates_updated
  BEFORE UPDATE ON asset_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
