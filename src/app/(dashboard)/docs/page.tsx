'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ClipboardList, ScanLine, Wrench, CalendarClock, MapPin, Users,
  FileText, QrCode, CheckCircle2, ChevronDown, ChevronRight,
  Zap, ShieldCheck, Smartphone, Upload, Bell, ArrowRight,
  CreditCard, Receipt, KeyRound, Check, ListChecks,
} from 'lucide-react'

// ─── Daten ────────────────────────────────────────────────────────────────────

const QUICKSTART = [
  {
    step: '01',
    title: 'Asset anlegen',
    desc: 'Gehe zu Assets → tippe auf „+ Neu". Füge Titel, Kategorie, Fotos und technische Daten hinzu.',
    href: '/assets',
    color: '#0099cc',
  },
  {
    step: '02',
    title: 'QR-Code scannen',
    desc: 'Drücke den Scan-Button in der Mitte der Navigation. Die Kamera öffnet sich sofort.',
    href: '/scan',
    color: '#003366',
  },
  {
    step: '03',
    title: 'Serviceeintrag erstellen',
    desc: 'Öffne ein Asset → Serviceheft → „+ Eintrag". Dokumentiere Wartungen, Reparaturen und Inspektionen.',
    href: '/assets',
    color: '#005c8a',
  },
  {
    step: '04',
    title: 'Wartungsintervall einrichten',
    desc: 'Im Serviceheft → „+ Intervall". Wähle ein Intervall (wöchentlich bis 2-jährlich) und setze die nächste Fälligkeit.',
    href: '/wartung',
    color: '#00a8c8',
  },
]

