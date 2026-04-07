-- ============================================================
-- INOid.app – Team-Struktur
-- Migration: 006_teams_structure.sql
-- ============================================================

-- 1. BEREICHE (Divisions – oberste Teamebene)
CREATE TABLE divisions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- 2. ABTEILUNGEN (Departments)
CREATE TABLE departments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  division_id     uuid NOT NULL REFERENCES divisions(id) ON DELETE CASCADE,
  name            text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

-- 3. TEAMS
CREATE TABLE teams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id   uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name            text NOT NULL,
  area_id         uuid REFERENCES areas(id) ON DELETE SET NULL, -- Verknüpfung zur Org-Struktur
  created_at      timestamptz DEFAULT now()
);

-- 4. Team-Zuordnung für Mitglieder
ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- 5. RLS
ALTER TABLE divisions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "divisions_all" ON divisions USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "departments_all" ON departments USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "teams_all" ON teams USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- INSERT policies
CREATE POLICY "divisions_insert" ON divisions FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "departments_insert" ON departments FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- UPDATE policies
CREATE POLICY "divisions_update" ON divisions FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "departments_update" ON departments FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);

-- DELETE policies
CREATE POLICY "divisions_delete" ON divisions FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "departments_delete" ON departments FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
);
