-- Kreuzreferenz-Matrix für Synonym-Kombinationen
-- Klassifizierung und Kombinationen werden automatisch vom System (KI) gepflegt,
-- nicht durch SQL-Migrationen.

-- group_type zu inoai_synonyms hinzufügen
ALTER TABLE inoai_synonyms
  ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'standalone'
  CHECK (group_type IN ('standalone', 'base', 'modifier'));

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

CREATE POLICY "Authenticated read combinations"
  ON inoai_synonym_combinations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role manages combinations"
  ON inoai_synonym_combinations FOR ALL TO service_role USING (true) WITH CHECK (true);