const FEATURES = [
  {
    icon: ClipboardList,
    color: '#0099cc',
    title: 'Asset-Verwaltung',
    badge: 'Kern',
    desc: 'Alle Betriebsmittel an einem Ort. Jedes Asset bekommt eine eindeutige ID, Fotos, technische & kommerzielle Stammdaten sowie einen automatisch generierten QR-Code.',
    points: [
      'Fotos, Seriennummer, Artikelnummer',
      'Technische & kommerzielle Daten frei definierbar',
      'Status: Aktiv, Defekt, In Wartung, Ausgemustert + eigene',
      'Asset duplizieren für schnelle Serienerfassung',
      'Standortzuweisung mit vollständiger Verlaufshistorie',
    ],
  },
  {
    icon: FileText,
    color: '#003366',
    title: 'Serviceheft',
    badge: 'Kern',
    desc: 'Lückenlose Dokumentation aller Ereignisse am Asset – von der Inspektion bis zum Vorfall. Fotos und Dokumente direkt anhängen.',
    points: [
      '10 Systemtypen + eigene Typen (Einstellungen → Event-Typen)',
      'Fotos & PDF-Dokumente anhängen',
      'Kosten, Durchführender, externes Unternehmen',
      'Monatsweise gruppierte Timeline',
      'Wartungsplan als Gantt-Chart direkt im Serviceheft',
    ],
  },
  {
    icon: CalendarClock,
    color: '#005c8a',
    title: 'Wartungsintervalle & Checklisten',
    badge: 'Planung',
    desc: 'Wiederkehrende Termine nie vergessen. Definiere Intervalle pro Asset, hinterlege Schritt-für-Schritt-Checklisten und behalte alle Fälligkeiten im Blick.',
    points: [
      'Vorgaben: wöchentlich, monatlich, vierteljährlich, …',
      'Individuelles Intervall in Tagen',
      'Automatische Berechnung des nächsten Termins',
      'Checkliste pro Intervall anlegen (beliebig viele Schritte)',
      'Checkliste erscheint beim Abschließen zum Abhaken',
      'Wartung direkt als erledigt markieren – aus Liste oder Gantt',
      'Nächster Termin wird beim Abschließen automatisch vorgerückt',
    ],
  },
  {
    icon: ListChecks,
    color: '#7c3aed',
    title: 'Wartungs-Dashboard',
    badge: 'Planung',
    desc: 'Alle fälligen Wartungen auf einen Blick. Filter, Suche und Gantt-Chart für die komplette Übersicht über alle Assets.',
    points: [
      'Aufgabenliste: gruppiert nach Überfällig / Diese Woche / 30 Tage / Später',
      'Gantt-Chart mit Heatmap-Verlauf (intensiver je näher der Termin)',
      'Suche über alle Asset-Merkmale (Name, Seriennr., Kategorie, …)',
      'Filter: Dringlichkeit, Kategorie, Einträge pro Seite',
      'Zeitraum-Filter steuert gleichzeitig Gantt-Ansicht',
      'Pagination für große Mengen',
    ],
  },
  {
    icon: ScanLine,
    color: '#00a8c8',
    title: 'QR- & NFC-Scanner',
    badge: 'Mobile',
    desc: 'Asset sofort durch Scannen aufrufen – kein Suchen, kein Tippen. Funktioniert mit der Kamera im Browser, kein App-Download nötig.',
    points: [
      'QR-Code scannen → Asset direkt öffnen',
      'Automatisch generierter QR-Code pro Asset',
      'NFC-Tag UUID als Fallback',
      'Optimiert für Smartphone-Kamera',
      'QR-Code als PDF/Bild exportierbar',
    ],
  },
  {
    icon: MapPin,
    color: '#38b2d4',
    title: 'Standorte & Struktur',
    badge: 'Organisation',
    desc: 'Bilde deine Betriebsstruktur exakt ab: Standort → Halle → Bereich. Jedes Asset kann einem Bereich zugewiesen werden.',
    points: [
      '3-stufige Hierarchie: Standort / Halle / Bereich',
      'Beliebig viele Standorte & Hallen',
      'Vollständige Standort-Verlaufshistorie',
      'Freie Texteingabe als Alternative',
      'Verwaltung unter Organisation',
    ],
  },
  {
    icon: Users,
    color: '#004e8c',
    title: 'Teams & Rollen',
    badge: 'Zugriff',
    desc: 'Mehrere Mitarbeiter, klare Verantwortlichkeiten. Lade Kollegen ein und weise Rollen zu – jede Rolle sieht und kann genau das, was sie soll.',
    points: [
      'Admin: voller Zugriff + Benutzerverwaltung',
      'Techniker: Assets & Service bearbeiten',
      'Leser: nur Ansicht, keine Änderungen',
      'Mitglieder direkt anlegen (E-Mail + Passwort)',
      'Rollen jederzeit änderbar',
    ],
  },
  {
    icon: Upload,
    color: '#6b7d99',
    title: 'Dokumente',
    badge: 'Daten',
    desc: 'Bedienungsanleitungen, Prüfberichte, Zertifikate – direkt am Asset ablegen. Fotos im Serviceheft lückenlos dokumentieren.',
    points: [
      'PDF, Bilder und weitere Formate',
      'Dokumente direkt am Asset',
      'Fotos im Serviceeintrag',
      'Sicherer Upload über Supabase Storage',
      'Direkter Download-Link',
    ],
  },
  {
    icon: QrCode,
    color: '#96aed2',
    title: 'QR-Codes & NFC',
    badge: 'Identifikation',
    desc: 'Jedes Asset erhält automatisch einen eindeutigen QR-Code. Klebe ihn ans Gerät und scanne ihn jederzeit für sofortigen Zugriff.',
    points: [
      'Automatische Generierung bei Anlage',
      'Format: inoid.app/assets/{id}',
      'QR-Code direkt in der App anzeigen',
      'UUID für NFC-Chips nutzbar',
      'Auch ohne App über Browser-Link aufrufbar',
    ],
  },
]

const ROLES = [
  { role: 'Admin', color: '#003366', bg: '#e8f0f8', points: ['Alles lesen & bearbeiten', 'Assets anlegen & löschen', 'Mitglieder anlegen & verwalten', 'Rollen vergeben', 'Einstellungen ändern'] },
  { role: 'Techniker', color: '#0077b6', bg: '#e6f4fb', points: ['Alle Assets sehen', 'Assets & Serviceheft bearbeiten', 'Serviceeinträge anlegen', 'Wartungsintervalle pflegen', 'Keine Teamverwaltung'] },
  { role: 'Leser', color: '#6b7d99', bg: '#f4f6f9', points: ['Alle Assets sehen', 'Serviceheft lesen', 'Keine Bearbeitungsrechte', 'Kein Anlegen/Löschen', 'Ideal für Prüfer & Externe'] },
]

