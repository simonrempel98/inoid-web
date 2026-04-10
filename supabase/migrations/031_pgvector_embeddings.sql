-- Semantische Suche via pgvector für INOai

-- pgvector Extension (in Supabase bereits verfügbar)
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding-Spalte zur Wissensbasis hinzufügen (1536 Dim. = text-embedding-3-small)
ALTER TABLE inometa_knowledge
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW-Index für schnelle Cosine-Ähnlichkeitssuche
CREATE INDEX IF NOT EXISTS inometa_knowledge_embedding_idx
  ON inometa_knowledge
  USING hnsw (embedding vector_cosine_ops);

-- Alte FTS-Funktion entfernen
DROP FUNCTION IF EXISTS search_inometa_knowledge(text, int);

-- Neue Funktion: Vektorsuche (semantic) + FTS-Fallback wenn kein Embedding vorhanden
CREATE OR REPLACE FUNCTION search_inometa_knowledge(
  query_embedding vector(1536),
  query_text       text,
  match_count      int DEFAULT 6
)
RETURNS TABLE (
  id          bigint,
  title       text,
  content     text,
  source_url  text,
  source_type text,
  language    text,
  similarity  float
)
LANGUAGE sql
AS $$
  -- Primär: Vektorsuche auf Chunks mit Embedding
  (
    SELECT id, title, content, source_url, source_type, language,
           1 - (embedding <=> query_embedding) AS similarity
    FROM inometa_knowledge
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> query_embedding
    LIMIT match_count
  )
  UNION ALL
  -- Fallback: FTS für Chunks ohne Embedding (z.B. noch nicht neu gecrawlt)
  (
    SELECT id, title, content, source_url, source_type, language,
           ts_rank(search_vec, plainto_tsquery('simple', query_text))::float AS similarity
    FROM inometa_knowledge
    WHERE embedding IS NULL
      AND search_vec @@ plainto_tsquery('simple', query_text)
    ORDER BY similarity DESC
    LIMIT match_count
  )
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
