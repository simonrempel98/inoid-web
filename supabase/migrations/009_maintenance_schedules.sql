-- ============================================================
-- INOid.app – Wartungsintervalle
-- Migration: 009_maintenance_schedules.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id          uuid        NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  organization_id   uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name              text        NOT NULL,
  title             text,
  event_type        text        NOT NULL DEFAULT 'maintenance',
  interval_days     integer     NOT NULL,
  next_service_date timestamptz,
  last_service_date timestamptz,
  is_active         boolean     NOT NULL DEFAULT true,
  created_by        uuid        REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maint_sched_asset
  ON maintenance_schedules(asset_id);

CREATE INDEX IF NOT EXISTS idx_maint_sched_org
  ON maintenance_schedules(organization_id);

CREATE INDEX IF NOT EXISTS idx_maint_sched_next
  ON maintenance_schedules(next_service_date)
  WHERE is_active = true;

-- Trigger für updated_at
CREATE TRIGGER maintenance_schedules_updated_at
  BEFORE UPDATE ON maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maint_sched_select" ON maintenance_schedules
  FOR SELECT USING (organization_id = get_user_org_id() OR is_platform_admin());

CREATE POLICY "maint_sched_insert" ON maintenance_schedules
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "maint_sched_update" ON maintenance_schedules
  FOR UPDATE USING (organization_id = get_user_org_id());

CREATE POLICY "maint_sched_delete" ON maintenance_schedules
  FOR DELETE USING (organization_id = get_user_org_id());
