-- Anilox-Rechner: gespeicherte Berechnungen pro Nutzer

CREATE TABLE anilox_calculations (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id)   ON DELETE CASCADE NOT NULL,
  org_id     uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name       text NOT NULL DEFAULT 'Berechnung',
  note       text,
  calc_type  text NOT NULL CHECK (calc_type IN ('volume','consumption','film','reverse','comparison')),
  inputs     jsonb NOT NULL DEFAULT '{}',
  results    jsonb NOT NULL DEFAULT '{}',
  unit       text NOT NULL DEFAULT 'metric' CHECK (unit IN ('metric','us')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE anilox_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anilox_own"
  ON anilox_calculations FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX anilox_calcs_user_idx ON anilox_calculations(user_id);
CREATE INDEX anilox_calcs_org_idx  ON anilox_calculations(org_id);