const PLAN_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '0 €',
    color: '#6b7d99',
    bg: '#f4f6f9',
    points: ['5 Assets', '1 Benutzer', 'Serviceheft', 'QR-Scanner'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '50 €',
    color: '#0099cc',
    bg: '#e6f9ff',
    points: ['50 Assets', 'Bis 5 Benutzer', 'Wartungsintervalle', 'Standortverwaltung', 'Dokument-Upload'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '100 €',
    color: '#003366',
    bg: '#e8f0f8',
    points: ['200 Assets', 'Bis 20 Benutzer', 'Alle Starter-Features', 'Teams & Rollen', 'Erweiterte Auswertungen'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '329 €',
    color: '#7c3aed',
    bg: '#f3f0ff',
    points: ['Unbegrenzte Assets', 'Unbegrenzte Benutzer', 'Alle Professional-Features', 'Priority-Support', 'Individuelle Anpassungen'],
  },
]

const BILLING_STEPS = [
  {
    step: '01',
    icon: CreditCard,
    color: '#003366',
    title: 'Plan wählen',
    desc: 'Gehe zu Abonnement (Sidebar → Organisationsverwaltung). Wähle den gewünschten Plan und klicke auf „Rechnung erstellen".',
  },
  {
    step: '02',
    icon: Receipt,
    color: '#0077b6',
    title: 'Rechnung ausfüllen & herunterladen',
    desc: 'Fülle die Rechnungsadresse aus (Name/Firma, Straße, PLZ/Ort, Land, USt-ID optional). Die Rechnung mit allen gesetzlichen Pflichtangaben (§ 14 UStG) wird sofort angezeigt und kann gedruckt werden.',
  },
  {
    step: '03',
    icon: ArrowRight,
    color: '#0099cc',
    title: 'Überweisen',
    desc: 'Überweise den Rechnungsbetrag auf das angegebene Bankkonto (Inomet GmbH). Verwende die Rechnungsnummer als Verwendungszweck.',
  },
  {
    step: '04',
    icon: KeyRound,
    color: '#00a8c8',
    title: 'Aktivierungscode erhalten',
    desc: 'Nach Zahlungseingang erhältst du automatisch einen 9-stelligen Aktivierungscode per E-Mail an alle Admins deiner Organisation.',
  },
  {
    step: '05',
    icon: Check,
    color: '#059669',
    title: 'Code einlösen & Plan aktivieren',
    desc: 'Gehe zurück zu Abonnement, trage den Code im Feld „Aktivierungscode einlösen" ein und klicke auf „Aktivieren". Der Plan ist sofort aktiv.',
  },
]

const TIPS = [
  { icon: Zap, text: 'Asset duplizieren spart Zeit bei der Erfassung gleicher Geräte.' },
  { icon: CheckCircle2, text: 'Wartung früh erledigt? Einfach den grünen ✓-Button im Wartungs-Dashboard tippen – der nächste Termin wird automatisch berechnet.' },
  { icon: ShieldCheck, text: 'Weise jedem Mitarbeiter die engste Rolle zu – Leser für externe Prüfer.' },
  { icon: Smartphone, text: 'INOid läuft als PWA: Startbildschirm-Link auf dem Smartphone für App-Feeling.' },
  { icon: Bell, text: 'Prüfe täglich das Wartungs-Dashboard – überfällige Intervalle werden rot markiert.' },
]

// ─── Komponenten ──────────────────────────────────────────────────────────────

function FeatureCard({ f }: { f: typeof FEATURES[number] }) {
  const [open, setOpen] = useState(false)
  const Icon = f.icon
  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: `1px solid ${open ? f.color + '44' : '#c8d4e8'}`,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '16px 18px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left',
        }}
      >
        <span style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `${f.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={f.color} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>{f.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
              background: `${f.color}18`, color: f.color,
            }}>{f.badge}</span>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
        </div>
        <span style={{ flexShrink: 0, marginTop: 2, color: '#96aed2', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'flex' }}>
          <ChevronDown size={18} />
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 16px 72px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {f.points.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={14} color={f.color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#444' }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Seite ────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<'start' | 'features' | 'roles' | 'plans' | 'tips'>('start')

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 60 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #003366 0%, #0077b6 60%, #0099cc 100%)',
        padding: '32px 20px 36px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <button type="button" onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 20, padding: '6px 12px 6px 8px',
          color: 'white', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', marginBottom: 20,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Zurück
        </button>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
            }}>INOid · Dokumentation</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 10px', lineHeight: 1.2 }}>
            Alles, was du<br />wissen musst.
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 340 }}>
            INOid ist dein digitales Betriebsmittelmanagement — von der Erstzulassung bis zur Entsorgung. In 5 Minuten ready.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { val: '5 min', label: 'bis zum ersten Asset' },
              { val: '8+', label: 'Feature-Bereiche' },
              { val: '100%', label: 'browserbasiert' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab-Leiste */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'white', borderBottom: '1px solid #c8d4e8',
        display: 'flex', overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {([
          { key: 'start', label: 'Schnellstart' },
          { key: 'features', label: 'Features' },
          { key: 'roles', label: 'Rollen' },
          { key: 'plans', label: 'Pläne & Abo' },
          { key: 'tips', label: 'Tipps' },
        ] as const).map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveSection(t.key)}
            style={{
              flexShrink: 0, padding: '13px 18px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              color: activeSection === t.key ? '#003366' : '#96aed2',
              borderBottom: activeSection === t.key ? '2px solid #003366' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* ── Schnellstart ── */}
        {activeSection === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              Vier Schritte und du kennst das Wesentliche von INOid.
            </p>
            {QUICKSTART.map((s, i) => (
              <div
                key={i}
                style={{
                  background: 'white', borderRadius: 16, padding: '18px 18px 18px 20px',
                  border: '1px solid #c8d4e8',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* colored left bar */}
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color }} />

                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${s.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: s.color,
                }}>
                  {s.step}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 4px' }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.5 }}>{s.desc}</p>
                  <button
                    type="button"
                    onClick={() => router.push(s.href)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '7px 14px', borderRadius: 20,
                      background: s.color, border: 'none', cursor: 'pointer',
                      color: 'white', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    Direkt öffnen <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* Video / Placeholder */}
            <div style={{
              background: `linear-gradient(135deg, #003366, #0099cc)`,
              borderRadius: 16, padding: '24px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, textAlign: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>Demo-Tour</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                  Walkthrough-Video in Kürze verfügbar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Features ── */}
        {activeSection === 'features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              Tippe auf ein Feature, um Details zu sehen.
            </p>
            {FEATURES.map((f, i) => <FeatureCard key={i} f={f} />)}
          </div>
        )}

        {/* ── Rollen ── */}
        {activeSection === 'roles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              INOid nutzt drei Rollen. Weise jedem Mitarbeiter die engste passende Rolle zu.
            </p>
            {ROLES.map(r => (
              <div key={r.role} style={{
                background: 'white', borderRadius: 16,
                border: `1px solid ${r.color}33`, overflow: 'hidden',
              }}>
                <div style={{
                  background: r.bg, padding: '12px 18px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: `1px solid ${r.color}22`,
                }}>
                  <ShieldCheck size={18} color={r.color} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: r.color }}>{r.role}</span>
                </div>
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {r.points.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={14} color={r.color} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#444' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{
              background: '#fffbe6', border: '1px solid #fde68a',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.5 }}>
                Rollen verwaltest du unter <strong>Teams → Mitglied auswählen → Rolle ändern</strong>. Neue Mitglieder anlegst du über <strong>Teams → Team öffnen → Mitglied anlegen</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Pläne & Abo ── */}
        {activeSection === 'plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Intro */}
            <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.6 }}>
              INOid bietet vier Pläne. Bezahlt wird per Überweisung – kein Abo-Abo, kein Kreditkartenzwang. Nach Zahlungseingang erhältst du per E-Mail einen Code, den du direkt einlöst.
            </p>

            {/* Pläne */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                Verfügbare Pläne
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PLAN_TIERS.map(plan => (
                  <div key={plan.id} style={{
                    background: 'white', borderRadius: 14,
                    border: `1px solid ${plan.color}33`,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      background: plan.bg, padding: '12px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderBottom: `1px solid ${plan.color}22`,
                    }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: plan.color }}>{plan.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: plan.color }}>
                        {plan.price} <span style={{ fontSize: 11, fontWeight: 400, color: '#888' }}>zzgl. MwSt./Monat</span>
                      </span>
                    </div>
                    <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                      {plan.points.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Check size={12} color={plan.color} />
                          <span style={{ fontSize: 12, color: '#444' }}>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wie läuft die Buchung ab */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                So funktioniert die Buchung
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {BILLING_STEPS.map((s) => {
                  const Icon = s.icon
                  return (
                    <div key={s.step} style={{
                      background: 'white', borderRadius: 14, padding: '14px 16px',
                      border: '1px solid #c8d4e8',
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color }} />
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: `${s.color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={18} color={s.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: `${s.color}18`, padding: '1px 6px', borderRadius: 6 }}>{s.step}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#000' }}>{s.title}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Hinweis-Box */}
            <div style={{
              background: '#fffbe6', border: '1px solid #fde68a',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>
                <strong>Aktivierungscode:</strong> Der Code wird nach Zahlungseingang automatisch per E-Mail an alle <strong>Admins</strong> der Organisation gesendet – nicht an den zahlenden Nutzer persönlich. Stelle sicher, dass mindestens ein Admin eine erreichbare E-Mail-Adresse hinterlegt hat.
              </div>
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={() => router.push('/settings/billing')}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #003366, #0099cc)',
                border: 'none', borderRadius: 14, cursor: 'pointer',
                color: 'white', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CreditCard size={16} />
              Zum Abonnement
            </button>
          </div>
        )}

        {/* ── Tipps ── */}
        {activeSection === 'tips' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              Profi-Tipps für den maximalen Nutzen aus INOid.
            </p>

            {TIPS.map((t, i) => {
              const Icon = t.icon
              return (
                <div key={i} style={{
                  background: 'white', borderRadius: 14, padding: '16px 18px',
                  border: '1px solid #c8d4e8',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: '#f0f4ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color="#003366" />
                  </span>
                  <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.6 }}>{t.text}</p>
                </div>
              )
            })}

            {/* Keyboard shortcuts (Desktop) */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #f4f6f9' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#003366', margin: 0 }}>Desktop-Navigation</p>
              </div>
              {[
                ['Assets', 'Linke Sidebar → Assets'],
                ['Scannen', 'Linke Sidebar → Scannen'],
                ['Wartung', 'Linke Sidebar → Wartung & Service'],
                ['Profil', 'Linke Sidebar → Profil & Einstellungen'],
              ].map(([action, shortcut]) => (
                <div key={action} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 18px', borderBottom: '1px solid #f4f6f9',
                }}>
                  <span style={{ fontSize: 13, color: '#444' }}>{action}</span>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 8,
                    background: '#f4f6f9', color: '#666', fontFamily: 'monospace',
                  }}>{shortcut}</span>
                </div>
              ))}
            </div>

            {/* Kontakt */}
            <div style={{
              background: 'linear-gradient(135deg, #003366, #0077b6)',
              borderRadius: 16, padding: '20px 20px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>Noch Fragen?</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
                Wende dich an deinen Administrator oder kontaktiere den INOid-Support direkt über Inomet GmbH.
              </p>
              <div style={{ marginTop: 4 }}>
                <a href="mailto:srl@inometa.de" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white', fontSize: 13, fontWeight: 700,
                  textDecoration: 'none',
                }}>
                  srl@inometa.de <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
