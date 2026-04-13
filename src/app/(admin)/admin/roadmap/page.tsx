// Admin-only · kein i18n · nur Deutsch
import React from 'react'

export default function RoadmapPage() {
  const S = {
    page:    { fontFamily: 'Arial, sans-serif', color: 'var(--adm-text2)', paddingBottom: 120 } as React.CSSProperties,
    section: { marginBottom: 60 } as React.CSSProperties,
    h1:      { fontSize: 28, fontWeight: 900, color: 'var(--adm-text)', margin: '0 0 6px', letterSpacing: '-0.02em' } as React.CSSProperties,
    h2:      { fontSize: 20, fontWeight: 800, color: 'var(--adm-text)', margin: '0 0 4px' } as React.CSSProperties,
    h3:      { fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', margin: '0 0 12px' } as React.CSSProperties,
    sub:     { fontSize: 13, color: 'var(--adm-text3)', margin: '0 0 20px', display: 'block', lineHeight: 1.6 } as React.CSSProperties,
    card:    { background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', padding: '20px 24px', marginBottom: 12 } as React.CSSProperties,
    p:       { fontSize: 13, color: 'var(--adm-text2)', lineHeight: 1.75, margin: '0 0 10px' } as React.CSSProperties,
    mono:    { fontFamily: "'Courier New', monospace", fontSize: 12, color: '#34d399', background: 'var(--adm-bg)', padding: '1px 6px', borderRadius: 4 } as React.CSSProperties,
    divider: { borderTop: '1px solid var(--adm-border)', margin: '48px 0' } as React.CSSProperties,
    anchor:  { display: 'block', position: 'relative' as const, top: -80 },
    ul:      { margin: '8px 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: 6 } as React.CSSProperties,
  }

  type Status = 'done' | 'open' | 'important' | 'optional' | 'later'
  function badge(status: Status) {
    const map: Record<Status, { label: string; color: string; bg: string }> = {
      done:      { label: 'Erledigt',  color: '#34d399', bg: '#052e16' },
      open:      { label: 'Offen',     color: '#60a5fa', bg: '#1e3a5f' },
      important: { label: '! Wichtig', color: '#fbbf24', bg: '#2a1f00' },
      optional:  { label: 'Optional',  color: '#a78bfa', bg: '#2d1b69' },
      later:     { label: 'Später',    color: '#6b7280', bg: '#1f2937' },
    }
    const c = map[status]
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
        color: c.color, background: c.bg, whiteSpace: 'nowrap' as const,
        flexShrink: 0,
      }}>
        {c.label}
      </span>
    )
  }

  function item(text: string, status: Status, note?: string) {
    return (
      <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--adm-text2)', lineHeight: 1.6 }}>
        <span style={{ marginTop: 2, flexShrink: 0 }}>
          {status === 'done' ? '✓' : '○'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span>{text}</span>
          {note && <span style={{ display: 'block', fontSize: 11, color: 'var(--adm-text4)', marginTop: 2 }}>{note}</span>}
        </div>
        {badge(status)}
      </li>
    )
  }

  function sectionHeader(id: string, emoji: string, title: string, subtitle: string) {
    return (
      <>
        <span id={id} style={S.anchor} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'var(--adm-surface)', border: '1px solid var(--adm-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {emoji}
          </div>
          <div>
            <h2 style={S.h2}>{title}</h2>
            <span style={S.sub}>{subtitle}</span>
          </div>
        </div>
      </>
    )
  }

  // Inhaltsverzeichnis-Links
  const toc = [
    { id: 'dsgvo',       emoji: '🔒', label: 'DSGVO & Datenschutz' },
    { id: 'infra',       emoji: '🏗️', label: 'Infrastruktur & Sicherheit' },
    { id: 'testing',     emoji: '🧪', label: 'Staging, Testing & CI/CD' },
    { id: 'appstores',   emoji: '📱', label: 'App Stores & Mobile' },
    { id: 'monetize',    emoji: '💶', label: 'Monetarisierung & Rechtliches' },
    { id: 'scale',       emoji: '🚀', label: 'Wachstum & Skalierung' },
  ]

  return (
    <div style={S.page}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={S.h1}>Von MVP zu Professional</h1>
        <p style={{ fontSize: 14, color: 'var(--adm-text3)', margin: '6px 0 0', lineHeight: 1.7 }}>
          Dieser Bereich dokumentiert alle Schritte um INOid.app DSGVO-konform,
          infrastrukturell stabil, testbar und kommerziell vermarktbar zu machen.
          Statusfarben: <span style={{ color: '#34d399', fontWeight: 700 }}>Grün = erledigt</span>,{' '}
          <span style={{ color: '#fbbf24', fontWeight: 700 }}>Gelb = wichtig & offen</span>,{' '}
          <span style={{ color: '#60a5fa', fontWeight: 700 }}>Blau = offen</span>.
        </p>
      </div>

      {/* ── Inhaltsverzeichnis ────────────────────────────────────────────── */}
      <div style={{
        ...S.card,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, marginBottom: 48,
      }}>
        {toc.map(t => (
          <a key={t.id} href={`#${t.id}`} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--adm-bg)', border: '1px solid var(--adm-border)',
            color: 'var(--adm-text2)', textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>
            <span>{t.emoji}</span>
            <span>{t.label}</span>
          </a>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 1. DSGVO                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        {sectionHeader('dsgvo', '🔒', 'DSGVO & Datenschutz', 'Was muss passieren damit die Plattform rechtlich sauber betrieben werden kann.')}

        {/* Auftragsverarbeitung */}
        <div style={S.card}>
          <h3 style={S.h3}>1.1 Auftragsverarbeitungsverträge (AVV) mit Sub-Prozessoren</h3>
          <p style={S.p}>
            Jeder externe Dienst, der personenbezogene Daten verarbeitet, braucht einen AVV.
            Die folgenden Anbieter sind im Einsatz:
          </p>
          <ul style={S.ul}>
            {item('AVV mit Supabase abschließen', 'important', 'supabase.com/privacy → "Data Processing Agreement" — kostenlos, online abschließbar. Supabase ist US-Unternehmen → SCCs erforderlich.')}
            {item('AVV mit Vercel abschließen', 'important', 'vercel.com/legal/dpa — Data Processing Addendum, online abschließbar. Vercel verarbeitet HTTP-Anfragen inkl. IP-Adressen.')}
            {item('AVV mit Anthropic abschließen', 'important', 'anthropic.com/legal/data-processing-addendum — gilt für KI-Features (INOai, KI-Import). Anthropic trainiert nicht auf API-Daten.')}
            {item('Alle drei AVVs dokumentieren (Datum, Version)', 'open', 'Im internen Verarbeitungsverzeichnis festhalten.')}
          </ul>
        </div>

        {/* Datenschutzerklärung */}
        <div style={S.card}>
          <h3 style={S.h3}>1.2 Datenschutzerklärung (DSE)</h3>
          <ul style={S.ul}>
            {item('DSE vorhanden und erreichbar unter /datenschutz', 'open', 'Muss alle Verarbeitungstätigkeiten nennen: Auth, Asset-Daten, KI-Nutzung, Logs.')}
            {item('Sub-Prozessoren vollständig auflisten', 'open', 'Supabase, Vercel, Anthropic, ggf. Resend (E-Mail), GitHub Actions.')}
            {item('Drittlandtransfer korrekt beschreiben', 'important', 'USA-Transfer (Supabase, Vercel, Anthropic) muss mit SCCs begründet werden.')}
            {item('Löschfristen definieren', 'open', 'z.B. Accounts 30 Tage nach Kündigung, Logs 90 Tage, Sensor-Readings nach X Monaten.')}
            {item('KI-Nutzung explizit benennen', 'important', 'Nutzer müssen wissen, dass Eingaben an Anthropic übertragen werden können.')}
          </ul>
        </div>

        {/* Technische Maßnahmen */}
        <div style={S.card}>
          <h3 style={S.h3}>1.3 Technisch-Organisatorische Maßnahmen (TOMs)</h3>
          <ul style={S.ul}>
            {item('Row Level Security (RLS) in Supabase — alle Tabellen', 'done', 'Nutzer sehen ausschließlich Daten ihrer eigenen Organisation.')}
            {item('TLS/HTTPS für alle Verbindungen', 'done', 'Vercel und Supabase erzwingen HTTPS.')}
            {item('API-Keys nur als Umgebungsvariablen', 'done', 'Kein Hardcoding, alles in Vercel Environment Variables.')}
            {item('Datenminimierung bei KI-Aufrufen', 'open', 'KI-Import: nur Bilder/Text senden, keine Account-IDs oder PII.')}
            {item('Audit-Log für Admin-Aktionen', 'done', 'admin_audit_log Tabelle vorhanden.')}
            {item('Passwort-Policy dokumentieren', 'optional', 'Supabase Auth erzwingt Mindestlänge — reicht für den Start.')}
            {item('2FA für Admin-Accounts aktivieren', 'open', 'Supabase Auth unterstützt TOTP — für Platform-Admins empfehlenswert.')}
          </ul>
        </div>

        {/* KI-spezifisch */}
        <div style={S.card}>
          <h3 style={S.h3}>1.4 KI-spezifische DSGVO-Pflichten</h3>
          <p style={S.p}>
            Seit dem EU AI Act (ab Aug 2024 in Kraft) gelten für KI-Systeme zusätzliche Pflichten.
            INOid fällt als Minimal-Risk-System in die unkritische Kategorie — trotzdem gelten Basispflichten:
          </p>
          <ul style={S.ul}>
            {item('KI-Nutzung für Endnutzer erkennbar machen', 'open', 'Button "Beantwortet von INOai" oder ähnlicher Hinweis reicht aus.')}
            {item('Kein automatisierter Entscheidungsprozess mit Rechtswirkung', 'done', 'INOai gibt nur Empfehlungen, keine bindenden Entscheidungen.')}
            {item('Opt-in für KI-Import pro Organisation', 'done', 'Feature-Toggle bereits implementiert — Kunde aktiviert bewusst.')}
            {item('Anthropic: Sicherstellen dass kein Training auf Kundendaten', 'done', 'Anthropic API trainiert per Default nicht auf Eingaben — in DSE dokumentieren.')}
          </ul>
        </div>

        {/* Empfehlung EU-Alternative */}
        <div style={{ ...S.card, border: '1px solid #2a1f00', background: 'rgba(251,191,36,0.04)' }}>
          <h3 style={{ ...S.h3, color: '#fbbf24' }}>⚡ Empfehlung: Anthropic via AWS Bedrock EU</h3>
          <p style={{ ...S.p, color: 'var(--adm-text2)' }}>
            Mit einem Wechsel zu AWS Bedrock (Frankfurt-Region) bleiben alle Daten in der EU.
            Gleiche Claude-Modelle, gleiche API-Struktur, aber EU-Datenprozessierung.
            Aufwand: ca. 1–2 Stunden Umbau.
          </p>
          <ul style={S.ul}>
            {item('AWS-Account anlegen und Bedrock-Zugang für eu-central-1 aktivieren', 'open')}
            {item('anthropic-sdk durch @aws-sdk/client-bedrock-runtime ersetzen', 'open', 'In /api/inoai/chat/route.ts und /api/assets/extract/route.ts')}
            {item('AVV entfällt — AWS EU DPA reicht aus', 'optional')}
          </ul>
        </div>
      </div>

      <hr style={S.divider} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 2. INFRASTRUKTUR                                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        {sectionHeader('infra', '🏗️', 'Infrastruktur & Sicherheit', 'Aktueller Stack, bekannte Schwachstellen und der Weg zur produktionsreifen Plattform.')}

        {/* Aktueller Stack */}
        <div style={S.card}>
          <h3 style={S.h3}>2.1 Aktueller Stack — Bewertung</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {[
              { name: 'Next.js (App Router)', tier: 'Vercel', status: '✓ Gut', color: '#34d399', note: 'Server Components, Edge-Ready. Für Production tauglich.' },
              { name: 'Supabase (Free Tier)', tier: 'Datenbank + Auth + Storage', status: '⚠ Upgrade nötig', color: '#fbbf24', note: 'Free pausiert nach 7 Tagen Inaktivität. Kein PITR. Keine dedizierten Ressourcen.' },
              { name: 'Vercel (Hobby)', tier: 'Hosting', status: '⚠ Upgrade nötig', color: '#fbbf24', note: 'Keine custom Domains ohne Pro. Keine erweiterten Logs. Bandwidth-Limit.' },
              { name: 'Anthropic API', tier: 'KI', status: '○ AVV fehlt', color: '#60a5fa', note: 'Technisch stabil. DPA muss abgeschlossen werden.' },
              { name: 'Vercel Cron (Sensor-Sim)', tier: 'Cron', status: '✓ Funktioniert', color: '#34d399', note: 'Minimum 1 min. Interval. Für Simulation ausreichend.' },
              { name: 'GitHub Actions', tier: 'CI', status: '✓ Vorhanden', color: '#34d399', note: 'Deploy on Push. Kein Testlauf konfiguriert.' },
            ].map(s => (
              <div key={s.name} style={{
                background: 'var(--adm-bg)', borderRadius: 10, border: '1px solid var(--adm-border)', padding: '14px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text)' }}>{s.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.status}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--adm-text4)', marginBottom: 6 }}>{s.tier}</div>
                <div style={{ fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Supabase */}
        <div style={S.card}>
          <h3 style={S.h3}>2.2 Supabase — Upgrade-Pfad</h3>
          <ul style={S.ul}>
            {item('Upgrade auf Supabase Pro (25 $/Monat)', 'important', 'Kein Pausing, 8GB Storage, PITR (Point-in-Time Recovery), SLA, dedizierte Ressourcen.')}
            {item('EU-Region für das Projekt wählen', 'important', 'Bei Neuanlage: eu-central-1 (Frankfurt). Bestehende Projekte können migriert werden (Supabase Support kontaktieren).')}
            {item('Automatische Backups aktivieren (PITR 7 Tage)', 'open', 'Auf Pro automatisch vorhanden. Täglich + kontinuierlich.')}
            {item('Connection Pooler (PgBouncer) aktivieren', 'open', 'Verhindert zu viele offene DB-Verbindungen bei vielen gleichzeitigen Nutzern. Schon konfigurierbar im Dashboard.')}
            {item('Datenbank-Passwort sichern', 'open', 'Starkes Passwort setzen, nie im Code. Nur in Vercel-Env.')}
            {item('Read Replicas für Reporting/Analytics', 'later', 'Ab Supabase Team-Plan (599$/Monat). Erst bei > 10k DAU relevant.')}
          </ul>
        </div>

        {/* Vercel */}
        <div style={S.card}>
          <h3 style={S.h3}>2.3 Vercel — Upgrade-Pfad</h3>
          <ul style={S.ul}>
            {item('Upgrade auf Vercel Pro (20 $/Monat)', 'important', 'Custom Domains ohne Limits, erweiterte Logs, Team-Features, höhere Cron-Frequenz, 100 GB Bandwidth.')}
            {item('Custom Domain einrichten (inoid.app)', 'open', 'Eigene Domain im Vercel-Dashboard hinzufügen. DNS-Eintrag beim Domain-Registrar setzen.')}
            {item('CNAME für api.inoid.app als separaten Service', 'later', 'Nur relevant wenn API und Frontend getrennt deployt werden.')}
            {item('Environment Variables für Preview/Production trennen', 'open', 'Staging-Umgebung (z.B. staging.inoid.app) mit eigener Supabase-Datenbank.')}
            {item('Log Drain aktivieren', 'optional', 'Logs in Datadog/Logtail/Better Stack leiten für Monitoring.')}
          </ul>
        </div>

        {/* Monitoring */}
        <div style={S.card}>
          <h3 style={S.h3}>2.4 Monitoring & Alerting</h3>
          <ul style={S.ul}>
            {item('Uptime-Monitoring einrichten', 'open', 'Better Uptime (kostenlos) oder UptimeRobot. Alert per E-Mail/SMS wenn App down.')}
            {item('Fehler-Tracking mit Sentry', 'open', 'Sentry free tier reicht für den Start. sentry.io/for/nextjs — npm install @sentry/nextjs.')}
            {item('Performance-Monitoring (Web Vitals)', 'optional', 'Vercel Analytics ist schon integriert. Core Web Vitals automatisch.')}
            {item('Datenbank-Monitoring in Supabase', 'open', 'Supabase Dashboard → Monitoring → Slow queries, Connection count.')}
            {item('Alert bei Cron-Job-Fehler', 'open', 'Vercel sendet keine Alerts bei Cron-Fehler. Healthcheck-Endpoint + externer Monitor.')}
          </ul>
        </div>

        {/* Sicherheit */}
        <div style={S.card}>
          <h3 style={S.h3}>2.5 Sicherheitshärtung</h3>
          <ul style={S.ul}>
            {item('Rate Limiting auf API-Endpunkte', 'open', 'Besonders /api/inoai/chat und /api/assets/extract. Upstash Redis (kostenlos) + @upstash/ratelimit.')}
            {item('CRON_SECRET für alle Cron-Jobs gesetzt', 'done', 'Bereits implementiert und in Vercel-Env.')}
            {item('Security Headers (CSP, HSTS, X-Frame-Options)', 'open', 'In next.config.js unter headers() definieren.')}
            {item('Supabase Auth Email Confirm aktivieren', 'open', 'Verhindert Fake-Registrierungen. Im Supabase Auth-Dashboard aktivieren.')}
            {item('Keine sensiblen Daten in Query-Params', 'done', 'Asset-IDs als UUIDs, keine PII in URLs.')}
            {item('Dependency-Scanning (npm audit / Dependabot)', 'open', 'GitHub Dependabot in Repo-Settings aktivieren. Automatische PRs bei Sicherheitslücken.')}
          </ul>
        </div>
      </div>

      <hr style={S.divider} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 3. TESTING                                                        */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        {sectionHeader('testing', '🧪', 'Staging, Testing & CI/CD', 'Wie neue Features getestet werden ohne Produktionsdaten zu gefährden.')}

        {/* Staging */}
        <div style={S.card}>
          <h3 style={S.h3}>3.1 Staging-Umgebung</h3>
          <p style={S.p}>
            Ziel: <strong style={{ color: 'var(--adm-text)' }}>staging.inoid.app</strong> mit eigener Datenbank —
            neue Features testen ohne Produktionsdaten zu riskieren.
          </p>
          <ul style={S.ul}>
            {item('Zweites Supabase-Projekt anlegen (kostenlos möglich)', 'open', 'Namenskonvention: inoid-staging. Gleiche Schema-Migrations laufen lassen.')}
            {item('Staging-Umgebung in Vercel konfigurieren', 'open', 'Branch "staging" → automatisches Deploy auf staging.inoid.app. Eigene Env-Variablen mit Staging-Supabase-Keys.')}
            {item('Seed-Daten-Skript erstellen', 'open', 'supabase/seed.sql mit Demo-Org, Demo-Assets, Demo-User. Schnell neu befüllbar nach Reset.')}
            {item('Migrations-Workflow dokumentieren', 'open', 'Immer zuerst auf Staging testen, dann auf Produktion pushen. supabase db push --db-url $STAGING_URL')}
            {item('Supabase Branching (Beta)', 'optional', 'Supabase bietet Git-ähnliche DB-Branches. Noch in Beta, aber sehr vielversprechend für Feature-Branches.')}
          </ul>
        </div>

        {/* Tests */}
        <div style={S.card}>
          <h3 style={S.h3}>3.2 Automatisierte Tests</h3>
          <p style={S.p}>
            Kein Test ist schlimmer als gar kein Test — aber fang mit dem an was den meisten Wert bringt:
          </p>
          <ul style={S.ul}>
            {item('E2E-Tests mit Playwright (kritische Flows)', 'open', 'Login → Asset anlegen → QR scannen → Asset löschen. Tests laufen in GitHub Actions vor jedem Merge.')}
            {item('API-Tests für kritische Endpoints', 'open', '/api/sensors/ingest, /api/assets/[id], /api/inoai/chat — mit MSW oder echtem Staging-Supabase.')}
            {item('Unit-Tests für Berechnungslogik', 'optional', 'PLANS, permissions, Sensor-Ranges — schnell, hoher Wert, kein Aufwand.')}
            {item('Lighthouse CI für Performance-Regressions', 'optional', 'GitHub Action mit lighthouse-ci — verhindert unbemerkte Performance-Verschlechterungen.')}
          </ul>
        </div>

        {/* CI/CD */}
        <div style={S.card}>
          <h3 style={S.h3}>3.3 CI/CD Pipeline</h3>
          <ul style={S.ul}>
            {item('TypeScript-Check im CI (tsc --noEmit)', 'open', 'Verhindert Type-Fehler im Produktiv-Build. In .github/workflows/ci.yml.')}
            {item('ESLint im CI', 'open', 'Codequalität erzwingen vor jedem Merge.')}
            {item('Preview-Deployments für jeden PR', 'done', 'Vercel macht das automatisch — jeder Pull Request bekommt eine eigene URL.')}
            {item('Migrations automatisch auf Staging anwenden', 'open', 'Nach Merge in staging-Branch: supabase db push ausführen.')}
            {item('Release-Tags mit Changelog', 'later', 'Semantic Versioning (v1.0.0) + automatischer Changelog aus Commit-Messages.')}
          </ul>
        </div>
      </div>

      <hr style={S.divider} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. APP STORES                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        {sectionHeader('appstores', '📱', 'App Stores & Mobile', 'Drei Wege in die App Stores — von schnell bis nativ.')}

        {/* PWA */}
        <div style={{ ...S.card, border: '1px solid #052e16' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ ...S.h3, margin: 0, color: '#34d399' }}>Option A: Progressive Web App (PWA) ← Empfehlung für jetzt</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399', background: '#052e16', padding: '2px 10px', borderRadius: 20 }}>Aufwand: 1 Tag</span>
          </div>
          <p style={S.p}>
            Die App läuft bereits hervorragend auf Mobile. Mit einem PWA-Manifest kann sie
            wie eine native App installiert werden — ohne App Store, sofortige Updates, kein 30%-Cut.
          </p>
          <ul style={S.ul}>
            {item('Web App Manifest (manifest.json) anlegen', 'open', 'name, icons (192px, 512px), start_url, display: standalone, theme_color.')}
            {item('Service Worker für Offline-Fähigkeit', 'optional', 'next-pwa Package. Offline-Seite wenn keine Verbindung.')}
            {item('App-Icons in allen Größen erstellen', 'open', 'iOS: apple-touch-icon. Android: maskable icons. Tool: realfavicongenerator.net')}
            {item('HTTPS (bereits vorhanden via Vercel)', 'done', 'PWA-Anforderung erfüllt.')}
            {item('PWA via Microsoft Store veröffentlichen', 'optional', 'PWABuilder.com — PWA direkt im Microsoft Store listen, kostenlos.')}
          </ul>
        </div>

        {/* Capacitor */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ ...S.h3, margin: 0 }}>Option B: Capacitor.js (Hybrid-App)</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', background: '#1e3a5f', padding: '2px 10px', borderRadius: 20 }}>Aufwand: 3–5 Tage</span>
          </div>
          <p style={S.p}>
            Capacitor.js wrapp die bestehende Next.js-App in eine native iOS/Android-Shell.
            Zugriff auf Kamera, NFC, Benachrichtigungen. Echter App Store Eintrag.
          </p>
          <ul style={S.ul}>
            {item('Capacitor installieren und konfigurieren', 'open', 'npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android')}
            {item('App als Static Export bauen', 'open', 'next.config.js: output: "export". Achtung: Server Components werden eingeschränkt.')}
            {item('Apple Developer Account (99 $/Jahr)', 'open', 'Pflicht für iOS App Store. Benötigt Mac für Xcode-Build.')}
            {item('Google Play Developer Account (25 $ einmalig)', 'open', 'Benötigt für Android Play Store.')}
            {item('App Store Guidelines erfüllen', 'important', 'Privacy Policy URL, Datenschutzerklärung, App-Beschreibung, Screenshots (6.7", 5.5" iPhone + iPad).')}
            {item('In-App Purchase (falls Abo im App Store)', 'later', 'Apple verlangt 30% auf In-App-Käufe. Vermeidbar wenn Kauf außerhalb der App stattfindet.')}
          </ul>
        </div>

        {/* React Native */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ ...S.h3, margin: 0 }}>Option C: React Native (Native App)</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#1f2937', padding: '2px 10px', borderRadius: 20 }}>Aufwand: Monate</span>
          </div>
          <p style={S.p}>
            Vollständige Neuentwicklung der mobilen App in React Native / Expo.
            Beste Performance, voller Nativer-Funktionszugriff. Nur sinnvoll wenn Mobile der
            primäre Use-Case wird.
          </p>
          <ul style={S.ul}>
            {item('Supabase JS SDK läuft auch in React Native', 'done', 'API-Layer ist wiederverwendbar.')}
            {item('Expo als Framework verwenden', 'optional', 'Expo Go für schnelles Testing. EAS Build für Store-Releases.')}
            {item('Getrennte App für Techniker (QR-Scanner-fokussiert)', 'later', 'Einfache App nur zum Scannen und Serviceheft-Eintrag erstellen.')}
          </ul>
        </div>
      </div>

      <hr style={S.divider} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. MONETARISIERUNG                                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        {sectionHeader('monetize', '💶', 'Monetarisierung & Rechtliches', 'Was muss vorhanden sein um Geld zu verdienen — legal, technisch und operativ.')}

        {/* Rechtliches */}
        <div style={S.card}>
          <h3 style={S.h3}>5.1 Rechtliche Basis</h3>
          <ul style={S.ul}>
            {item('Impressum (§5 TMG)', 'important', 'Name, Anschrift, Telefon, E-Mail, Handelsregisternummer. Pflicht für gewerbliche Websites.')}
            {item('Allgemeine Geschäftsbedingungen (AGB)', 'important', 'Inkl. Laufzeit, Kündigung, Haftungsbeschränkung, Leistungsbeschreibung. Anwalt empfohlen.')}
            {item('Datenschutzerklärung (DSGVO)', 'important', 'Siehe Abschnitt 1 — muss komplett sein.')}
            {item('Auftragsverarbeitungsvertrag für Kunden', 'important', 'Ihr verarbeitet Kundendaten (Assets, Mitarbeiter). Kunden müssen euch einen AVV geben oder ihr stellt einen.')}
            {item('SaaS-Nutzungsbedingungen / EULA', 'open', 'Uptime-Garantien, Support-Level, Datenlöschung bei Kündigung, Exportmöglichkeiten.')}
            {item('Umsatzsteuer-Identifikationsnummer (UStID)', 'important', 'Pflicht für B2B-Rechnungen in der EU. Beim Finanzamt beantragen.')}
          </ul>
        </div>

        {/* Billing */}
        <div style={S.card}>
          <h3 style={S.h3}>5.2 Billing & Zahlungsabwicklung</h3>
          <p style={S.p}>
            Das aktuelle Billing-System (Rechnung + Überweisung + 9-stelliger Code) ist für B2B vollkommen legitim
            und häufig bevorzugt. Für Self-Service-Kunden (Online-Kauf ohne Vertriebskontakt) ist Stripe sinnvoll.
          </p>
          <ul style={S.ul}>
            {item('Aktuelles System: Rechnung per E-Mail + Überweisung', 'done', 'Gut für Unternehmenskunden. Geringe Gebühren, kein Vendor-Lock-in.')}
            {item('Stripe für Self-Service-Signups', 'optional', 'Stripe Billing + Stripe Tax für automatische MwSt-Berechnung (EU VAT MOSS). Aufwand ca. 3 Tage.')}
            {item('EU VAT Compliance (One-Stop-Shop)', 'important', 'Bei B2C-Verkäufen in die EU: MwSt des Käuferlandes abführen. Stripe Tax automatisiert das.')}
            {item('Dunning-Management (Mahnwesen)', 'open', 'Automatische Mahnung bei ausgebliebener Zahlung. Stripe erledigt das automatisch.')}
            {item('Rechnungsarchivierung (10 Jahre)', 'important', 'Pflicht nach HGB/GoB. PDFs sicher archivieren (nicht nur Datenbank).')}
          </ul>
        </div>

        {/* Pricing */}
        <div style={S.card}>
          <h3 style={S.h3}>5.3 Pricing & Pläne</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { plan: 'Free', price: '0 €/Monat', target: 'Testen & Kennenlernen', limits: '20 Assets, 1 User, Basis-Features', accent: '#6b7280' },
              { plan: 'Starter', price: '49–79 €/Monat', target: 'Kleine Betriebe', limits: '100 Assets, 5 User, Wartung + Serviceheft', accent: '#0099cc' },
              { plan: 'Professional', price: '149–199 €/Monat', target: 'Mittelstand', limits: '500 Assets, 20 User, alle Features + Sensorik', accent: '#6366f1' },
              { plan: 'Enterprise', price: 'auf Anfrage', target: 'Großbetriebe / OEM', limits: 'Unbegrenzt, SLA, Custom Domain, Onboarding', accent: '#f59e0b' },
            ].map(p => (
              <div key={p.plan} style={{
                background: 'var(--adm-bg)', borderRadius: 10, border: `1px solid ${p.accent}33`,
                padding: '14px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: p.accent, marginBottom: 4 }}>{p.plan}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--adm-text)', marginBottom: 6 }}>{p.price}</div>
                <div style={{ fontSize: 11, color: 'var(--adm-text4)', marginBottom: 4 }}>{p.target}</div>
                <div style={{ fontSize: 11, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{p.limits}</div>
              </div>
            ))}
          </div>
          <p style={{ ...S.p, marginTop: 14 }}>
            <strong style={{ color: 'var(--adm-text)' }}>Tipp:</strong> Jährliche Abrechnung mit 2 Monaten Rabatt anbieten —
            verbessert Cash-Flow erheblich und reduziert Churn.
          </p>
        </div>

        {/* Vertrieb */}
        <div style={S.card}>
          <h3 style={S.h3}>5.4 Vertriebskanäle</h3>
          <ul style={S.ul}>
            {item('Direktvertrieb B2B (aktuell)', 'done', 'Persönlicher Kontakt, Rechnung, individuell. Passt zu INOMETA-Bestandskunden.')}
            {item('Self-Service Signup', 'open', 'Registrierung → Free-Plan → Upgrade-Flow. Benötigt Stripe + AGB + Onboarding-E-Mails.')}
            {item('App Marketplace (z.B. Microsoft AppSource)', 'later', 'Für Enterprise-Kunden mit Microsoft-Ökosystem relevant.')}
            {item('Reseller-Programm', 'later', 'Andere Maschinenhändler oder Serviceunternehmen als Wiederverkäufer. Klare Marge & Vertrag nötig.')}
          </ul>
        </div>
      </div>

      <hr style={S.divider} />

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 6. SKALIERUNG                                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        {sectionHeader('scale', '🚀', 'Wachstum & Skalierung', 'Was passiert wenn es wirklich losgeht — und wie die Plattform mitwächst.')}

        <div style={S.card}>
          <h3 style={S.h3}>6.1 Wachstumsphasen</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              {
                phase: 'Phase 1 · Jetzt',
                label: '< 10 Kunden, < 1.000 Assets',
                color: '#34d399',
                items: [
                  'Supabase Free → Pro (25 $/Mon)',
                  'Vercel Hobby → Pro (20 $/Mon)',
                  'AVVs abschließen',
                  'Staging-Umgebung einrichten',
                  'Impressum + AGB + DSE live',
                ],
              },
              {
                phase: 'Phase 2 · Wachstum',
                label: '10–100 Kunden, 1.000–50.000 Assets',
                color: '#60a5fa',
                items: [
                  'Monitoring (Sentry + Uptime)',
                  'E2E-Tests für kritische Flows',
                  'Stripe für Self-Service',
                  'PWA / Capacitor-App',
                  'Rate Limiting + Security Headers',
                  'Supabase EU-Region',
                ],
              },
              {
                phase: 'Phase 3 · Scale',
                label: '> 100 Kunden, Enterprise-Kunden',
                color: '#a78bfa',
                items: [
                  'Supabase Team (Read Replicas)',
                  'Multi-Region Deployment',
                  'SLA-Verträge',
                  'ISO 27001 / SOC 2 Zertifizierung',
                  'Dedicated Instances auf Anfrage',
                  'SAML SSO für Enterprise-Kunden',
                ],
              },
            ].map((p, i) => (
              <div key={p.phase} style={{
                display: 'grid', gridTemplateColumns: '200px 1fr',
                gap: 20, padding: '16px 0',
                borderTop: i > 0 ? '1px solid var(--adm-border)' : 'none',
                alignItems: 'start',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.phase}</div>
                  <div style={{ fontSize: 11, color: 'var(--adm-text4)', marginTop: 2, lineHeight: 1.5 }}>{p.label}</div>
                </div>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.items.map(it => (
                    <li key={it} style={{ fontSize: 12, color: 'var(--adm-text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <h3 style={S.h3}>6.2 Kosten-Übersicht (Phase 1)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-border)' }}>
                  {['Dienst', 'Plan', 'Kosten/Monat', 'Notiz'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--adm-text4)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Supabase', plan: 'Pro', cost: '25 $', note: 'Pflicht für Production' },
                  { name: 'Vercel', plan: 'Pro', cost: '20 $', note: 'Custom Domain + Logs' },
                  { name: 'Anthropic', plan: 'Pay-as-you-go', cost: '5–20 $', note: 'Abhängig von KI-Nutzung' },
                  { name: 'Domain (inoid.app)', plan: 'Jährlich', cost: '~2 $', note: '~24 $/Jahr' },
                  { name: 'Sentry', plan: 'Free', cost: '0 $', note: 'Reicht für Phase 1' },
                  { name: 'Uptime-Monitor', plan: 'Free', cost: '0 $', note: 'Better Uptime / UptimeRobot' },
                  { name: 'Resend (E-Mail)', plan: 'Free', cost: '0 $', note: '100 E-Mails/Tag kostenlos' },
                ].map(r => (
                  <tr key={r.name} style={{ borderBottom: '1px solid var(--adm-border)' }}>
                    <td style={{ padding: '10px 12px', color: 'var(--adm-text)', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--adm-text3)' }}>{r.plan}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399', fontWeight: 700 }}>{r.cost}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--adm-text4)', fontSize: 12 }}>{r.note}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--adm-border)' }}>
                  <td colSpan={2} style={{ padding: '10px 12px', color: 'var(--adm-text)', fontWeight: 800 }}>Gesamt Phase 1</td>
                  <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 800, fontSize: 15 }}>~50–70 $/Monat</td>
                  <td style={{ padding: '10px 12px', color: 'var(--adm-text4)', fontSize: 12 }}>Schon ab 2 zahlenden Kunden profitabel</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Nächste Schritte */}
        <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(0,51,102,0.3) 0%, rgba(0,80,150,0.2) 100%)', border: '1px solid rgba(0,153,204,0.3)' }}>
          <h3 style={{ ...S.h3, color: '#60a5fa' }}>⚡ Nächste 5 Schritte — in dieser Reihenfolge</h3>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'AVV mit Supabase, Vercel und Anthropic abschließen (je 10 Minuten online)',
              'Supabase auf Pro upgraden + EU-Region sicherstellen',
              'Impressum, AGB, Datenschutzerklärung live schalten',
              'Staging-Umgebung mit eigenem Supabase-Projekt aufsetzen',
              'Uptime-Monitor + Sentry für Fehler-Tracking einrichten',
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--adm-text2)', lineHeight: 1.6 }}>
                <strong style={{ color: '#60a5fa' }}>#{i + 1}</strong> {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

    </div>
  )
}
