-- crawler_id zur inometa_knowledge Tabelle hinzufügen
-- Erlaubt es, Einträge pro Crawler unabhängig zu löschen/ersetzen

ALTER TABLE inometa_knowledge
  ADD COLUMN IF NOT EXISTS crawler_id text NOT NULL DEFAULT 'legacy';

CREATE INDEX IF NOT EXISTS inometa_knowledge_crawler_idx
  ON inometa_knowledge (crawler_id);
