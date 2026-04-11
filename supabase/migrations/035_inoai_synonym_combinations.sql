-- Kreuzreferenz-Matrix für Synonym-Kombinationen
-- Basisobjekte (Anilox, Rakel, Walze…) × Aktionen/Eigenschaften (Reinigung, Verschleiß…)

-- group_type zu inoai_synonyms hinzufügen
ALTER TABLE inoai_synonyms
  ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'standalone'
  CHECK (group_type IN ('standalone', 'base', 'modifier'));

-- Basis-Gruppen taggen (Objekte/Komponenten)
UPDATE inoai_synonyms SET group_type = 'base' WHERE
  terms @> ARRAY['anilox'] OR
  terms @> ARRAY['sleeve'] OR
  terms @> ARRAY['rakel'] OR
  terms @> ARRAY['druckfarbe'] OR
  terms @> ARRAY['walze'] OR
  terms @> ARRAY['druckplatte'] OR
  terms @> ARRAY['keramik'] OR
  terms @> ARRAY['trockner'] OR
  terms @> ARRAY['druckmaschine'] OR
  terms @> ARRAY['substrat'] OR
  terms @> ARRAY['zentralzylinder'] OR
  terms @> ARRAY['spanndorn'];

-- Modifier-Gruppen taggen (Aktionen/Eigenschaften)
UPDATE inoai_synonyms SET group_type = 'modifier' WHERE
  terms @> ARRAY['reinigung'] OR
  terms @> ARRAY['verschleiß'] OR
  terms @> ARRAY['instandhaltung'] OR
  terms @> ARRAY['beschichtung'] OR
  terms @> ARRAY['volumen'] OR
  terms @> ARRAY['kalibrierung'] OR
  terms @> ARRAY['viskosität'] OR
  terms @> ARRAY['gravur'] OR
  terms @> ARRAY['prüfung'] OR
  terms @> ARRAY['härtung'] OR
  terms @> ARRAY['farbübertragung'] OR
  terms @> ARRAY['verstopfung'] OR
  terms @> ARRAY['tonwertzuwachs'];

-- Kombinationsmatrix-Tabelle
CREATE TABLE IF NOT EXISTS inoai_synonym_combinations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  base_id     bigint      NOT NULL REFERENCES inoai_synonyms(id) ON DELETE CASCADE,
  modifier_id bigint      NOT NULL REFERENCES inoai_synonyms(id) ON DELETE CASCADE,
  extra_terms text[]      NOT NULL DEFAULT '{}',
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(base_id, modifier_id)
);

