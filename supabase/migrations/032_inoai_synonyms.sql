-- Synonym-Datenbank für INOai (verbesserte Suche)
CREATE TABLE IF NOT EXISTS inoai_synonyms (
  id         bigserial   PRIMARY KEY,
  terms      text[]      NOT NULL, -- alle Begriffe dieser Synonym-Gruppe
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE inoai_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read synonyms"
  ON inoai_synonyms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages synonyms"
  ON inoai_synonyms FOR ALL TO service_role USING (true) WITH CHECK (true);

-- search_inometa_knowledge auf websearch_to_tsquery umstellen
-- → unterstützt OR-Suche: "anilox OR rasterwalze OR rastersleeve"
DROP FUNCTION IF EXISTS search_inometa_knowledge(text, int);

CREATE OR REPLACE FUNCTION search_inometa_knowledge(
  query      text,
  max_results int DEFAULT 6
)
RETURNS TABLE (
  id          bigint,
  title       text,
  content     text,
  source_url  text,
  source_type text,
  language    text
)
LANGUAGE sql AS $$
  SELECT id, title, content, source_url, source_type, language
  FROM inometa_knowledge
  WHERE search_vec @@ websearch_to_tsquery('simple', query)
  ORDER BY ts_rank(search_vec, websearch_to_tsquery('simple', query)) DESC
  LIMIT max_results;
$$;

-- ── Startwerte: INOMETA-typische Synonyme ────────────────────────────────────

INSERT INTO inoai_synonyms (terms) VALUES
  (ARRAY['anilox', 'rasterwalze', 'aniloxwalze', 'anilox walze', 'anilox sleeve', 'rastersleeve', 'raster sleeve', 'aniloxsleeve']),
  (ARRAY['sleeve', 'drucksleeve', 'druck sleeve', 'druckhülse', 'hülse', 'druckhuelse']),
  (ARRAY['rakel', 'rakelklinge', 'rakelhalter', 'kammerrakel', 'kammer rakel', 'rakelkammer', 'doctor blade']),
  (ARRAY['druckfarbe', 'farbe', 'tinte', 'flexofarbe', 'drucktinte', 'ink']),
  (ARRAY['flexodruck', 'flexo', 'flexodruckmaschine', 'flexo druck', 'flexodruckverfahren', 'flexographic']),
  (ARRAY['walze', 'druckwalze', 'walzentechnologie', 'walzenreinigung', 'rolle', 'roller', 'roll']),
  (ARRAY['reinigung', 'reinigen', 'reinigungsanlage', 'walzenreinigung', 'aniloxreinigung', 'cleaning']),
  (ARRAY['oberflächenspannung', 'oberflaechenspannung', 'corona', 'coronabehandlung', 'corona behandlung', 'surface tension']),
  (ARRAY['volumen', 'zellvolumen', 'schöpfvolumen', 'schoepfvolumen', 'volumetrie', 'bcm', 'ink volume']),
  (ARRAY['lineatur', 'lpi', 'rasterweite', 'linien pro zoll', 'lines per inch', 'screen ruling']),
  (ARRAY['gravur', 'lasergravur', 'gravierung', 'zellgeometrie', 'zellform', 'engraving']),
  (ARRAY['keramik', 'keramikwalze', 'keramikbeschichtung', 'chromoxid', 'hartchrom', 'ceramic']),
  (ARRAY['druckplatte', 'druckform', 'klischee', 'photopolymerplatte', 'flexoplatte']),
  (ARRAY['wasser', 'wasserbasiert', 'wasserlack', 'aqua', 'water based']),
  (ARRAY['lösemittel', 'loesemittel', 'solvent', 'lösemittelbasiert']),
  (ARRAY['uv', 'uv-lack', 'uv lack', 'uv-farbe', 'uv curing', 'uv härtung']),
  (ARRAY['druck', 'drucken', 'druckvorgang', 'druckprozess', 'printing', 'print']),
  (ARRAY['verpackung', 'packaging', 'folie', 'film', 'karton', 'etikett', 'label']);
