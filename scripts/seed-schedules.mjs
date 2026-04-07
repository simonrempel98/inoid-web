import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kibiqlffegqrvvaudcju.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpYmlxbGZmZWdxcnZ2YXVkY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTM3NiwiZXhwIjoyMDkwODYxMzc2fQ.1vOusjzdqErDA_9-EijLKUoqWwKRm3lPbHLZpT4j_To'
const ORG_ID       = 'd777aa17-92ad-457f-b6b4-77290dd67f79'
const USER_ID      = 'f9caf248-6150-4ef3-9760-fa88f2396a1b'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function addDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
function subDays(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// ─── Intervall-Vorlagen pro Kategorie ────────────────────────────────────────

const TEMPLATES = {
  'Anilox-Sleeves': [
    { name: 'Wöchentliche Reinigung', event_type: 'cleaning',    interval_days: 7,   lastOffset: -3,  nextOffset: 4  },
    { name: 'Sichtprüfung Zelloberfläche', event_type: 'inspection', interval_days: 7, lastOffset: -5, nextOffset: 2 },
    { name: 'Zellvolumenmessung BCM', event_type: 'inspection', interval_days: 30,  lastOffset: -18, nextOffset: 12 },
    { name: 'Tiefenreinigung Ultraschall', event_type: 'maintenance', interval_days: 30, lastOffset: -25, nextOffset: 5 },
    { name: 'Jahres-Rekonditionierung', event_type: 'overhaul',  interval_days: 365, lastOffset: -200, nextOffset: 165 },
    { name: 'DAkkS-Kalibrierung Zellvolumen', event_type: 'inspection', interval_days: 365, lastOffset: -310, nextOffset: 55 },
  ],
  'Anilox-Walzen': [
    { name: 'Wöchentliche Reinigung', event_type: 'cleaning',    interval_days: 7,   lastOffset: -4,  nextOffset: 3  },
    { name: 'Wöchentliche Sichtprüfung', event_type: 'inspection', interval_days: 7, lastOffset: -2,  nextOffset: 5 },
    { name: 'Monatliche Schichtdickenmessung', event_type: 'inspection', interval_days: 30, lastOffset: -12, nextOffset: 18 },
    { name: 'Monatliche Ultraschallreinigung', event_type: 'maintenance', interval_days: 30, lastOffset: -8, nextOffset: 22 },
    { name: 'Jährliche Chromneubeschichtung', event_type: 'overhaul', interval_days: 365, lastOffset: -180, nextOffset: 185 },
    { name: 'Jährliche Volumenmessung extern', event_type: 'inspection', interval_days: 365, lastOffset: -90, nextOffset: 275 },
  ],
  'Trägerhülsen': [
    { name: 'Wöchentliche Reinigung & Inspektion', event_type: 'cleaning', interval_days: 7, lastOffset: -2, nextOffset: 5 },
    { name: 'Wöchentlicher Rundlauftest', event_type: 'inspection', interval_days: 7, lastOffset: -6, nextOffset: 1 },
    { name: 'Monatliche Rundlaufmessung', event_type: 'inspection', interval_days: 30, lastOffset: -14, nextOffset: 16 },
    { name: 'Monatliche Oberflächenkontrolle', event_type: 'maintenance', interval_days: 30, lastOffset: -22, nextOffset: 8 },
    { name: 'Jährliche Revision Luftkupplung', event_type: 'overhaul', interval_days: 365, lastOffset: -120, nextOffset: 245 },
    { name: 'Jährliche Chromoberfläche schleifen', event_type: 'maintenance', interval_days: 365, lastOffset: -290, nextOffset: 75 },
  ],
  'Adapter & Brücken': [
    { name: 'Wöchentliche Luftdruckprüfung', event_type: 'inspection', interval_days: 7, lastOffset: -3, nextOffset: 4 },
    { name: 'Wöchentliche Dichtkontrolle', event_type: 'inspection', interval_days: 7, lastOffset: -5, nextOffset: 2 },
    { name: 'Monatliche Rundlaufprüfung', event_type: 'inspection', interval_days: 30, lastOffset: -10, nextOffset: 20 },
    { name: 'Monatliche Oberflächenkontrolle', event_type: 'maintenance', interval_days: 30, lastOffset: -28, nextOffset: 2 },
    { name: 'Jährliche Revision Luftkanal', event_type: 'overhaul', interval_days: 365, lastOffset: -200, nextOffset: 165 },
    { name: 'Jährliche Härtemessung Oberfläche', event_type: 'inspection', interval_days: 365, lastOffset: -330, nextOffset: 35 },
  ],
  'Rakelmesser': [
    { name: 'Wöchentlicher Messerwechsel', event_type: 'maintenance', interval_days: 7, lastOffset: -1, nextOffset: 6 },
    { name: 'Wöchentliche Rakelgeometrie prüfen', event_type: 'inspection', interval_days: 7, lastOffset: -4, nextOffset: 3 },
    { name: 'Monatliche Bestandsprüfung Lager', event_type: 'inspection', interval_days: 30, lastOffset: -5, nextOffset: 25 },
    { name: 'Monatliche Qualitätskontrolle Charge', event_type: 'inspection', interval_days: 30, lastOffset: -20, nextOffset: 10 },
    { name: 'Jährliche Lieferantenaudit Inomet', event_type: 'inspection', interval_days: 365, lastOffset: -100, nextOffset: 265 },
    { name: 'Jährliche Lagerbestandsrevision', event_type: 'maintenance', interval_days: 365, lastOffset: -270, nextOffset: 95 },
  ],
  'Kammrakel-Systeme': [
    { name: 'Wöchentliche Spülung & Reinigung', event_type: 'cleaning', interval_days: 7, lastOffset: -2, nextOffset: 5 },
    { name: 'Wöchentliche Dichtheitsprüfung', event_type: 'inspection', interval_days: 7, lastOffset: -6, nextOffset: 1 },
    { name: 'Monatlicher Dichtungswechsel', event_type: 'maintenance', interval_days: 30, lastOffset: -15, nextOffset: 15 },
    { name: 'Monatliche Druckprüfung 1,5 bar', event_type: 'inspection', interval_days: 30, lastOffset: -8, nextOffset: 22 },
    { name: 'Jährliche Komplettreinigung & Revision', event_type: 'overhaul', interval_days: 365, lastOffset: -250, nextOffset: 115 },
    { name: 'Jährlicher Tausch Dichtungssatz', event_type: 'maintenance', interval_days: 365, lastOffset: -180, nextOffset: 185 },
  ],
  'Farbpumpen': [
    { name: 'Wöchentliche Spülung Farbpumpe', event_type: 'cleaning', interval_days: 7, lastOffset: -1, nextOffset: 6 },
    { name: 'Wöchentliche Prüfung Fördermenge', event_type: 'inspection', interval_days: 7, lastOffset: -3, nextOffset: 4 },
    { name: 'Monatlicher Membrancheck', event_type: 'inspection', interval_days: 30, lastOffset: -12, nextOffset: 18 },
    { name: 'Monatliche Ventilreinigung', event_type: 'maintenance', interval_days: 30, lastOffset: -22, nextOffset: 8 },
    { name: 'Jährlicher Membranaustausch', event_type: 'maintenance', interval_days: 365, lastOffset: -150, nextOffset: 215 },
    { name: 'Jährliche Generalüberholung Pumpe', event_type: 'overhaul', interval_days: 365, lastOffset: -320, nextOffset: 45 },
  ],
  'Farbmischsysteme': [
    { name: 'Wöchentliche Reinigung Wiegezelle', event_type: 'cleaning', interval_days: 7, lastOffset: -4, nextOffset: 3 },
    { name: 'Wöchentliche Funktionskontrolle', event_type: 'inspection', interval_days: 7, lastOffset: -2, nextOffset: 5 },
    { name: 'Monatliche Kalibrierung Wiegezelle', event_type: 'maintenance', interval_days: 30, lastOffset: -8, nextOffset: 22 },
    { name: 'Monatliche Rezeptur-Validierung', event_type: 'inspection', interval_days: 30, lastOffset: -25, nextOffset: 5 },
    { name: 'Jährliches Softwareupdate FM-ColorControl', event_type: 'maintenance', interval_days: 365, lastOffset: -200, nextOffset: 165 },
    { name: 'Jährliche Komplett-Kalibrierung', event_type: 'overhaul', interval_days: 365, lastOffset: -90, nextOffset: 275 },
  ],
  'Reinigungsgeräte': [
    { name: 'Wöchentlicher Badwechsel (Reinigungslösung)', event_type: 'maintenance', interval_days: 7, lastOffset: -3, nextOffset: 4 },
    { name: 'Wöchentliche Funktionskontrolle Ultraschall', event_type: 'inspection', interval_days: 7, lastOffset: -5, nextOffset: 2 },
    { name: 'Monatliche Heizelementkontrolle', event_type: 'inspection', interval_days: 30, lastOffset: -18, nextOffset: 12 },
    { name: 'Monatliche Reinigung Wannenbereich', event_type: 'cleaning', interval_days: 30, lastOffset: -6, nextOffset: 24 },
    { name: 'Jährliche Wartung Heizung & Ultraschall', event_type: 'overhaul', interval_days: 365, lastOffset: -280, nextOffset: 85 },
    { name: 'Jährliche Überprüfung Sicherheitstechnik', event_type: 'inspection', interval_days: 365, lastOffset: -100, nextOffset: 265 },
  ],
  'Rakelhalter': [
    { name: 'Wöchentliche Reinigung Rakelhalter', event_type: 'cleaning', interval_days: 7, lastOffset: -2, nextOffset: 5 },
    { name: 'Wöchentliche Prüfung Schnellspannsystem', event_type: 'inspection', interval_days: 7, lastOffset: -6, nextOffset: 1 },
    { name: 'Monatliche Schmierung Mechanik', event_type: 'maintenance', interval_days: 30, lastOffset: -15, nextOffset: 15 },
    { name: 'Monatliche Überprüfung Anpressdruck', event_type: 'inspection', interval_days: 30, lastOffset: -28, nextOffset: 2 },
    { name: 'Jährlicher Tausch Exzenterlager', event_type: 'maintenance', interval_days: 365, lastOffset: -250, nextOffset: 115 },
    { name: 'Jährliche Revision gesamt', event_type: 'overhaul', interval_days: 365, lastOffset: -170, nextOffset: 195 },
  ],
  'Druckplatten-Sleeves': [
    { name: 'Wöchentliche Reinigung & Kontrolle', event_type: 'cleaning', interval_days: 7, lastOffset: -1, nextOffset: 6 },
    { name: 'Wöchentliche Rundlaufkontrolle', event_type: 'inspection', interval_days: 7, lastOffset: -5, nextOffset: 2 },
    { name: 'Monatliche Oberflächenmessung', event_type: 'inspection', interval_days: 30, lastOffset: -10, nextOffset: 20 },
    { name: 'Monatliche Hülsenpflege (Antihaft-Spray)', event_type: 'maintenance', interval_days: 30, lastOffset: -24, nextOffset: 6 },
    { name: 'Jährliche Nachschleifung Oberfläche', event_type: 'maintenance', interval_days: 365, lastOffset: -200, nextOffset: 165 },
    { name: 'Jährliche Rundlaufzertifizierung', event_type: 'inspection', interval_days: 365, lastOffset: -310, nextOffset: 55 },
  ],
}

// Fallback für unbekannte Kategorien
const DEFAULT_TEMPLATES = [
  { name: 'Wöchentliche Reinigung', event_type: 'cleaning',    interval_days: 7,   lastOffset: -3,  nextOffset: 4  },
  { name: 'Wöchentliche Sichtprüfung', event_type: 'inspection', interval_days: 7, lastOffset: -5, nextOffset: 2 },
  { name: 'Monatliche Wartung', event_type: 'maintenance', interval_days: 30, lastOffset: -15, nextOffset: 15 },
  { name: 'Monatliche Inspektion', event_type: 'inspection', interval_days: 30, lastOffset: -8, nextOffset: 22 },
  { name: 'Jährliche Revision', event_type: 'overhaul',    interval_days: 365, lastOffset: -200, nextOffset: 165 },
  { name: 'Jährliche Prüfung', event_type: 'inspection',   interval_days: 365, lastOffset: -330, nextOffset: 35 },
]

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { data: assets, error: aErr } = await sb.from('assets')
    .select('id, title, category')
    .eq('organization_id', ORG_ID)
    .is('deleted_at', null)

  if (aErr) { console.error('Assets laden:', aErr.message); process.exit(1) }
  console.log(`Lege Wartungsintervalle für ${assets.length} Assets an...\n`)

  // Bestehende Schedules löschen
  await sb.from('maintenance_schedules').delete().eq('organization_id', ORG_ID)

  let totalSchedules = 0

  for (const asset of assets) {
    const templates = TEMPLATES[asset.category] ?? DEFAULT_TEMPLATES

    const rows = templates.map(t => ({
      asset_id:          asset.id,
      organization_id:   ORG_ID,
      created_by:        USER_ID,
      name:              t.name,
      title:             t.name,
      event_type:        t.event_type,
      interval_days:     t.interval_days,
      last_service_date: subDays(-t.lastOffset),  // lastOffset ist negativ
      next_service_date: addDays(t.nextOffset),
      is_active:         true,
    }))

    const { error } = await sb.from('maintenance_schedules').insert(rows)
    if (error) {
      console.error(`✗ ${asset.title}: ${error.message}`)
    } else {
      const weekly  = rows.filter(r => r.interval_days === 7).length
      const monthly = rows.filter(r => r.interval_days === 30).length
      const yearly  = rows.filter(r => r.interval_days === 365).length
      console.log(`✓ ${asset.title.padEnd(50)} ${weekly}× wöchentlich  ${monthly}× monatlich  ${yearly}× jährlich`)
      totalSchedules += rows.length
    }
  }

  console.log(`\n✅ ${totalSchedules} Wartungsintervalle für ${assets.length} Assets angelegt.`)
}

main().catch(e => { console.error(e); process.exit(1) })
