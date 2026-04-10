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

-- Bestehende 5 Crawler als Startwerte eintragen
INSERT INTO inoai_crawlers (id, name, url, lang) VALUES
  ('inometa-de',  'INOMETA (DE)',            'https://www.inometa.de/',           'de'),
  ('inometa-en',  'INOMETA (EN)',            'https://www.inometa.de/en/',         'en'),
  ('printing-de', 'Printing INOMETA (DE)',   'https://printing.inometa.de/',       'de'),
  ('printing-en', 'Printing INOMETA (EN)',   'https://printing.inometa.de/en/',    'en'),
  ('apex-de',     'APEX International (DE)', 'https://de.apexinternational.com/',  'de')
ON CONFLICT (id) DO NOTHING;
