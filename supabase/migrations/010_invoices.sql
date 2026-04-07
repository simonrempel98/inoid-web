-- Invoices table for plan billing
CREATE TABLE IF NOT EXISTS invoices (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number    text NOT NULL UNIQUE,           -- z.B. INO-2026-0001
  plan              text NOT NULL,
  amount_net        numeric(10,2) NOT NULL,
  vat_rate          numeric(4,2) NOT NULL DEFAULT 0.19,
  amount_vat        numeric(10,2) NOT NULL,
  amount_gross      numeric(10,2) NOT NULL,
  status            text NOT NULL DEFAULT 'pending', -- pending | paid | cancelled
  activation_code   text UNIQUE,                    -- 9-stelliger Code (nur Ziffern)
  -- Rechnungsempfänger (Snapshot zum Zeitpunkt der Erstellung)
  billing_name      text NOT NULL,
  billing_street    text,
  billing_city      text,
  billing_country   text DEFAULT 'Deutschland',
  billing_vat_id    text,                           -- optional USt-ID des Kunden
  -- Stripe
  stripe_session_id text,
  paid_at           timestamptz,
  created_at        timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view own invoices"
  ON invoices FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "org members can insert invoices"
  ON invoices FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "org members can update own invoices"
  ON invoices FOR UPDATE
  USING (organization_id = get_user_org_id());

-- Index
CREATE INDEX invoices_org_idx ON invoices(organization_id);
CREATE INDEX invoices_code_idx ON invoices(activation_code);
