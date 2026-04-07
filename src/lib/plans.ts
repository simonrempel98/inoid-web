export type PlanId = 'free' | 'starter' | 'professional' | 'enterprise'

export type Plan = {
  id: PlanId
  name: string
  description: string
  price_net: number       // € netto/Jahr
  vat_rate: number        // 0.19
  asset_limit: number
  user_limit: number | null
  features: string[]
  highlighted: boolean
  stripe_price_id: string | null
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Zum Ausprobieren',
    price_net: 0,
    vat_rate: 0.19,
    asset_limit: 20,
    user_limit: 3,
    features: [
      'Bis zu 20 Assets',
      'Bis zu 3 Nutzer',
      'QR-Code & NFC',
      'Serviceheft',
      'Wartungsintervalle',
    ],
    highlighted: false,
    stripe_price_id: null,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Für kleine Betriebe',
    price_net: 490,
    vat_rate: 0.19,
    asset_limit: 100,
    user_limit: 10,
    features: [
      'Bis zu 100 Assets',
      'Bis zu 10 Nutzer',
      'QR-Code & NFC',
      'Serviceheft & Wartung',
      'Standortverwaltung',
      'Dokumenten-Upload',
      'E-Mail-Support',
    ],
    highlighted: false,
    stripe_price_id: process.env.STRIPE_PRICE_STARTER ?? null,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Für wachsende Teams',
    price_net: 990,
    vat_rate: 0.19,
    asset_limit: 500,
    user_limit: null,
    features: [
      'Bis zu 500 Assets',
      'Unbegrenzte Nutzer',
      'Alle Starter-Features',
      'Teams & Rollen',
      'Eigene Event-Typen',
      'Prioritäts-Support',
    ],
    highlighted: true,
    stripe_price_id: process.env.STRIPE_PRICE_PROFESSIONAL ?? null,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Für große Organisationen',
    price_net: 1990,
    vat_rate: 0.19,
    asset_limit: 10000,
    user_limit: null,
    features: [
      'Unbegrenzte Assets',
      'Unbegrenzte Nutzer',
      'Alle Pro-Features',
      'Dedizierter Ansprechpartner',
      'SLA-Garantie',
      'On-Premise Option',
    ],
    highlighted: false,
    stripe_price_id: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
  },
]

export function getPlan(id: string): Plan {
  return PLANS.find(p => p.id === id) ?? PLANS[0]
}

export function planGross(plan: Plan): number {
  return Math.round(plan.price_net * (1 + plan.vat_rate) * 100) / 100
}

export function planVat(plan: Plan): number {
  return Math.round(plan.price_net * plan.vat_rate * 100) / 100
}

// Inomet GmbH Rechnungsabsender – anpassen wenn nötig
export const SELLER = {
  name: 'Inomet GmbH',
  street: 'Planckstraße 15',
  city: '70184 Stuttgart',
  country: 'Deutschland',
  vat_id: 'DE123456789',      // <-- echte USt-ID eintragen
  tax_number: '99/123/45678', // <-- echte Steuernummer eintragen
  email: 'billing@inometa.de',
  bank_name: 'Deutsche Bank',
  iban: 'DE12 3456 7890 1234 5678 90',
  bic: 'DEUTDEDB',
}
