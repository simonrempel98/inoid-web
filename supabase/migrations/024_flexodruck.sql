-- 024_flexodruck.sql
-- Flexodruck Setup-Manager: Maschinen, Druckwerke, Vorlagen, Rüstvorgänge

-- ─── Maschinen ────────────────────────────────────────────────────────────────

CREATE TABLE flexo_machines (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id          uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  manufacturer    text,
  model           text,
  num_druckwerke  int         NOT NULL DEFAULT 1 CHECK (num_druckwerke BETWEEN 1 AND 20),
  asset_id        uuid        REFERENCES assets(id) ON DELETE SET NULL,
  notes           text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid        REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── Druckwerke (eine Zeile pro Druckwerk, wird beim Anlegen der Maschine erstellt) ──

CREATE TABLE flexo_druckwerke (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id  uuid    NOT NULL REFERENCES flexo_machines(id) ON DELETE CASCADE,
  org_id      uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  position    int     NOT NULL,
  label       text,           -- optional: benutzerdefinierter Name
  color_hint  text,           -- optional: Farbe (z.B. Cyan, Magenta, ...)
  UNIQUE (machine_id, position)
);

-- ─── Feste Slots pro Druckwerk (Trägerstange 1 & 2, etc.) ────────────────────

CREATE TABLE flexo_fixed_slots (
  id            uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  druckwerk_id  uuid    NOT NULL REFERENCES flexo_druckwerke(id) ON DELETE CASCADE,
  org_id        uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label         text    NOT NULL,
  asset_id      uuid    REFERENCES assets(id) ON DELETE SET NULL,
  sort_order    int     NOT NULL DEFAULT 0
);

-- ─── Vorlagen (Templates) ────────────────────────────────────────────────────

CREATE TABLE flexo_templates (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id              uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  primary_machine_id  uuid        NOT NULL REFERENCES flexo_machines(id) ON DELETE CASCADE,
  name                text        NOT NULL,
  description         text,
  is_active           boolean     NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid        REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── Vorlage für weitere Maschinen freigeben ─────────────────────────────────

CREATE TABLE flexo_template_machines (
  template_id  uuid  NOT NULL REFERENCES flexo_templates(id) ON DELETE CASCADE,
  machine_id   uuid  NOT NULL REFERENCES flexo_machines(id)  ON DELETE CASCADE,
  PRIMARY KEY (template_id, machine_id)
);

-- ─── Variable Slot-Typen in einer Vorlage ────────────────────────────────────
-- z.B. "Sleeve", "Druckplatte", "Adapter/Brücke" – frei definierbar durch den Kunden

CREATE TABLE flexo_template_slots (
  id           uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id  uuid  NOT NULL REFERENCES flexo_templates(id) ON DELETE CASCADE,
  org_id       uuid  NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label        text  NOT NULL,
  sort_order   int   NOT NULL DEFAULT 0
);

-- ─── Zuweisungen: welches Asset in welchem Druckwerk für welchen Slot ─────────

CREATE TABLE flexo_template_assignments (
  id            uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id   uuid  NOT NULL REFERENCES flexo_templates(id)      ON DELETE CASCADE,
  slot_id       uuid  NOT NULL REFERENCES flexo_template_slots(id)  ON DELETE CASCADE,
  druckwerk_id  uuid  NOT NULL REFERENCES flexo_druckwerke(id)      ON DELETE CASCADE,
  org_id        uuid  NOT NULL REFERENCES organizations(id)         ON DELETE CASCADE,
  asset_id      uuid  REFERENCES assets(id) ON DELETE SET NULL,
  notes         text,
  UNIQUE (slot_id, druckwerk_id)
);

-- ─── Rüstvorgänge ────────────────────────────────────────────────────────────

CREATE TABLE flexo_setups (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id        uuid        NOT NULL REFERENCES organizations(id)   ON DELETE CASCADE,
  machine_id    uuid        NOT NULL REFERENCES flexo_machines(id)  ON DELETE CASCADE,
  template_id   uuid        REFERENCES flexo_templates(id) ON DELETE SET NULL,
  name          text        NOT NULL,
  job_number    text,
  status        text        NOT NULL DEFAULT 'planned'
                            CHECK (status IN ('planned','in_progress','completed','cancelled')),
  notes         text,
  planned_at    timestamptz,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    uuid        REFERENCES profiles(id) ON DELETE SET NULL
);

-- ─── Schritte im Rüstvorgang (pro Druckwerk × Slot) ──────────────────────────

CREATE TABLE flexo_setup_steps (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  setup_id      uuid        NOT NULL REFERENCES flexo_setups(id)    ON DELETE CASCADE,
  org_id        uuid        NOT NULL REFERENCES organizations(id)    ON DELETE CASCADE,
  druckwerk_id  uuid        NOT NULL REFERENCES flexo_druckwerke(id) ON DELETE CASCADE,
  slot_id       uuid        REFERENCES flexo_template_slots(id) ON DELETE SET NULL,
  slot_label    text        NOT NULL,   -- denormalisiert für Verlauf
  is_fixed      boolean     NOT NULL DEFAULT false,
  asset_id      uuid        REFERENCES assets(id) ON DELETE SET NULL,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','installed','verified','skipped')),
  notes         text,
  installed_at  timestamptz,
  installed_by  uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  sort_order    int         NOT NULL DEFAULT 0
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE flexo_machines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_druckwerke           ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_fixed_slots          ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_templates            ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_template_machines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_template_slots       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_template_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_setups               ENABLE ROW LEVEL SECURITY;
ALTER TABLE flexo_setup_steps          ENABLE ROW LEVEL SECURITY;

-- Hilfsfunktion: aktuelle org_id des eingeloggten Nutzers
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;

-- Policies: alle Tabellen auf eigene Org beschränken
CREATE POLICY "flexo_machines_select"     ON flexo_machines             FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_machines_insert"     ON flexo_machines             FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_machines_update"     ON flexo_machines             FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_machines_delete"     ON flexo_machines             FOR DELETE USING (org_id = current_user_org_id());

CREATE POLICY "flexo_druckwerke_select"   ON flexo_druckwerke           FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_druckwerke_insert"   ON flexo_druckwerke           FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_druckwerke_update"   ON flexo_druckwerke           FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_druckwerke_delete"   ON flexo_druckwerke           FOR DELETE USING (org_id = current_user_org_id());

CREATE POLICY "flexo_fixed_slots_select"  ON flexo_fixed_slots          FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_fixed_slots_insert"  ON flexo_fixed_slots          FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_fixed_slots_update"  ON flexo_fixed_slots          FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_fixed_slots_delete"  ON flexo_fixed_slots          FOR DELETE USING (org_id = current_user_org_id());

CREATE POLICY "flexo_templates_select"    ON flexo_templates            FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_templates_insert"    ON flexo_templates            FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_templates_update"    ON flexo_templates            FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_templates_delete"    ON flexo_templates            FOR DELETE USING (org_id = current_user_org_id());

CREATE POLICY "flexo_tmachines_select"    ON flexo_template_machines    FOR SELECT USING (
  template_id IN (SELECT id FROM flexo_templates WHERE org_id = current_user_org_id())
);
CREATE POLICY "flexo_tmachines_insert"    ON flexo_template_machines    FOR INSERT WITH CHECK (
  template_id IN (SELECT id FROM flexo_templates WHERE org_id = current_user_org_id())
);
CREATE POLICY "flexo_tmachines_delete"    ON flexo_template_machines    FOR DELETE USING (
  template_id IN (SELECT id FROM flexo_templates WHERE org_id = current_user_org_id())
);

CREATE POLICY "flexo_tslots_select"       ON flexo_template_slots       FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_tslots_insert"       ON flexo_template_slots       FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_tslots_update"       ON flexo_template_slots       FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_tslots_delete"       ON flexo_template_slots       FOR DELETE USING (org_id = current_user_org_id());

CREATE POLICY "flexo_tassign_select"      ON flexo_template_assignments FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_tassign_insert"      ON flexo_template_assignments FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_tassign_update"      ON flexo_template_assignments FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_tassign_delete"      ON flexo_template_assignments FOR DELETE USING (org_id = current_user_org_id());

CREATE POLICY "flexo_setups_select"       ON flexo_setups               FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_setups_insert"       ON flexo_setups               FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_setups_update"       ON flexo_setups               FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_setups_delete"       ON flexo_setups               FOR DELETE USING (org_id = current_user_org_id());

CREATE POLICY "flexo_steps_select"        ON flexo_setup_steps          FOR SELECT USING (org_id = current_user_org_id());
CREATE POLICY "flexo_steps_insert"        ON flexo_setup_steps          FOR INSERT WITH CHECK (org_id = current_user_org_id());
CREATE POLICY "flexo_steps_update"        ON flexo_setup_steps          FOR UPDATE USING (org_id = current_user_org_id());
CREATE POLICY "flexo_steps_delete"        ON flexo_setup_steps          FOR DELETE USING (org_id = current_user_org_id());
