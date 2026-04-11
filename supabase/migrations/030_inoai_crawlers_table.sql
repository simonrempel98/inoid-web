-- Dynamische Crawler-Konfiguration für INOai
CREATE TABLE IF NOT EXISTS inoai_crawlers (
  id          text        PRIMARY KEY, -- z.B. 'inometa-de'
  name        text        NOT NULL,
  url         text        NOT NULL,
  lang        text        NOT NULL DEFAULT 'de',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: nur Service-Role darf schreiben, authentifizierte Nutzer lesen
ALTER TABLE inoai_crawlers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read crawlers"
  ON inoai_crawlers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role can manage crawlers"
  ON inoai_crawlers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Start-Crawler eintragen (3 Stück)
INSERT INTO inoai_crawlers (id, name, url, lang) VALUES
  ('inometa-de',  'INOMETA',               'https://www.inometa.de/',         'de'),
  ('printing-de', 'Printing INOMETA (DE)', 'https://printing.inometa.de/',    'de'),
  ('printing-en', 'Printing INOMETA (EN)', 'https://printing.inometa.de/en/', 'en')
ON CONFLICT (id) DO NOTHING;
