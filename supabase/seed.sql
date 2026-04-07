-- ============================================================
-- INOid.app – Seed Data
-- Demo-Organisation, System-Rollen, Demo-Asset
-- ============================================================

-- Demo Organization anlegen
INSERT INTO organizations (id, name, slug, plan, asset_limit, billing_email)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'INOMETA GmbH Demo',
  'inometa-demo',
  'professional',
  500,
  'demo@inometa.de'
);

-- ============================================================
-- System-Rollen für Demo-Organization
-- ============================================================

-- OWNER: alle Rechte
INSERT INTO roles (organization_id, name, description, is_system_role, permissions)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'OWNER',
  'Vollständiger Zugriff auf alle Funktionen',
  true,
  '{
    "assets.view": true, "assets.create": true, "assets.edit": true,
    "assets.delete": true, "assets.export": true,
    "documents.view": true, "documents.upload": true, "documents.delete": true,
    "lifecycle.view": true, "lifecycle.create": true, "lifecycle.edit": true, "lifecycle.delete": true,
    "members.view": true, "members.invite": true, "members.remove": true,
    "roles.view": true, "roles.manage": true,
    "organization.settings": true,
    "billing.view": true, "billing.manage": true,
    "api.access": true
  }'::jsonb
);

-- ADMIN: alle Rechte außer billing.manage
INSERT INTO roles (organization_id, name, description, is_system_role, permissions)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'ADMIN',
  'Alle Rechte außer Billing-Verwaltung',
  true,
  '{
    "assets.view": true, "assets.create": true, "assets.edit": true,
    "assets.delete": true, "assets.export": true,
    "documents.view": true, "documents.upload": true, "documents.delete": true,
    "lifecycle.view": true, "lifecycle.create": true, "lifecycle.edit": true, "lifecycle.delete": true,
    "members.view": true, "members.invite": true, "members.remove": true,
    "roles.view": true, "roles.manage": true,
    "organization.settings": true,
    "billing.view": true, "billing.manage": false,
    "api.access": true
  }'::jsonb
);

-- EDITOR: Assets, Dokumente, Lifecycle lesen+schreiben
INSERT INTO roles (organization_id, name, description, is_system_role, permissions)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'EDITOR',
  'Assets und Serviceheft lesen und bearbeiten',
  true,
  '{
    "assets.view": true, "assets.create": true, "assets.edit": true,
    "assets.delete": false, "assets.export": true,
    "documents.view": true, "documents.upload": true, "documents.delete": false,
    "lifecycle.view": true, "lifecycle.create": true, "lifecycle.edit": true, "lifecycle.delete": false,
    "members.view": false, "members.invite": false, "members.remove": false,
    "roles.view": false, "roles.manage": false,
    "organization.settings": false,
    "billing.view": false, "billing.manage": false,
    "api.access": false
  }'::jsonb
);

-- VIEWER: nur lesen
INSERT INTO roles (organization_id, name, description, is_system_role, permissions)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'VIEWER',
  'Nur Lesezugriff',
  true,
  '{
    "assets.view": true, "assets.create": false, "assets.edit": false,
    "assets.delete": false, "assets.export": false,
    "documents.view": true, "documents.upload": false, "documents.delete": false,
    "lifecycle.view": true, "lifecycle.create": false, "lifecycle.edit": false, "lifecycle.delete": false,
    "members.view": true, "members.invite": false, "members.remove": false,
    "roles.view": true, "roles.manage": false,
    "organization.settings": false,
    "billing.view": true, "billing.manage": false,
    "api.access": false
  }'::jsonb
);

-- TECHNICIAN: Assets sehen + Lifecycle erstellen
INSERT INTO roles (organization_id, name, description, is_system_role, permissions)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'TECHNICIAN',
  'Serviceheft-Einträge erfassen',
  true,
  '{
    "assets.view": true, "assets.create": false, "assets.edit": false,
    "assets.delete": false, "assets.export": false,
    "documents.view": true, "documents.upload": true, "documents.delete": false,
    "lifecycle.view": true, "lifecycle.create": true, "lifecycle.edit": false, "lifecycle.delete": false,
    "members.view": false, "members.invite": false, "members.remove": false,
    "roles.view": false, "roles.manage": false,
    "organization.settings": false,
    "billing.view": false, "billing.manage": false,
    "api.access": false
  }'::jsonb
);

-- ============================================================
-- Demo-Asset (Bohrwerkzeug)
-- ============================================================
INSERT INTO assets (
  id,
  organization_id,
  title,
  article_number,
  serial_number,
  order_number,
  category,
  description,
  manufacturer,
  status,
  location,
  technical_data,
  commercial_data,
  operating_hours_minutes,
  tags
) VALUES (
  'b2c3d4e5-0000-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Bohrkrone PDC 8½"',
  '010.030 A-485',
  'SN-2024-00142',
  'BEK-2024-00891',
  'Bohrkrone',
  'PDC Bohrkrone für Öl- und Gasbohrungen. Geeignet für weiches bis mittelhartes Gestein.',
  'INOMETA GmbH',
  'active',
  'Lager A, Regal 3',
  '{
    "Durchmesser": "8½ Zoll (215,9 mm)",
    "Anzahl PDC-Schneider": "16",
    "Spülungsöffnungen": "6",
    "WOB (Weight on Bit)": "5-15 t",
    "Drehzahl": "80-200 RPM",
    "Beschichtungstyp": "Hartstoffbeschichtung TiN",
    "Rundlauf": "< 0,02 mm",
    "Rautiefe Rz": "3,2 µm",
    "Anschluss": "4½\" API REG"
  }'::jsonb,
  '{
    "Einkaufspreis": "4.850,00 €",
    "Lieferant": "INOMETA GmbH",
    "Lieferzeit": "4-6 Wochen",
    "Bestellmindestmenge": "1 Stück",
    "Garantie": "12 Monate",
    "Ersatzteilnummer": "ET-010-030-A"
  }'::jsonb,
  12480,
  ARRAY['pdc', 'bohrkrone', 'tiefbohren']
);

-- Demo Lifecycle Event für den Asset
INSERT INTO asset_lifecycle_events (
  asset_id,
  organization_id,
  event_type,
  title,
  description,
  event_date,
  performed_by,
  external_company,
  cost_eur,
  next_service_date,
  notes
) VALUES (
  'b2c3d4e5-0000-0000-0000-000000000001',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'inspection',
  'Quartalsprüfung Q1 2025',
  'Routineinspektion aller Schneidelemente. Verschleiß im Normbereich. Beschichtung noch intakt.',
  '2025-03-15 09:00:00+00',
  'Thomas Müller',
  NULL,
  180.00,
  '2025-06-15 00:00:00+00',
  'Nächste Prüfung: Beschichtungsdicke genauer messen. Schneider Nr. 4 und 7 beobachten.'
);

-- Feature Flags (globale Defaults)
INSERT INTO feature_flags (organization_id, flag_key, is_enabled)
VALUES
  (NULL, 'sensors_enabled', false),
  (NULL, 'api_access', false),
  (NULL, 'advanced_reports', false),
  (NULL, 'bulk_import', true),
  (NULL, 'webhooks_outgoing', false);

-- Feature Flags für Demo-Org (Pro-Features aktiv)
INSERT INTO feature_flags (organization_id, flag_key, is_enabled)
VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'api_access', true),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'advanced_reports', true);
