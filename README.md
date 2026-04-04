# INOid.app - Web App

B2B SaaS Asset Management fuer Maschinenkomponenten | INOMETA GmbH

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + DB + Storage)
- Stripe (Billing)
- Resend (E-Mails)
- Sentry (Monitoring)
- next-intl (de/en)

## Setup

### 1. Umgebungsvariablen einrichten
```bash
cp .env.local.example .env.local
# Dann .env.local mit deinen echten Werten befuellen
```

### 2. Supabase einrichten
```bash
npm install -g supabase
supabase login
supabase link --project-ref DEIN_PROJECT_REF
supabase db push
```

### 3. Entwicklungsserver starten
```bash
npm run dev
# App laeuft auf http://localhost:3000
```

## Benoetigte Accounts
- Supabase - Datenbank (Frankfurt Region!)
- Stripe - Zahlungen
- Resend - E-Mails
- Vercel - Hosting
- Sentry - Error Monitoring
