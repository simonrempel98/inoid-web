// Admin-only · kein i18n · nur Deutsch
import React from 'react'

export default function TechStackPage() {
  const S = {
    page: { fontFamily: 'Arial, sans-serif', color: 'var(--adm-text5)', paddingBottom: 100 } as React.CSSProperties,
    section: { marginBottom: 56 } as React.CSSProperties,
    h1: { fontSize: 28, fontWeight: 900, color: 'var(--adm-text)', margin: '0 0 6px', letterSpacing: '-0.02em' } as React.CSSProperties,
    h2: { fontSize: 20, fontWeight: 800, color: 'var(--adm-text)', margin: '0 0 16px' } as React.CSSProperties,
    h3: { fontSize: 15, fontWeight: 700, color: 'var(--adm-text)', margin: '0 0 10px' } as React.CSSProperties,
    h4: { fontSize: 13, fontWeight: 700, color: 'var(--adm-text2)', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
    card: { background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', padding: '20px', marginBottom: 16 } as React.CSSProperties,
    tag: { display: 'inline-block', background: 'var(--adm-border)', color: 'var(--adm-text2)', fontSize: 11, padding: '2px 8px', borderRadius: 4, marginRight: 4, marginBottom: 4 } as React.CSSProperties,
    mono: { fontFamily: "'Courier New', monospace", fontSize: 12, color: '#34d399' } as React.CSSProperties,
    label: { fontSize: 11, color: 'var(--adm-text3)', display: 'block', marginBottom: 2 } as React.CSSProperties,
    val: { fontSize: 13, color: 'var(--adm-text5)' } as React.CSSProperties,
    p: { fontSize: 13, color: 'var(--adm-text2)', lineHeight: 1.7, margin: '0 0 10px' } as React.CSSProperties,
    divider: { borderTop: '1px solid var(--adm-border)', margin: '40px 0' } as React.CSSProperties,
    anchor: { display: 'block', position: 'relative' as const, top: -80 },
    badge: (color: string, bg: string) => ({ display: 'inline-block', background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, marginRight: 6, marginBottom: 6, fontFamily: "'Courier New', monospace" } as React.CSSProperties),
  }

  const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
    GET:    { bg: '#064e3b', color: '#34d399' },
    POST:   { bg: '#1e3a5f', color: '#60a5fa' },
    PATCH:  { bg: '#2a1f00', color: '#fbbf24' },
    PUT:    { bg: '#2d1b69', color: '#a78bfa' },
    DELETE: { bg: '#450a0a', color: '#f87171' },
  }

  function method(m: string) {
    const c = METHOD_COLORS[m] ?? { bg: 'var(--adm-border)', color: 'var(--adm-text2)' }
    return <span style={{ ...S.badge(c.color, c.bg), fontSize: 10, letterSpacing: '0.05em' }}>{m}</span>
  }

  function reqRow(id: string, req: string, impl: string, status: 'erfüllt' | 'teilweise' | 'geplant') {
    const sc = status === 'erfüllt' ? '#34d399' : status === 'teilweise' ? '#fbbf24' : '#6b7280'
    const sb = status === 'erfüllt' ? '#052e16' : status === 'teilweise' ? '#2a1f00' : '#1f2937'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 80px', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--adm-border)', alignItems: 'start' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace" }}>{id}</span>
        <span style={{ fontSize: 13, color: 'var(--adm-text2)', lineHeight: 1.5 }}>{req}</span>
        <span style={{ fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{impl}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: sc, background: sb, padding: '2px 8px', borderRadius: 20, textAlign: 'center' as const, whiteSpace: 'nowrap' as const }}>{status}</span>
      </div>
    )
  }

  function apiBlock(methods: string[], path: string, desc: string, details: { req?: string; res?: string; auth?: string; notes?: string }) {
    return (
      <div style={{ background: 'var(--adm-bg)', borderRadius: 10, border: '1px solid var(--adm-border)', padding: '14px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <div style={{ display: 'flex', gap: 4 }}>{methods.map(m => <span key={m}>{method(m)}</span>)}</div>
          <span style={{ ...S.mono, fontSize: 13 }}>{path}</span>
        </div>
        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--adm-text)', fontWeight: 600 }}>{desc}</p>
        {details.req && <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--adm-text3)' }}><span style={{ color: 'var(--adm-text4)', fontWeight: 700 }}>Request: </span>{details.req}</p>}
        {details.res && <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--adm-text3)' }}><span style={{ color: 'var(--adm-text4)', fontWeight: 700 }}>Response: </span>{details.res}</p>}
        {details.auth && <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--adm-text3)' }}><span style={{ color: 'var(--adm-text4)', fontWeight: 700 }}>Auth: </span>{details.auth}</p>}
        {details.notes && <p style={{ margin: '0', fontSize: 12, color: 'var(--adm-text4)', fontStyle: 'italic' }}>{details.notes}</p>}
      </div>
    )
  }

  function infoBox(color: string, bg: string, title: string, content: string) {
    return (
      <div style={{ borderLeft: `3px solid ${color}`, background: bg, borderRadius: '0 8px 8px 0', padding: '12px 16px', marginBottom: 12 }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color }}>{title}</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.6 }}>{content}</p>
      </div>
    )
  }

  const tocItems = [
    { id: 'overview', label: '1. Was ist INOid?' },
    { id: 'architektur', label: '2. Architektur im Überblick' },
    { id: 'frontend', label: '3. Frontend' },
    { id: 'backend', label: '4. Backend & API' },
    { id: 'datenbank', label: '5. Datenbank' },
    { id: 'api-referenz', label: '6. API-Referenz (alle Endpunkte)' },
    { id: 'auth', label: '7. Authentifizierung & Rollen' },
    { id: 'storage', label: '8. Dateispeicherung' },
    { id: 'module', label: '9. App-Module' },
    { id: 'deployment', label: '10. Deployment & Infrastruktur' },
    { id: 'abhaengigkeiten', label: '11. Abhängigkeiten' },
    { id: 'lastenheft', label: '12. Lastenheft (Anforderungen)' },
    { id: 'pflichtenheft', label: '13. Pflichtenheft (Umsetzung)' },
  ]

  return (
    <div style={S.page}>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40, paddingBottom: 28, borderBottom: '1px solid var(--adm-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ background: '#0099cc', width: 10, height: 10, borderRadius: '50%' }} />
          <span style={{ fontSize: 11, color: '#0099cc', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            INOid.app · Technische Dokumentation
          </span>
        </div>
        <h1 style={S.h1}>Tech Stack & Systemdokumentation</h1>
        <p style={{ fontSize: 14, color: 'var(--adm-text3)', margin: '0 0 16px', lineHeight: 1.6 }}>
          Vollständige Projektdokumentation · Stand: April 2026 · Version 1.x<br />
          Diese Dokumentation richtet sich an Entwickler und Nicht-Entwickler gleichermaßen. Jeder Bereich wird so erklärt, dass auch Softwareanfänger die Zusammenhänge verstehen.
        </p>
        <div>
          {[['Next.js 16', '#003366', '#1e3a5f'], ['React 19', '#0e7490', '#0c3a4a'], ['TypeScript 5', '#1d4ed8', '#1e2d5e'], ['Supabase', '#166534', '#052e16'], ['Vercel', '#374151', '#1f2937'], ['next-intl 4', '#7c3aed', '#2d1b69']].map(([l, c, b]) => (
            <span key={l} style={S.badge(c as string, b as string)}>{l}</span>
          ))}
        </div>
      </div>

      {/* ── Inhaltsverzeichnis ──────────────────────────────────── */}
      <div style={{ ...S.card, marginBottom: 48 }}>
        <h2 style={{ ...S.h3, marginBottom: 16, fontSize: 16 }}>Inhaltsverzeichnis</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
          {tocItems.map(item => (
            <a key={item.id} href={`#${item.id}`} style={{ fontSize: 13, color: '#0099cc', textDecoration: 'none', padding: '4px 0', display: 'block', borderBottom: '1px solid var(--adm-border)' }}>
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. WAS IST INOID */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="overview" style={S.anchor} />
        <h2 style={S.h2}>1. Was ist INOid?</h2>
        <div style={S.card}>
          <p style={S.p}>
            <strong style={{ color: 'var(--adm-text)' }}>INOid ist eine webbasierte Asset-Management-Plattform</strong> für die INOMETA GmbH. Sie hilft Unternehmen dabei, ihre physischen Gegenstände (Maschinen, Geräte, Werkzeuge usw.) – sogenannte <em>Assets</em> – digital zu erfassen, zu verwalten und zu dokumentieren.
          </p>
          <p style={S.p}>
            <strong style={{ color: 'var(--adm-text)' }}>Was ist ein Asset?</strong> Ein Asset ist jedes Objekt, das ein Unternehmen besitzt und das verwaltet werden soll: eine CNC-Maschine, ein Gabelstapler, ein Laptop, eine Messvorrichtung usw.
          </p>
          <p style={S.p}>
            <strong style={{ color: 'var(--adm-text)' }}>Was kann INOid?</strong> Jedes Asset bekommt eine digitale Akte: Fotos, Dokumente, Seriennummer, QR-Code, Standort. Techniker können Serviceeinträge schreiben (was wurde wann gemacht?), Wartungsintervalle festlegen (wann muss was gewartet werden?) und untereinander im Team-Chat kommunizieren.
          </p>
          <p style={S.p}>
            <strong style={{ color: 'var(--adm-text)' }}>Multi-Tenant SaaS:</strong> Die Plattform unterstützt mehrere Firmen (Organisationen) gleichzeitig. Jede Firma sieht nur ihre eigenen Daten. Das nennt man „Multi-Tenant" – ein System, viele unabhängige Kunden.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
            {[
              { title: 'Kernfunktionen', color: '#0099cc', items: ['Assets anlegen, bearbeiten, löschen', 'QR-Code & NFC-Tag je Asset', 'Bildupload (automatisch komprimiert)', 'Dokument-Upload (PDF, Word, etc.)', 'Standort-Hierarchie (3 Ebenen)', 'Serviceheft (Wartungshistorie)', 'Wartungsintervalle & Erinnerungen'] },
              { title: 'Verwaltung', color: '#a78bfa', items: ['Team-Verwaltung & Rollensystem', 'Team-Chat (Echtzeit)', 'Einladungslinks für neue Nutzer', 'Passwort-Verwaltung', 'Profil & Einstellungen', 'Billing & Pläne', 'Org-Struktur (Standorte, Hallen, Bereiche)'] },
              { title: 'Admin-Panel', color: '#34d399', items: ['Plattform-Verwaltung', 'Organisationen anlegen/löschen', 'Nutzer verwalten', 'Storage-Übersicht & Cleanup', 'Audit-Log', 'PIN-geschützte Aktionen', 'Systemstatus & Statistiken'] },
            ].map(sec => (
              <div key={sec.title} style={{ background: 'var(--adm-bg)', borderRadius: 10, padding: '14px', border: '1px solid var(--adm-border)' }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: sec.color }}>{sec.title}</p>
                {sec.items.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: sec.color, flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: 12, color: 'var(--adm-text2)', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. ARCHITEKTUR */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="architektur" style={S.anchor} />
        <h2 style={S.h2}>2. Architektur im Überblick</h2>
        <div style={S.card}>
          <p style={S.p}>
            <strong style={{ color: 'var(--adm-text)' }}>Was ist Architektur?</strong> In der Softwareentwicklung beschreibt „Architektur", wie die verschiedenen Teile eines Systems zusammenarbeiten. Bei INOid gibt es drei Hauptbereiche: den Browser des Nutzers (Frontend), den Server (Backend) und die Datenbank.
          </p>
          {infoBox('#0099cc', 'var(--adm-accent-bg)', 'Wie ein Besuch auf der Website funktioniert', 'Der Nutzer öffnet den Browser → der Browser lädt die App von Vercel (Frontend) → die App fragt bei Supabase nach Daten (Backend/Datenbank) → Supabase prüft, ob der Nutzer berechtigt ist → Daten werden zurückgegeben → die App zeigt sie an.')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 8 }}>
            {[
              { title: 'Frontend (Browser)', color: '#0099cc', bg: 'var(--adm-accent-bg)', items: ['Next.js rendert die HTML-Seiten', 'React zeigt interaktive UI-Elemente', 'Supabase JS sendet Anfragen an die DB', 'Läuft auf Vercel (Edge Network)'] },
              { title: 'Backend (Server)', color: '#a78bfa', bg: '#1a1040', items: ['Next.js Route Handlers = API', 'Verarbeiten Formulare & Uploads', 'Prüfen Berechtigungen server-seitig', 'Kommunizieren mit externen Diensten (E-Mail, etc.)'] },
              { title: 'Datenbank & Storage', color: '#34d399', bg: '#052e16', items: ['Supabase PostgreSQL speichert alle Daten', 'Row Level Security (RLS) sichert Daten', 'Supabase Storage speichert Dateien/Bilder', 'Supabase Auth verwaltet Benutzerkonten'] },
            ].map(sec => (
              <div key={sec.title} style={{ background: sec.bg, borderRadius: 10, padding: '14px', border: `1px solid ${sec.color}33` }}>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: sec.color }}>{sec.title}</p>
                {sec.items.map(item => (
                  <div key={item} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: sec.color, flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: 12, color: 'var(--adm-text2)', lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <h3 style={S.h3}>Datenfluss: Beispiel „Asset anlegen"</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {['Nutzer füllt Formular aus', '→', 'Browser komprimiert Bilder (Canvas API)', '→', 'POST /api/assets', '→', 'Server prüft Auth & Limits', '→', 'Bild → Supabase Storage', '→', 'Metadaten → PostgreSQL', '→', 'Seite aktualisiert sich'].map((step, i) => (
                <span key={i} style={{ fontSize: 12, color: step === '→' ? 'var(--adm-text4)' : 'var(--adm-text2)', background: step === '→' ? 'transparent' : 'var(--adm-bg)', border: step === '→' ? 'none' : '1px solid var(--adm-border)', padding: step === '→' ? '0' : '4px 10px', borderRadius: 6 }}>{step}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 3. FRONTEND */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="frontend" style={S.anchor} />
        <h2 style={S.h2}>3. Frontend</h2>
        <p style={S.p}>Das Frontend ist alles, was der Nutzer im Browser sieht und mit dem er interagiert. Es besteht aus HTML (Struktur), CSS (Aussehen) und JavaScript (Verhalten).</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <h3 style={S.h3}>Next.js – Das Grundgerüst</h3>
            <p style={S.p}>Next.js ist ein Framework auf Basis von React. Es erweitert React um wichtige Features, die für eine produktive Web-App nötig sind.</p>
            <p style={{ ...S.p, fontWeight: 700, color: 'var(--adm-text)' }}>Was macht Next.js konkret bei INOid?</p>
            {[
              ['App Router', 'Jede URL (/assets, /teams, /admin) entspricht einem Ordner in src/app/. Next.js weiß automatisch, welche Datei für welche URL zuständig ist.'],
              ['Server Components', 'Seiten wie die Asset-Liste werden auf dem Server vorberechnet. Der Browser bekommt fertiges HTML – das ist schneller und sicherer.'],
              ['Client Components', 'Formulare, Buttons, Dropdown-Menüs – alles Interaktive läuft als Client Component im Browser. Erkennbar am "use client" am Anfang der Datei.'],
              ['Route Handlers', 'Dateien namens route.ts in src/app/api/ sind API-Endpunkte. Wenn die App Daten senden/empfangen muss (z.B. Bild hochladen), geht das über diese Endpunkte.'],
              ['Middleware', 'Läuft vor jeder Anfrage und prüft z.B. ob der Nutzer eingeloggt ist. Falls nicht, wird er zur Login-Seite weitergeleitet.'],
            ].map(([t, d]) => (
              <div key={t as string} style={{ marginBottom: 10 }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--adm-text)' }}>{t as string}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{d as string}</p>
              </div>
            ))}
          </div>
          <div>
            <div style={S.card}>
              <h3 style={S.h3}>React 19 – Die Oberfläche</h3>
              <p style={S.p}>React ist die Bibliothek, die UI-Komponenten (wiederverwendbare Bausteine) erstellt. Eine Komponente ist eine Funktion, die HTML zurückgibt.</p>
              <p style={S.p}><strong style={{ color: 'var(--adm-text)' }}>Beispiel:</strong> Die Asset-Karte, die in der Liste angezeigt wird, ist eine Komponente. Sie bekommt Daten rein (Name, Status, Bild) und gibt HTML raus.</p>
              <p style={S.p}><strong style={{ color: 'var(--adm-text)' }}>useState & useEffect:</strong> React-Hooks erlauben es, dass Komponenten Zustand haben (z.B. „ist das Formular gerade abgeschickt?") und auf Ereignisse reagieren.</p>
            </div>
            <div style={S.card}>
              <h3 style={S.h3}>Styling – Inline Styles</h3>
              <p style={S.p}>INOid verwendet <strong style={{ color: 'var(--adm-text)' }}>ausschließlich Inline Styles</strong> (kein Tailwind, kein CSS-Module). Jedes Element bekommt seine Styles direkt als JavaScript-Objekt übergeben.</p>
              <p style={S.p}><strong style={{ color: 'var(--adm-text)' }}>Warum?</strong> Keine Build-Abhängigkeiten, kein CSS-Purging, volle TypeScript-Typprüfung der Style-Werte. Dark/Light Mode läuft über CSS Custom Properties (<span style={S.mono}>var(--adm-bg)</span>).</p>
            </div>
            <div style={S.card}>
              <h3 style={S.h3}>Internationalisierung (i18n)</h3>
              <p style={S.p}><strong style={{ color: 'var(--adm-text)' }}>next-intl</strong> übersetzt die App in 28 Sprachen. Übersetzungstexte liegen in JSON-Dateien unter <span style={S.mono}>messages/de.json</span>, <span style={S.mono}>messages/en.json</span> usw. Die Sprache wird automatisch aus dem Browser erkannt.</p>
              <p style={S.p}>Server-Komponenten rufen <span style={S.mono}>getTranslations()</span> auf, Client-Komponenten <span style={S.mono}>useTranslations()</span>. Das Admin-Panel ist bewusst nicht übersetzt (Deutsch only).</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 4. BACKEND */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="backend" style={S.anchor} />
        <h2 style={S.h2}>4. Backend & API</h2>
        <p style={S.p}>Das Backend ist der Teil der App, der nicht im Browser läuft, sondern auf einem Server. Bei INOid übernimmt Next.js auch diese Rolle – es gibt keinen separaten Backend-Server.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <h3 style={S.h3}>Was ist ein API-Endpunkt?</h3>
            <p style={S.p}>Eine API (Application Programming Interface) ist eine Schnittstelle – eine Art Schalter, den man betätigen kann, um etwas zu tun oder Daten zu bekommen.</p>
            <p style={S.p}>Beispiel: Wenn ein Nutzer ein Asset löscht, schickt der Browser eine Anfrage an <span style={S.mono}>/api/assets/[id]/delete</span>. Der Server prüft, ob er darf, löscht das Bild aus Storage und das Asset aus der DB.</p>
            {infoBox('#fbbf24', '#2a1f00', 'HTTP-Methoden erklärt', 'GET = Daten abrufen (nichts wird verändert). POST = Etwas neu erstellen. PATCH = Etwas teilweise ändern. PUT = Etwas komplett ersetzen. DELETE = Etwas löschen.')}
          </div>
          <div style={S.card}>
            <h3 style={S.h3}>Supabase Client vs. Admin Client</h3>
            <p style={S.p}>INOid hat zwei verschiedene Supabase-Clients:</p>
            {[
              ['Normaler Client (SSR)', 'src/lib/supabase/server.ts oder client.ts', 'Läuft mit den Rechten des eingeloggten Nutzers. Row Level Security (RLS) ist aktiv – der Nutzer sieht nur seine Org-Daten.'],
              ['Admin Client (Service Role)', 'src/lib/supabase/admin.ts', 'Läuft mit vollen DB-Rechten, umgeht RLS. Wird NUR in API-Endpunkten verwendet, die von Platform-Admins aufgerufen werden. Der Key niemals an den Browser weitergeben!'],
            ].map(([t, path, d]) => (
              <div key={t as string} style={{ background: 'var(--adm-bg)', borderRadius: 8, padding: '12px', marginBottom: 10, border: '1px solid var(--adm-border)' }}>
                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: 'var(--adm-text)' }}>{t as string}</p>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#34d399', fontFamily: "'Courier New', monospace" }}>{path as string}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{d as string}</p>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>Wo läuft welcher Code?</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { where: 'Browser (Client)', color: '#60a5fa', bg: '#1e3a5f', examples: ['Formular-Inputs', 'Buttons & Klicks', 'Bildkomprimierung', 'QR-Code-Scanner', 'Supabase Realtime (Chat)', 'Dark/Light-Toggle'] },
              { where: 'Server (Next.js)', color: '#34d399', bg: '#052e16', examples: ['Seiten vorab rendern', 'Auth-Check in Layouts', 'Daten für Seite laden', 'Admin-Panel Daten'] },
              { where: 'API Routes (/api/…)', color: '#fbbf24', bg: '#2a1f00', examples: ['Assets löschen', 'Org anlegen', 'Bilder hochladen', 'E-Mails senden', 'PIN prüfen', 'Storage leeren'] },
              { where: 'Supabase (extern)', color: '#a78bfa', bg: '#2d1b69', examples: ['Daten speichern & laden', 'Auth (Login/Logout)', 'Dateien speichern', 'Echtzeit-Updates', 'Datenbankfunktionen'] },
            ].map(sec => (
              <div key={sec.where} style={{ background: sec.bg, borderRadius: 10, padding: '12px', border: `1px solid ${sec.color}33` }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: sec.color }}>{sec.where}</p>
                {sec.examples.map(e => <div key={e} style={{ fontSize: 11, color: 'var(--adm-text2)', marginBottom: 3 }}>· {e}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 5. DATENBANK */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="datenbank" style={S.anchor} />
        <h2 style={S.h2}>5. Datenbank</h2>
        <p style={S.p}>Die Datenbank ist das Herzstück der Anwendung – hier werden alle Daten dauerhaft gespeichert. INOid verwendet <strong style={{ color: 'var(--adm-text)' }}>PostgreSQL über Supabase</strong>.</p>
        {infoBox('#0099cc', 'var(--adm-accent-bg)', 'Was ist PostgreSQL?', 'PostgreSQL ist eine professionelle, relationale Datenbank. „Relational" bedeutet: Daten werden in Tabellen gespeichert (ähnlich wie Excel), und Tabellen können miteinander verknüpft werden. Beispiel: Assets gehören zu einer Organisation – das ist eine Verknüpfung.')}
        <div style={S.card}>
          <h3 style={S.h3}>Row Level Security (RLS) – Datensicherheit</h3>
          <p style={S.p}><strong style={{ color: 'var(--adm-text)' }}>RLS ist das wichtigste Sicherheitsmerkmal.</strong> Es stellt sicher, dass Firma A niemals Daten von Firma B sehen kann – auch wenn beide dieselbe Datenbank nutzen.</p>
          <p style={S.p}>RLS-Regeln werden direkt in der Datenbank definiert. Beispiel: „Ein Nutzer darf nur Assets lesen, deren organization_id mit seiner eigenen übereinstimmt." Diese Regel gilt, egal wie der Nutzer auf die Datenbank zugreift.</p>
        </div>
        <h3 style={{ ...S.h3, marginBottom: 12 }}>Alle Tabellen im Überblick</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            {
              table: 'organizations', color: '#0099cc',
              desc: 'Eine Firma/Tenant im System. Jede Org hat eigene Nutzer, Assets, Einstellungen und Dateien.',
              cols: ['id (UUID)', 'name, slug', 'plan (free/starter/pro/enterprise)', 'asset_limit, user_limit', 'is_active, contact_email', 'features (JSONB)', 'settings (JSONB)', 'created_at'],
            },
            {
              table: 'profiles', color: '#a78bfa',
              desc: 'Erweiterung des Supabase-Auth-Users. Jeder eingeloggte Nutzer hat ein Profil.',
              cols: ['id → auth.users (UUID)', 'organization_id → orgs', 'email, full_name', 'app_role (superadmin/admin/techniker/leser)', 'is_platform_admin (boolean)', 'is_active, must_change_password', 'last_seen_at, admin_pin_hash'],
            },
            {
              table: 'assets', color: '#34d399',
              desc: 'Die zentrale Tabelle – jedes Asset der Kunden. Soft-Delete via deleted_at.',
              cols: ['id, organization_id', 'name, category, status', 'manufacturer, serial_number, article_number', 'location, location_ref', 'image_urls[], document_urls[]', 'technical_data, commercial_data (JSONB)', 'qr_code, nfc_uid', 'deleted_at (Soft-Delete)'],
            },
            {
              table: 'asset_lifecycle_events', color: '#fbbf24',
              desc: 'Serviceeinträge/Wartungshistorie zu einem Asset (früher: service_entries).',
              cols: ['id, asset_id, organization_id', 'event_type, title, description', 'event_date, performed_by', 'external_company, cost', 'checklist (JSONB)', 'created_by'],
            },
            {
              table: 'maintenance_schedules', color: '#f87171',
              desc: 'Wiederkehrende Wartungsintervalle für ein Asset.',
              cols: ['id, asset_id, organization_id', 'name, interval_days', 'next_due, last_done (date)', 'steps (JSONB)', 'is_active'],
            },
            {
              table: 'locations / halls / areas', color: '#38bdf8',
              desc: '3-stufige Standorthierarchie: Standort → Halle → Bereich.',
              cols: ['Standort: id, org_id, name, address', 'Halle: id, org_id, name, location_id', 'Bereich: id, org_id, name, hall_id', 'Jeweils mit FK-Kaskade (CASCADE DELETE)'],
            },
            {
              table: 'organization_members', color: '#818cf8',
              desc: 'Verbindet Nutzer mit Organisationen und weist Rollen zu.',
              cols: ['id, organization_id', 'user_id → auth.users', 'email (für Einladungsflow)', 'role_id → roles', 'created_at'],
            },
            {
              table: 'chat_messages', color: '#0099cc',
              desc: 'Nachrichten im Team-Chat. Automatisch gelöscht nach 30 Tagen.',
              cols: ['id, organization_id, user_id', 'sender_name, sender_role (denormalisiert)', 'content (max. 2000 Zeichen)', 'asset_mentions (UUID[])', 'created_at'],
            },
            {
              table: 'invoices', color: '#4ade80',
              desc: 'Rechnungen und Einmalcodes für Plan-Upgrades.',
              cols: ['id, organization_id', 'amount, plan, status', 'invoice_number, pdf_url', 'code_hash (HMAC-SHA256)', 'activated_at, created_at'],
            },
            {
              table: 'admin_audit_log', color: '#94a3b8',
              desc: 'Protokolliert alle Admin-Aktionen (wer hat was wann getan).',
              cols: ['id, admin_id', 'action, target_type, target_id', 'details (JSONB)', 'created_at'],
            },
          ].map(t => (
            <div key={t.table} style={{ background: 'var(--adm-bg)', borderRadius: 10, border: `1px solid ${t.color}33`, padding: '14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: t.color, fontFamily: "'Courier New', monospace" }}>{t.table}</p>
              <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.4 }}>{t.desc}</p>
              {t.cols.map(col => (
                <div key={col} style={{ fontSize: 11, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace", marginBottom: 2 }}>
                  <span style={{ color: 'var(--adm-text4)' }}>· </span>{col}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ ...S.card, marginTop: 16 }}>
          <h3 style={S.h3}>PostgreSQL-Funktionen (serverseitige Logik)</h3>
          <p style={S.p}>Manche Berechnungen laufen direkt in der Datenbank als Funktionen – das ist schneller als alles in JavaScript zu rechnen.</p>
          {[
            ['admin_get_storage_bucket_stats()', 'Zählt Dateien und Gesamtgröße in jedem Storage-Bucket.'],
            ['admin_get_org_storage_stats()', 'Berechnet Speicherverbrauch pro Organisation (Bilder + Dokumente getrennt).'],
            ['cleanup_soft_deleted_assets()', 'Hard-Deletet alle soft-gelöschten Assets (deleted_at IS NOT NULL) inklusive aller zugehörigen Daten.'],
            ['admin_get_unattributed_storage()', 'Findet Dateien im Storage, die keinem Asset mehr zugeordnet sind (verwaiste Dateien).'],
            ['cleanup_old_chat_messages()', 'Löscht Chat-Nachrichten älter als 30 Tage. Wird täglich um 03:00 UTC automatisch via pg_cron ausgeführt.'],
          ].map(([name, desc]) => (
            <div key={name as string} style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--adm-border)', alignItems: 'start' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399', fontFamily: "'Courier New', monospace" }}>{name as string}</span>
              <span style={{ fontSize: 12, color: 'var(--adm-text2)' }}>{desc as string}</span>
            </div>
          ))}
        </div>
        <div style={{ ...S.card, marginTop: 4 }}>
          <h3 style={S.h3}>Migrationen – Die DB-Geschichte</h3>
          <p style={S.p}>Jede Änderung an der Datenbankstruktur wird als „Migration" gespeichert – eine SQL-Datei mit fortlaufender Nummer. So kann die DB jederzeit auf einen bestimmten Stand gebracht werden.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 16px' }}>
            {[
              ['001', 'Kernschema: organizations, profiles, assets, service_entries, roles, members'],
              ['002', 'Asset-Vorlagen (templates) für Kategorien'],
              ['003', 'Standortstruktur: locations, halls, areas'],
              ['004', 'Org-Details: asset_limit, user_limit, is_active, contact_email'],
              ['005', 'Storage RLS-Policies für org-files Bucket'],
              ['006-007', 'Teams-Modul: teams, team_members mit Org-Referenz'],
              ['008', 'organization_members.email für Einladungsflow'],
              ['009', 'Wartungsintervalle: maintenance_schedules mit steps JSONB'],
              ['010', 'Rechnungsmodul: invoices mit HMAC-Code'],
              ['011', 'service_entries: checklist JSONB hinzugefügt'],
              ['012', 'Admin-Modul: admin_audit_log, platform_admin_settings'],
              ['013', 'cleanup_soft_deleted_assets() Funktion'],
              ['014', 'profiles.app_role (superadmin/admin/techniker/leser), asset_lifecycle_events'],
              ['015', 'organizations.features JSONB (Modul-Toggles)'],
              ['016', 'Storage-Statistik-Funktionen'],
              ['017', 'Admin-PIN: admin_pin_hash in profiles'],
              ['018-020', 'Storage-Stats erweitert, Dokument-Zählung korrigiert, detaillierte Attribution'],
              ['021', 'Team-Chat: chat_messages, Realtime, pg_cron Cleanup-Job'],
            ].map(([id, desc]) => (
              <React.Fragment key={id as string}>
                <span style={{ fontSize: 11, fontFamily: "'Courier New', monospace", color: '#34d399' }}>{id as string}</span>
                <span style={{ fontSize: 12, color: 'var(--adm-text3)' }}>{desc as string}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 6. API-REFERENZ */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="api-referenz" style={S.anchor} />
        <h2 style={S.h2}>6. API-Referenz</h2>
        <p style={S.p}>Alle API-Endpunkte (Route Handlers) der App. Alle Endpunkte prüfen serverseitig die Authentifizierung.</p>

        <h3 style={{ ...S.h3, marginBottom: 12 }}>Admin-Endpunkte (nur Platform Admins)</h3>
        {apiBlock(['POST'], '/api/admin/orgs', 'Neue Organisation anlegen',
          { req: 'name, slug, plan, assetLimit, userLimit, email, fullName, tempPassword', res: '{ orgId, userId }', auth: 'is_platform_admin = true', notes: 'Legt Org, Auth-User und Profil in einer Transaktion an. Sendet Willkommens-E-Mail via Resend.' })}
        {apiBlock(['PATCH'], '/api/admin/orgs/[id]', 'Organisation bearbeiten (partial update)',
          { req: 'name?, plan?, assetLimit?, userLimit?, isActive?, contactEmail?, notes?, features?, settings?', res: '{ ok: true }', auth: 'is_platform_admin', notes: 'Akzeptiert beliebige Teilmenge der Felder. Unbekannte Felder werden ignoriert.' })}
        {apiBlock(['DELETE'], '/api/admin/orgs/[id]', 'Organisation vollständig löschen',
          { res: '{ ok: true }', auth: 'is_platform_admin + Admin-PIN bestätigt', notes: 'Löscht Org + alle Nutzer (Auth) + alle Storage-Dateien + alle DB-Einträge. Nicht umkehrbar!' })}
        {apiBlock(['POST'], '/api/admin/orgs/[id]/users', 'Neuen Nutzer zu Org hinzufügen',
          { req: 'email, fullName, tempPassword, appRole', res: '{ userId }', auth: 'is_platform_admin', notes: 'Erstellt Auth-User + Profil + organization_members Eintrag.' })}
        {apiBlock(['POST'], '/api/admin/team', 'Platform-Admin anlegen',
          { req: 'email, fullName, tempPassword', res: '{ userId }', auth: 'is_platform_admin' })}
        {apiBlock(['DELETE'], '/api/admin/team/[id]', 'Platform-Admin entfernen',
          { auth: 'is_platform_admin + darf sich nicht selbst entfernen' })}
        {apiBlock(['POST'], '/api/admin/users/[id]', 'User-Aktion ausführen',
          { req: 'action: "reset_password" | "toggle_active" | "force_pw_change", password? (bei reset)', auth: 'is_platform_admin' })}
        {apiBlock(['POST'], '/api/admin/cleanup', 'Soft-gelöschte Assets hard-deleten',
          { res: '{ assetsDeleted, filesDeleted }', auth: 'is_platform_admin', notes: 'Ruft cleanup_soft_deleted_assets() auf und löscht anschließend Storage-Dateien.' })}
        {apiBlock(['POST'], '/api/admin/pin', 'Admin-PIN verifizieren',
          { req: 'pin: string', res: '{ valid: boolean }', auth: 'is_platform_admin', notes: 'Vergleicht SHA-256-Hash des übergebenen PINs mit gespeichertem Hash in profiles.' })}
        {apiBlock(['PUT'], '/api/admin/pin', 'Admin-PIN ändern',
          { req: 'currentPin? (bei erstem Setzen leer), newPin (mind. 4-stellig)', auth: 'is_platform_admin' })}
        {apiBlock(['DELETE'], '/api/admin/storage/nuke', 'Alle Dateien aus allen Buckets löschen',
          { res: '{ deleted: { "asset-images": n, "org-files": n, "service-files": n } }', auth: 'is_platform_admin + Admin-PIN', notes: 'Gefährlich! Löscht ALLE Dateien aller Orgs unwiderruflich.' })}
        {apiBlock(['DELETE'], '/api/admin/storage/orgs/[orgId]', 'Alle Dateien einer Org löschen',
          { res: '{ deleted: n }', auth: 'is_platform_admin + Org-Name-Bestätigung + Admin-PIN' })}
        {apiBlock(['DELETE'], '/api/admin/storage/orphaned', 'Verwaiste Dateien löschen',
          { res: '{ deleted: n }', auth: 'is_platform_admin + Admin-PIN', notes: 'Ruft admin_get_unattributed_storage() auf und löscht alle zurückgegebenen Dateien.' })}

        <h3 style={{ ...S.h3, marginBottom: 12, marginTop: 24 }}>Nutzer-Endpunkte (eingeloggte Org-Nutzer)</h3>
        {apiBlock(['DELETE'], '/api/assets/[id]/delete', 'Asset hard-deleten',
          { auth: 'Eingeloggter Nutzer, gleiche Org wie Asset', notes: 'Löscht Asset-Eintrag + alle Bilder aus asset-images + alle Dokumente aus org-files. Auch lifecycle_events, maintenance_schedules werden kaskadiert gelöscht.' })}
        {apiBlock(['GET', 'POST'], '/api/chat/messages', 'Team-Chat Nachrichten',
          { req: '(GET) /api/chat/messages?org_id=…&limit=200 | (POST) { content, orgId, assetMentions[] }', res: '(GET) Message-Array | (POST) { id }', auth: 'Eingeloggter Nutzer, gleiche Org', notes: 'GET führt Lazy-Cleanup aus (löscht Nachrichten >30 Tage). POST prüft Feature-Toggle teamchat.' })}
        {apiBlock(['POST'], '/api/billing/create-invoice', 'Rechnung erstellen & versenden',
          { req: 'plan, billingName, billingAddress, billingCity, billingZip, billingCountry, vatId?', res: '{ invoiceId, invoiceNumber }', auth: 'Eingeloggter Admin/Superadmin der Org', notes: 'Generiert PDF via pdf-lib, lädt es in Supabase Storage, sendet E-Mail mit Rechnung via Resend. Erstellt invoice-Eintrag mit HMAC-Code-Hash.' })}
        {apiBlock(['POST'], '/api/billing/activate-code', 'Einmalcode einlösen → Plan upgraden',
          { req: 'code: string (9 Stellen)', res: '{ plan, activatedAt }', auth: 'Eingeloggter Admin/Superadmin', notes: 'Prüft HMAC-SHA256-Hash des Codes gegen alle offenen Rechnungen der Org. Bei Match: Plan wird geändert + Rechnung als bezahlt markiert.' })}
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 7. AUTH */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="auth" style={S.anchor} />
        <h2 style={S.h2}>7. Authentifizierung & Rollen</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <h3 style={S.h3}>Login-Flow</h3>
            {[
              ['1.', 'Nutzer gibt E-Mail + Passwort ein'],
              ['2.', 'Supabase Auth prüft Credentials und gibt ein JWT zurück'],
              ['3.', 'JWT wird als Cookie gespeichert (@supabase/ssr)'],
              ['4.', 'Bei jeder Seite liest die Middleware das Cookie'],
              ['5.', 'Supabase erneuert das Token automatisch (Refresh Token)'],
              ['6.', 'Bei Logout: Cookie wird gelöscht, Redirect zu /login'],
            ].map(([n, t]) => (
              <div key={n as string} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0099cc', flexShrink: 0, minWidth: 20 }}>{n as string}</span>
                <span style={{ fontSize: 12, color: 'var(--adm-text2)' }}>{t as string}</span>
              </div>
            ))}
            {infoBox('#fbbf24', '#2a1f00', 'JWT erklärt', 'Ein JWT (JSON Web Token) ist ein verschlüsseltes Ticket. Es enthält: Wer bist du? Wann läuft es ab? Und eine Signatur, die beweist, dass es von Supabase stammt.')}
          </div>
          <div style={S.card}>
            <h3 style={S.h3}>Rollen & Berechtigungen</h3>
            <p style={S.p}>Jeder Nutzer hat eine <span style={S.mono}>app_role</span> in der profiles-Tabelle. Die Logik, was welche Rolle darf, ist in <span style={S.mono}>src/lib/permissions.ts</span> definiert.</p>
            {[
              { role: 'superadmin', color: '#7c3aed', label: 'Superadmin', rights: 'Vollzugriff auf alles in der Org inkl. Rollenvergabe und Einstellungen' },
              { role: 'admin', color: '#b45309', label: 'Admin', rights: 'Wie Superadmin, aber kann keine Superadmins ernennen' },
              { role: 'techniker', color: '#475569', label: 'Techniker', rights: 'Assets und Serviceeinträge bearbeiten, keine Einstellungen' },
              { role: 'leser', color: '#92400e', label: 'Leser', rights: 'Nur lesen, nichts schreiben oder löschen' },
              { role: 'is_platform_admin', color: '#0099cc', label: 'Platform Admin', rights: 'Zugriff auf Admin-Panel, kann Orgs und Nutzer verwalten' },
            ].map(r => (
              <div key={r.role} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: r.color, background: r.color + '22', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.4 }}>{r.rights}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>Admin-PIN – Zweite Sicherheitsebene</h3>
          <p style={S.p}>Besonders gefährliche Aktionen (Org löschen, Storage leeren) sind zusätzlich mit einem PIN geschützt. Der PIN wird als <strong style={{ color: 'var(--adm-text)' }}>SHA-256-Hash</strong> in der Datenbank gespeichert – niemals im Klartext.</p>
          <p style={S.p}><strong style={{ color: 'var(--adm-text)' }}>SHA-256 erklärt:</strong> Ein Hash-Algorithmus, der aus einem Text einen eindeutigen „Fingerabdruck" macht. Aus „1234" wird z.B. „03ac674…". Man kann nicht aus dem Hash zurück auf den PIN rechnen – auch wenn jemand die DB liest, kennt er den PIN nicht.</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 8. STORAGE */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="storage" style={S.anchor} />
        <h2 style={S.h2}>8. Dateispeicherung (Storage)</h2>
        <p style={S.p}>Dateien (Bilder, PDFs, Dokumente) werden nicht in der Datenbank gespeichert, sondern in <strong style={{ color: 'var(--adm-text)' }}>Supabase Storage</strong> – einem Cloud-Dateispeicher ähnlich wie Google Drive, aber für Apps.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          {[
            { bucket: 'asset-images', color: '#0099cc', path: 'assets/{assetId}/images/{timestamp}.jpg', desc: 'Alle Fotos von Assets. Werden client-seitig komprimiert (Canvas API) bevor Upload. Nur JPEG. Öffentlich lesbar.' },
            { bucket: 'org-files', color: '#a78bfa', path: 'assets/{assetId}/docs/{timestamp}_{name}', desc: 'Asset-Dokumente (PDF, Word, Excel, etc.). Max. 10 MB pro Datei (konfigurierbar). Öffentlich lesbar.' },
            { bucket: 'service-files', color: '#34d399', path: 'service/{assetId}/fotos/… · service/{assetId}/docs/…', desc: 'Anhänge aus dem Serviceheft (Fotos und Dokumente zu Serviceeinträgen). Öffentlich lesbar.' },
          ].map(b => (
            <div key={b.bucket} style={{ background: 'var(--adm-bg)', borderRadius: 10, border: `1px solid ${b.color}33`, padding: '14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: b.color, fontFamily: "'Courier New', monospace" }}>{b.bucket}</p>
              <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace" }}>{b.path}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{b.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <h3 style={S.h3}>Bildkomprimierung (client-seitig)</h3>
            <p style={S.p}>Bilder werden <strong style={{ color: 'var(--adm-text)' }}>bevor dem Upload</strong> im Browser komprimiert – spart Speicherplatz und macht Ladezeiten kürzer.</p>
            <p style={S.p}>Technisch: Das Bild wird in ein unsichtbares <span style={S.mono}>&lt;canvas&gt;</span>-Element gezeichnet und skaliert, dann als JPEG exportiert. Bilder unter 100 KB werden übersprungen.</p>
            {[
              ['Konfiguration', 'Pro Org in organizations.settings speicherbar'],
              ['image_max_dim', 'Maximale Seitenbreite/-höhe (default: 1920px)'],
              ['image_quality', 'JPEG-Qualität (default: 82%)'],
              ['Max. Bilder', '10 Bilder pro Asset'],
            ].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--adm-text4)' }}>{k as string}</span>
                <span style={{ fontSize: 12, color: 'var(--adm-text2)' }}>{v as string}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h3 style={S.h3}>Wichtige Eigenart: protect_delete Trigger</h3>
            <p style={S.p}>Supabase hat einen internen Trigger, der direktes SQL-DELETE auf <span style={S.mono}>storage.objects</span> blockiert. Dateien können <strong style={{ color: 'var(--adm-text)' }}>nur über die Storage-API</strong> gelöscht werden.</p>
            <p style={S.p}>Das bedeutet: Wenn ein Asset oder eine Org gelöscht wird, müssen wir in unserem API-Code explizit für jeden Dateipfad einen Storage-API-Aufruf machen. Kaskadierende DB-Deletes reichen nicht.</p>
            {infoBox('#f87171', '#450a0a', 'Warum ist das wichtig?', 'Wenn wir vergessen, Dateien über die API zu löschen, bleiben sie im Storage – das kostet Speicherplatz. Der orphaned-storage-button findet und löscht solche verwaisten Dateien.')}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 9. MODULE */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="module" style={S.anchor} />
        <h2 style={S.h2}>9. App-Module</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { module: 'Assets', color: '#0099cc', route: '/assets', desc: 'Kern des Systems. Vollständige CRUD-Operationen, Bildupload, Dokument-Upload, QR-Code-Generierung, Standort-Hierarchie, techn. & komm. Daten, Soft-Delete.', features: ['130+ Einheiten für techn. Daten', 'QR-Code-Download als PNG', 'NFC-UID scannen & speichern', 'Statusverwaltung (custom pro Org)', 'Standort-Verlauf'] },
            { module: 'Serviceheft', color: '#a78bfa', route: '/assets/[id]/service', desc: 'Wartungshistorie je Asset. Jeder Eintrag dokumentiert: Was wurde gemacht? Von wem? Wann? Welche Kosten? Mit Checkliste und Anhängen.', features: ['Custom Event-Types', 'Checklisten (JSONB-gespeichert)', 'Foto & Dokument-Anhänge', 'Externe Firmen erfassen', 'Timeline-Ansicht'] },
            { module: 'Wartung', color: '#f87171', route: '/wartung', desc: 'Wiederkehrende Wartungsintervalle. Legt fest: Asset X muss alle 90 Tage gewartet werden. Zeigt an, welche Wartungen überfällig sind.', features: ['Interval in Tagen', 'Schritt-für-Schritt-Anleitungen', 'Ressourcenlisten je Schritt', 'Überfällig-Anzeige', 'Org-weite Übersicht'] },
            { module: 'Scan / NFC', color: '#34d399', route: '/scan', desc: 'Physische Assets scannen: QR-Code mit Kamera oder NFC-Tag antippen → öffnet direkt die Asset-Seite.', features: ['jsQR-Bibliothek (Canvas-basiert)', 'Web NFC API (Mobile Chrome)', 'Deep-Link: /assets/{id}', 'Mobile-first Design'] },
            { module: 'Team-Chat', color: '#fb923c', route: '/teams/chat', desc: 'Echtzeit-Team-Chat pro Organisation. Nachrichten können Assets erwähnen (@[AssetName]) und erzeugen klickbare Links.', features: ['Supabase Realtime WebSocket', '@Asset-Erwähnungen mit Suche', 'Automatisches Löschen (30 Tage)', 'Feature-Toggle per Org', 'Gruppiertung nach Datum'] },
            { module: 'Billing', color: '#38bdf8', route: '/settings/billing', desc: 'Plan-Verwaltung ohne Stripe. Rechnungsbasiertes System: Rechnung anfragen → Überweisung → 9-stelligen Code einlösen.', features: ['Rechnung als PDF per E-Mail', 'HMAC-SHA256 für Codes', 'Plan-Upgrade per Code', 'Keine automatische Zahlung'] },
            { module: 'i18n / Sprachen', color: '#818cf8', route: 'next-intl', desc: '28 Sprachen unterstützt. Übersetzungen liegen in messages/[lang].json. Das Admin-Panel ist bewusst ausgenommen.', features: ['Auto-Detection via HTTP-Header', 'Server + Client Components', '28 Sprach-Dateien', 'Namespaces: assets, service, wartung, teams, docs, billing, …'] },
          ].map(m => (
            <div key={m.module} style={{ ...S.card, marginBottom: 0 }}>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: m.color }}>{m.module}</p>
              <p style={{ margin: '0 0 8px', fontSize: 10, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace" }}>{m.route}</p>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{m.desc}</p>
              {m.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: m.color, flexShrink: 0, marginTop: 4 }} />
                  <span style={{ fontSize: 11, color: 'var(--adm-text3)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 10. DEPLOYMENT */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="deployment" style={S.anchor} />
        <h2 style={S.h2}>10. Deployment & Infrastruktur</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={S.card}>
            <h3 style={S.h3}>Vercel – Hosting & Deployment</h3>
            <p style={S.p}>Vercel ist die Hosting-Plattform für INOid. Jeder Push auf den <span style={S.mono}>main</span>-Branch löst automatisch einen neuen Deploy aus (CI/CD).</p>
            {[['Framework', 'Next.js (auto-detected)'], ['Deploy-Branch', 'main → Production'], ['Build Command', 'next build'], ['Runtime', 'Node.js (kein Edge Runtime)'], ['Regionen', 'Frankfurt (fra1) – Standard Vercel'], ['Analytics', 'Vercel Analytics aktiviert']].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--adm-text4)' }}>{k as string}</span>
                <span style={{ fontSize: 12, color: 'var(--adm-text2)' }}>{v as string}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h3 style={S.h3}>Supabase – Datenbank & Auth</h3>
            <p style={S.p}>Supabase ist ein „Backend as a Service" – es stellt Datenbank, Auth, Storage und Realtime als fertige Dienste bereit, sodass kein eigener Server betrieben werden muss.</p>
            {[['DB', 'PostgreSQL 15 (managed)'], ['Auth', 'JWT + Cookies (@supabase/ssr)'], ['Storage', '3 Buckets (alle public)'], ['Realtime', 'WebSocket-Push für Team-Chat'], ['Migrations', 'Manuell via SQL-Editor'], ['RLS', 'Aktiviert auf allen Tabellen']].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--adm-text4)' }}>{k as string}</span>
                <span style={{ fontSize: 12, color: 'var(--adm-text2)' }}>{v as string}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>Environment Variables (Konfiguration)</h3>
          <p style={S.p}>Sensible Daten (API-Keys, Passwörter) werden nicht im Code gespeichert, sondern als Umgebungsvariablen in Vercel hinterlegt.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 100px', gap: '0 16px' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text4)', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>Variable</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text4)', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>Zweck</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text4)', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>Scope</span>
            {[
              ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase Projekt-URL', 'Client + Server'],
              ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon Key – für RLS-gesicherte Abfragen', 'Client + Server'],
              ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase Service Role – umgeht RLS (GEHEIM!)', 'Server only'],
              ['RESEND_API_KEY', 'E-Mail-Versand via Resend', 'Server only'],
              ['RESEND_FROM_EMAIL', 'Absender-Adresse für E-Mails', 'Server only'],
              ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'Cloudflare Turnstile – Bot-Schutz Register-Seite', 'Client'],
              ['TURNSTILE_SECRET_KEY', 'Cloudflare Turnstile – serverseitige Verifikation', 'Server only'],
              ['SENTRY_DSN', 'Sentry Error Monitoring – Fehler werden automatisch gemeldet', 'Server + Client'],
            ].map(([k, v, s]) => (
              <React.Fragment key={k as string}>
                <span style={{ fontSize: 11, fontFamily: "'Courier New', monospace", color: '#34d399', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>{k as string}</span>
                <span style={{ fontSize: 12, color: 'var(--adm-text3)', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>{v as string}</span>
                <span style={{ fontSize: 11, color: 'var(--adm-text4)', padding: '6px 0', borderBottom: '1px solid var(--adm-border)' }}>{s as string}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 11. ABHÄNGIGKEITEN */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="abhaengigkeiten" style={S.anchor} />
        <h2 style={S.h2}>11. Abhängigkeiten & Versionen</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            {
              title: 'Core Framework', rows: [
                ['next', '16.2.2', 'App Router, Server Components, Route Handlers, Middleware'],
                ['react', '19.2.4', 'UI-Bibliothek für interaktive Komponenten'],
                ['react-dom', '19.2.4', 'React für Browser (DOM-Rendering)'],
                ['typescript', '^5', 'Statische Typisierung – Fehler werden vor dem Build erkannt'],
              ]
            },
            {
              title: 'Supabase', rows: [
                ['@supabase/supabase-js', '^2.101.1', 'Haupt-Client für DB, Auth, Storage, Realtime'],
                ['@supabase/ssr', '^0.10.0', 'SSR-kompatibler Auth für Next.js (Cookie-basiert)'],
              ]
            },
            {
              title: 'Utilities', rows: [
                ['next-intl', '^4.9.0', 'Internationalisierung (28 Sprachen, Server + Client)'],
                ['lucide-react', '^1.7.0', 'Icon-Bibliothek (SVG-Icons als React-Komponenten)'],
                ['qrcode', '^1.5.4', 'QR-Code als PNG/SVG generieren'],
                ['jsqr', '^1.4.0', 'QR-Code aus Kamerabild dekodieren (Client)'],
                ['pdf-lib', '^1.17.1', 'PDF-Komprimierung und -Erstellung client-seitig'],
                ['resend', '^6.10.0', 'E-Mail-Versand (Rechnungen, Einladungen, Passwort-Reset)'],
                ['@sentry/nextjs', '^10.47.0', 'Error Monitoring – Fehler automatisch an Sentry melden'],
              ]
            },
            {
              title: 'Sicherheit', rows: [
                ['Cloudflare Turnstile', 'CDN', 'Bot-Schutz auf Registrierungsseite (clientseitiges Widget)'],
                ['SHA-256 (WebCrypto)', 'Browser-native', 'Admin-PIN-Hashing (keine externe Bibliothek)'],
                ['HMAC-SHA256 (crypto)', 'Node.js-native', 'Billing-Code-Generierung und -Verifikation'],
              ]
            },
          ].map(group => (
            <div key={group.title} style={S.card}>
              <h3 style={S.h3}>{group.title}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 80px 1fr', gap: '0 12px' }}>
                {group.rows.map(([pkg, ver, desc]) => (
                  <React.Fragment key={pkg as string}>
                    <span style={{ fontSize: 11, fontFamily: "'Courier New', monospace", color: '#34d399', padding: '5px 0', borderBottom: '1px solid var(--adm-border)' }}>{pkg as string}</span>
                    <span style={{ fontSize: 11, color: 'var(--adm-text4)', padding: '5px 0', borderBottom: '1px solid var(--adm-border)' }}>{ver as string}</span>
                    <span style={{ fontSize: 11, color: 'var(--adm-text3)', padding: '5px 0', borderBottom: '1px solid var(--adm-border)', lineHeight: 1.4 }}>{desc as string}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 12. LASTENHEFT */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="lastenheft" style={S.anchor} />
        <h2 style={S.h2}>12. Lastenheft – Anforderungen</h2>
        <p style={S.p}>Das Lastenheft beschreibt, <strong style={{ color: 'var(--adm-text)' }}>was</strong> das System leisten soll. Es ist aus Sicht des Auftraggebers/Nutzers geschrieben: Was brauche ich? Welches Problem soll gelöst werden?</p>
        {infoBox('#0099cc', 'var(--adm-accent-bg)', 'Lastenheft vs. Pflichtenheft', 'Lastenheft (dieses Kapitel): Was wird gebraucht? – aus Nutzersicht. Pflichtenheft (nächstes Kapitel): Wie wird es gebaut? – aus Entwicklersicht.')}

        <div style={S.card}>
          <h3 style={S.h3}>FA – Funktionale Anforderungen</h3>
          <p style={S.p}>Was das System tun muss (Kernfunktionen).</p>
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 80px', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--adm-border)' }}>
              {['ID', 'Anforderung', 'Umsetzung', 'Status'].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>)}
            </div>
            {reqRow('FA-001', 'Nutzer können sich registrieren und einloggen', 'Supabase Auth (E-Mail + Passwort), Einladungslinks für bestehende Orgs', 'erfüllt')}
            {reqRow('FA-002', 'Jede Organisation hat einen isolierten Datenbereich', 'Multi-Tenant via organization_id FK + Row Level Security in PostgreSQL', 'erfüllt')}
            {reqRow('FA-003', 'Assets können angelegt, bearbeitet und gelöscht werden', 'Vollständige CRUD-Operationen, Soft-Delete (deleted_at), Hard-Delete per Admin-Cleanup', 'erfüllt')}
            {reqRow('FA-004', 'Assets können mit Fotos versehen werden', 'Max. 10 Bilder pro Asset, client-seitige Komprimierung, Speicherung in asset-images Bucket', 'erfüllt')}
            {reqRow('FA-005', 'Assets können mit Dokumenten versehen werden', 'Max. 10 Dateien, max. 10 MB/Datei (konfigurierbar), Speicherung in org-files Bucket', 'erfüllt')}
            {reqRow('FA-006', 'Jedes Asset erhält einen eindeutigen QR-Code', 'QR-Code aus Asset-ID generiert, als PNG downloadbar, scanbar über /scan Seite', 'erfüllt')}
            {reqRow('FA-007', 'Assets können NFC-Tags zugewiesen werden', 'nfc_uid Feld im Asset, Web NFC API zum Scannen auf mobilen Geräten', 'erfüllt')}
            {reqRow('FA-008', 'Wartungshistorie (Serviceheft) je Asset', 'asset_lifecycle_events Tabelle, CRUD, Checklisten, Anhänge, Kosten, Timeline', 'erfüllt')}
            {reqRow('FA-009', 'Wiederkehrende Wartungsintervalle definieren', 'maintenance_schedules mit interval_days, next_due, Schritt-für-Schritt-Anleitung', 'erfüllt')}
            {reqRow('FA-010', 'Standorthierarchie (Gebäude → Halle → Bereich)', '3-stufige Hierarchie: locations → halls → areas, als FK gespeichert, Picker-Komponente', 'erfüllt')}
            {reqRow('FA-011', 'Rollensystem mit Zugriffsrechten', '4 Org-Rollen (superadmin/admin/techniker/leser) + Platform Admin, RLS-Policy + permissions.ts', 'erfüllt')}
            {reqRow('FA-012', 'Team-Verwaltung innerhalb einer Org', 'teams + team_members Tabellen, Rollen je Team-Mitglied, Einladungen', 'erfüllt')}
            {reqRow('FA-013', 'Team-Chat in Echtzeit', 'Supabase Realtime WebSocket, chat_messages mit @Asset-Erwähnungen, auto-delete 30 Tage', 'erfüllt')}
            {reqRow('FA-014', 'Plan-basierte Limits (Assets, Nutzer)', 'organizations.asset_limit + user_limit, Prüfung in API + Frontend', 'erfüllt')}
            {reqRow('FA-015', 'Rechnungsbasiertes Billing (kein Stripe)', 'Rechnung per E-Mail (Resend + pdf-lib), Einmalcode (HMAC-SHA256) zum Plan-Upgrade', 'erfüllt')}
            {reqRow('FA-016', 'App in 28 Sprachen nutzbar', 'next-intl mit Auto-Detection, alle Kernseiten übersetzt, Admin-Panel bewusst Deutsch', 'erfüllt')}
            {reqRow('FA-017', 'Platform-Admin kann Orgs und Nutzer verwalten', 'Admin-Panel mit eigenem Layout, 13 API-Endpunkte, Audit-Log, PIN-Schutz', 'erfüllt')}
            {reqRow('FA-018', 'Technische Daten mit Einheiten erfassen', '130+ Einheiten (m, kg, kW, etc.), Tabellen-Editor für technical_data JSONB', 'erfüllt')}
            {reqRow('FA-019', 'Module können pro Org aktiviert/deaktiviert werden', 'organizations.features JSONB: serviceheft, wartung, teamchat togglebar', 'erfüllt')}
            {reqRow('FA-020', 'Passwort-Verwaltung für Nutzer', 'Passwort-Reset per E-Mail, must_change_password Flag, Admin kann Reset auslösen', 'erfüllt')}
          </div>
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>NFA – Nicht-Funktionale Anforderungen</h3>
          <p style={S.p}>Qualitätseigenschaften: Wie soll das System funktionieren (nicht nur was)?</p>
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 80px', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--adm-border)' }}>
              {['ID', 'Anforderung', 'Umsetzung', 'Status'].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--adm-text4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>)}
            </div>
            {reqRow('NFA-001', 'Datenisolation: Kunden sehen keine fremden Daten', 'RLS auf allen Tabellen, organization_id-basierte Policies, getestet', 'erfüllt')}
            {reqRow('NFA-002', 'Sicherheit: Keine API-Keys im Frontend-Code', 'SUPABASE_SERVICE_ROLE_KEY nur server-seitig, NEXT_PUBLIC_ nur für sichere Keys', 'erfüllt')}
            {reqRow('NFA-003', 'Performance: Seiten laden schnell', 'Server Components (SSR), Bildkomprimierung, Supabase Edge Network', 'erfüllt')}
            {reqRow('NFA-004', 'Mobile-fähig (Smartphones/Tablets)', 'Responsive Layouts, Mobile-Navigation (Drawer), QR/NFC-Scanner mobil optimiert', 'erfüllt')}
            {reqRow('NFA-005', 'Skalierbarkeit: Mehr Kunden ohne Umbau', 'Multi-Tenant-Architektur, Supabase managed DB, Vercel autoscaling', 'erfüllt')}
            {reqRow('NFA-006', 'Fehler-Monitoring: Bugs werden automatisch gemeldet', 'Sentry (Frontend + Backend), Alert bei kritischen Fehlern', 'erfüllt')}
            {reqRow('NFA-007', 'Bot-Schutz auf öffentlichen Formularen', 'Cloudflare Turnstile auf /register Seite', 'erfüllt')}
            {reqRow('NFA-008', 'Audit-Trail: Admin-Aktionen werden protokolliert', 'admin_audit_log Tabelle, alle sensitiven Aktionen geloggt', 'erfüllt')}
            {reqRow('NFA-009', 'Datensparsamkeit: Alte Daten werden bereinigt', 'Chat-Nachrichten auto-delete 30 Tage (pg_cron), Soft-Delete für Assets', 'erfüllt')}
            {reqRow('NFA-010', 'Zugänglichkeit: Dark & Light Mode', 'CSS Custom Properties, AdminThemeProvider, localStorage-Persistenz', 'teilweise')}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 13. PFLICHTENHEFT */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={S.section}>
        <span id="pflichtenheft" style={S.anchor} />
        <h2 style={S.h2}>13. Pflichtenheft – Technische Umsetzung</h2>
        <p style={S.p}>Das Pflichtenheft beschreibt, <strong style={{ color: 'var(--adm-text)' }}>wie</strong> die Anforderungen konkret umgesetzt werden. Es ist aus Entwicklersicht geschrieben.</p>

        <div style={S.card}>
          <h3 style={S.h3}>Systemarchitektur-Entscheidungen</h3>
          {[
            {
              decision: 'Next.js App Router statt Pages Router',
              reason: 'Server Components ermöglichen Daten direkt auf dem Server zu laden ohne eigene API-Endpunkte für jede Seite. Bessere Performance, einfacherer Code.',
              consequence: 'Komponenten müssen bewusst als Server oder Client markiert werden. Server Components können keine useState/useEffect nutzen.'
            },
            {
              decision: 'Supabase statt eigenem Backend',
              reason: 'Drastisch weniger zu verwalten: Kein eigener Auth-Server, keine eigene DB-Instanz, kein eigener Storage-Server. Supabase übernimmt das.',
              consequence: 'RLS muss korrekt konfiguriert werden. Bei komplexen Abfragen manchmal Umweg über PostgreSQL-Funktionen notwendig.'
            },
            {
              decision: 'Inline Styles statt Tailwind/CSS-Module',
              reason: 'Kein Build-Tool-Overhead, volle TypeScript-Typsicherheit für Style-Werte, einfacher Dark/Light-Mode via CSS Custom Properties.',
              consequence: 'Styles sind länger als Tailwind-Klassen. Kein globales Theming über Klassen möglich – CSS Custom Properties übernehmen diese Rolle.'
            },
            {
              decision: 'Multi-Tenant via Shared DB + RLS statt eigene DB je Kunde',
              reason: 'Günstigerer Betrieb, einfachere Verwaltung. RLS stellt Datenisolation sicher ohne separate Instanzen.',
              consequence: 'Jede Tabelle braucht organization_id und eine RLS-Policy. Bei fehlendem RLS wäre die Isolation kaputt – muss beim Hinzufügen neuer Tabellen beachtet werden.'
            },
            {
              decision: 'Billing ohne Stripe (Invoice-Only)',
              reason: 'Kein Stripe-Account und -Integration nötig. Einfacherer Flow für B2B-Kunden, die ohnehin Rechnungen brauchen.',
              consequence: 'Kein automatisches Abo-Management. Jede Verlängerung muss manuell als neuer Code ausgestellt werden.'
            },
          ].map(item => (
            <div key={item.decision} style={{ background: 'var(--adm-bg)', borderRadius: 10, border: '1px solid var(--adm-border)', padding: '14px', marginBottom: 12 }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>✦ {item.decision}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Begründung</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{item.reason}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Konsequenz/Kompromisse</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)', lineHeight: 1.5 }}>{item.consequence}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <h3 style={S.h3}>Sicherheitskonzept im Detail</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              {
                layer: 'Schicht 1: Middleware', color: '#60a5fa',
                items: ['Läuft vor JEDER Anfrage', 'Prüft ob Session-Cookie vorhanden', 'Leitet unauthentifizierte Nutzer zu /login', 'Aktualisiert Supabase Session automatisch'],
              },
              {
                layer: 'Schicht 2: Layout-Checks', color: '#34d399',
                items: ['Admin-Layout prüft is_platform_admin', 'Dashboard-Layout prüft is_active', 'Server-seitig mit Service Role (zuverlässig)', 'Redirect bei fehlenden Rechten'],
              },
              {
                layer: 'Schicht 3: RLS in der DB', color: '#a78bfa',
                items: ['Datenbank erzwingt Isolation', 'SELECT/INSERT/UPDATE/DELETE nur mit passender org_id', 'Gilt auch wenn Frontend-Checks umgangen werden', 'Letztes Sicherheitsnetz'],
              },
              {
                layer: 'Schicht 4: API-Checks', color: '#fbbf24',
                items: ['API-Endpunkte prüfen nochmals Auth', 'Service Role nur in API-Endpunkten', 'Input-Validierung vor DB-Operationen', 'PIN-Prüfung für destruktive Aktionen'],
              },
              {
                layer: 'Schicht 5: Secret-Management', color: '#f87171',
                items: ['Service Role Key: nur SERVER_ONLY', 'NEXT_PUBLIC_: nur harmlose Werte', 'Vercel Env: nie im Code, nie in Git', 'Keine .env-Datei im Repository'],
              },
              {
                layer: 'Schicht 6: PIN-Schutz', color: '#38bdf8',
                items: ['Für destruktive Admin-Aktionen', 'SHA-256-Hash in DB gespeichert', 'Nie im Klartext', 'Extra-Bestätigung nötig'],
              },
            ].map(sec => (
              <div key={sec.layer} style={{ background: 'var(--adm-bg)', borderRadius: 10, padding: '12px', border: `1px solid ${sec.color}33` }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: sec.color }}>{sec.layer}</p>
                {sec.items.map(item => <div key={item} style={{ fontSize: 11, color: 'var(--adm-text2)', marginBottom: 4 }}>· {item}</div>)}
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <h3 style={S.h3}>Dateipfad-Struktur (wichtige Dateien)</h3>
          <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 2 }}>
            {[
              { indent: 0, text: 'inoid-web/', color: 'var(--adm-text)' },
              { indent: 1, text: 'src/app/', color: '#60a5fa' },
              { indent: 2, text: '(admin)/admin/     → Admin-Panel (nur Platform Admins)', color: '#a78bfa' },
              { indent: 2, text: '(dashboard)/       → Kunden-App (eingeloggte Org-Nutzer)', color: '#34d399' },
              { indent: 3, text: 'assets/            → Asset-Liste, Asset-Detail, Bearbeiten', color: 'var(--adm-text3)' },
              { indent: 3, text: 'assets/[id]/service/ → Serviceheft', color: 'var(--adm-text3)' },
              { indent: 3, text: 'wartung/           → Wartungsintervalle', color: 'var(--adm-text3)' },
              { indent: 3, text: 'teams/             → Team-Verwaltung + Chat', color: 'var(--adm-text3)' },
              { indent: 3, text: 'settings/          → Profil, Billing, Rollen', color: 'var(--adm-text3)' },
              { indent: 2, text: '(auth)/            → Login, Register, Einladung, PW-Reset', color: '#fbbf24' },
              { indent: 2, text: 'api/               → API-Endpunkte (Route Handlers)', color: '#f87171' },
              { indent: 1, text: 'src/lib/', color: '#60a5fa' },
              { indent: 2, text: 'supabase/client.ts  → Browser-Client (mit RLS)', color: 'var(--adm-text3)' },
              { indent: 2, text: 'supabase/server.ts  → Server-Client (mit RLS)', color: 'var(--adm-text3)' },
              { indent: 2, text: 'supabase/admin.ts   → Service-Role-Client (umgeht RLS!)', color: '#f87171' },
              { indent: 2, text: 'permissions.ts      → Rollen-Logik: ROLE_COLORS, can()', color: 'var(--adm-text3)' },
              { indent: 2, text: 'compress-image.ts   → Canvas-Bildkomprimierung', color: 'var(--adm-text3)' },
              { indent: 2, text: 'plans.ts            → PLANS-Konstante (Limits pro Plan)', color: 'var(--adm-text3)' },
              { indent: 1, text: 'src/components/', color: '#60a5fa' },
              { indent: 2, text: 'nav-sidebar.tsx     → Desktop-Navigation', color: 'var(--adm-text3)' },
              { indent: 2, text: 'nav-bottom.tsx      → Mobile-Navigation (Drawer)', color: 'var(--adm-text3)' },
              { indent: 2, text: 'admin-theme-provider.tsx → Dark/Light-Mode Context', color: 'var(--adm-text3)' },
              { indent: 1, text: 'messages/           → 28 Sprach-Dateien (JSON)', color: '#fb923c' },
              { indent: 1, text: 'supabase/migrations/ → 021 SQL-Migrations-Dateien', color: '#38bdf8' },
            ].map((line, i) => (
              <div key={i} style={{ paddingLeft: line.indent * 20, color: line.color }}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--adm-text4)' }}>INOid.app · Admin-interne Dokumentation · nicht öffentlich zugänglich</span>
        <span style={{ fontSize: 11, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace" }}>v1.x · Next.js 16.2.2 · Supabase · Vercel · Stand April 2026</span>
      </div>
    </div>
  )
}
