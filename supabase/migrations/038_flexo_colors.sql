-- Gespeicherte Farben/Tinten für den Anilox-Farbverbrauchsrechner

CREATE TABLE flexo_colors (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id)    ON DELETE CASCADE NOT NULL,
  org_id       uuid REFERENCES organizations(id)  ON DELETE CASCADE NOT NULL,
  name         text NOT NULL,
  supplier     text,
  color_type   text CHECK (color_type IN ('waterbase','uv','solvent','other')),
  density      numeric(5,3),
  cost_per_kg  numeric(10,4),
  notes        text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE flexo_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flexo_colors_own"
  ON flexo_colors FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX flexo_colors_user_idx ON flexo_colors(user_id);
