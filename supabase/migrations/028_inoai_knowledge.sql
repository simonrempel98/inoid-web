-- INOai Knowledge Base
-- Full-text search über INOMETA-Webinhalte, Datenblätter, Broschüren

CREATE TABLE IF NOT EXISTS inometa_knowledge (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  content      text        NOT NULL,
  source_url   text,
  source_type  text        NOT NULL DEFAULT 'website', -- website | datasheet | brochure
  language     text        NOT NULL DEFAULT 'de',
  chunk_index  int         NOT NULL DEFAULT 0,
  search_vec   tsvector    GENERATED ALWAYS AS (
    to_tsvector('german', coalesce(title, '') || ' ' || content)
  ) STORED,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inometa_knowledge_search_idx
  ON inometa_knowledge USING GIN(search_vec);

-- Funktion: Ähnliche Chunks finden
CREATE OR REPLACE FUNCTION search_inometa_knowledge(query text, max_results int DEFAULT 8)
RETURNS TABLE (id uuid, title text, content text, source_url text, source_type text, rank real)
LANGUAGE sql STABLE AS $$
  SELECT
    k.id,
    k.title,
    k.content,
    k.source_url,
    k.source_type,
    ts_rank(k.search_vec, plainto_tsquery('german', query)) AS rank
  FROM inometa_knowledge k
  WHERE k.search_vec @@ plainto_tsquery('german', query)
  ORDER BY rank DESC
  LIMIT max_results;
$$;

-- RLS: Nur lesen (kein Tenant-Split – globale Wissensbasis)
ALTER TABLE inometa_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read knowledge"
  ON inometa_knowledge FOR SELECT
  TO authenticated
  USING (true);

-- Nur Service-Role darf schreiben (Ingestion-Script)
CREATE POLICY "Service role can insert knowledge"
  ON inometa_knowledge FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can delete knowledge"
  ON inometa_knowledge FOR DELETE
  TO service_role
  USING (true);
