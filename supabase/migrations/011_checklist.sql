-- Checkliste am Wartungsintervall
ALTER TABLE maintenance_schedules
  ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;

-- Erledigtes Ergebnis der Checkliste am Serviceeintrag
ALTER TABLE asset_lifecycle_events
  ADD COLUMN IF NOT EXISTS checklist_result JSONB DEFAULT '[]'::jsonb;
