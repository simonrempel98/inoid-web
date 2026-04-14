-- Freies Canvas-Layout (Whiteboard) pro Maschine speichern
ALTER TABLE flexo_machines
  ADD COLUMN IF NOT EXISTS canvas_layout jsonb DEFAULT NULL;