ALTER TABLE inoai_synonym_combinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read combinations" ON inoai_synonym_combinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role manages combinations" ON inoai_synonym_combinations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── Seed: Anilox × … ──────────────────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['aniloxreinigung', 'rasterwalzenreinigung', 'anilox cleaning', 'walzenreinigung anilox']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['reinigung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['aniloxverschleiß', 'rasterwalzenverschleiß', 'anilox wear', 'anilox abnutzung']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['verschleiß']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['aniloxvolumen', 'rasterwalzenvolumen', 'anilox zellvolumen', 'bcm anilox', 'anilox ink volume']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['volumen']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['aniloxgravur', 'rasterwalzengravur', 'anilox engraving', 'anilox lasergravur', 'anilox zellgravur']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['gravur']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['aniloxbeschichtung', 'rasterwalzenbeschichtung', 'anilox coating', 'keramikbeschichtung anilox']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['beschichtung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['aniloxkalibrierung', 'rasterwalzenkalibrierung', 'anilox calibration', 'anilox einstellung', 'anilox justage']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['kalibrierung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['aniloxprüfung', 'rasterwalzenprüfung', 'anilox inspection', 'anilox messung', 'aniloxmessung']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['prüfung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['anilox wartung', 'rasterwalzen wartung', 'anilox maintenance', 'anilox service']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['anilox'] AND m.terms @> ARRAY['instandhaltung']
ON CONFLICT DO NOTHING;

-- ── Seed: Rakel × … ───────────────────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['rakelverschleiß', 'rakelklingenverschleiß', 'doctor blade wear', 'rakel abnutzung', 'rakelabrieb']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['rakel'] AND m.terms @> ARRAY['verschleiß']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['rakelreinigung', 'kammerrakelreinigung', 'doctor blade cleaning', 'rakel reinigen']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['rakel'] AND m.terms @> ARRAY['reinigung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['rakelkalibrierung', 'rakeleinstellung', 'doctor blade setup', 'rakel justage', 'rakel einrichten']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['rakel'] AND m.terms @> ARRAY['kalibrierung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['rakeldruck', 'rakel druckanpressung', 'doctor blade pressure', 'rakeldruck einstellung']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['rakel'] AND m.terms @> ARRAY['prüfung']
ON CONFLICT DO NOTHING;

-- ── Seed: Walze × … ───────────────────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['walzenreinigung', 'druckwalzenreinigung', 'roller cleaning', 'walze reinigen', 'walzenwaschung']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['walze'] AND m.terms @> ARRAY['reinigung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['walzenverschleiß', 'druckwalzenverschleiß', 'roller wear', 'walze abnutzung']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['walze'] AND m.terms @> ARRAY['verschleiß']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['walzenbeschichtung', 'druckwalzenbeschichtung', 'roller coating', 'walze beschichtung', 'walzenoberfläche']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['walze'] AND m.terms @> ARRAY['beschichtung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['walzenwartung', 'druckwalzen service', 'roller maintenance']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['walze'] AND m.terms @> ARRAY['instandhaltung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['walzenprüfung', 'druckwalzen messung', 'roller inspection', 'walzen qualitätskontrolle']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['walze'] AND m.terms @> ARRAY['prüfung']
ON CONFLICT DO NOTHING;

-- ── Seed: Druckplatte/Sleeve × … ──────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['druckplattenverschleiß', 'klischee abnutzung', 'sleeve abnutzung', 'printing plate wear']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['druckplatte'] AND m.terms @> ARRAY['verschleiß']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['druckplattengravur', 'klischee gravur', 'plate engraving', 'photopolymer gravur']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['druckplatte'] AND m.terms @> ARRAY['gravur']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['sleevereinigung', 'drucksleeve reinigung', 'sleeve cleaning', 'hülse reinigen']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['sleeve'] AND m.terms @> ARRAY['reinigung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['sleeveverschleiß', 'drucksleeve abnutzung', 'sleeve wear', 'hülse abnutzung']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['sleeve'] AND m.terms @> ARRAY['verschleiß']
ON CONFLICT DO NOTHING;

-- ── Seed: Druckfarbe × … ──────────────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['farbviskosität', 'tinten viskosität', 'ink viscosity', 'druckfarbe viskosität', 'farbe zähigkeit']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['druckfarbe'] AND m.terms @> ARRAY['viskosität']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['farbprüfung', 'tintenqualität', 'ink quality control', 'farbmessung', 'farbe testen']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['druckfarbe'] AND m.terms @> ARRAY['prüfung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['farbübertragung anilox', 'ink transfer measurement', 'farbfilm messung', 'ink film testing']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['druckfarbe'] AND m.terms @> ARRAY['farbübertragung']
ON CONFLICT DO NOTHING;

-- ── Seed: Trockner × … ────────────────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['trocknerkalibrierung', 'trocknereinstellung', 'dryer calibration', 'trockner einrichten']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['trockner'] AND m.terms @> ARRAY['kalibrierung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['trocknerwartung', 'trocknungsanlage wartung', 'dryer maintenance', 'trockner service']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['trockner'] AND m.terms @> ARRAY['instandhaltung']
ON CONFLICT DO NOTHING;

-- ── Seed: Druckmaschine × … ───────────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['druckmaschinenwartung', 'maschinenwartung', 'press maintenance', 'druckmaschine service', 'maschinenservice']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['druckmaschine'] AND m.terms @> ARRAY['instandhaltung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['druckmaschinenkalibrierung', 'maschineneinstellung', 'press setup', 'druckmaschine einrichten']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['druckmaschine'] AND m.terms @> ARRAY['kalibrierung']
ON CONFLICT DO NOTHING;

-- ── Seed: Keramik × … ─────────────────────────────────────────────────────────

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['keramikbeschichtung', 'chromoxidbeschichtung', 'ceramic coating', 'keramikschicht', 'hartchrom beschichtung']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['keramik'] AND m.terms @> ARRAY['beschichtung']
ON CONFLICT DO NOTHING;

INSERT INTO inoai_synonym_combinations (base_id, modifier_id, extra_terms)
SELECT b.id, m.id, ARRAY['keramikverschleiß', 'keramikschicht abnutzung', 'ceramic wear', 'chromoxid verschleiß']
FROM inoai_synonyms b, inoai_synonyms m
WHERE b.terms @> ARRAY['keramik'] AND m.terms @> ARRAY['verschleiß']
ON CONFLICT DO NOTHING;
