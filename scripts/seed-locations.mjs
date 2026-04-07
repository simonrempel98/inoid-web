import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = 'https://kibiqlffegqrvvaudcju.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpYmlxbGZmZWdxcnZ2YXVkY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTM3NiwiZXhwIjoyMDkwODYxMzc2fQ.1vOusjzdqErDA_9-EijLKUoqWwKRm3lPbHLZpT4j_To'
const ORG_ID       = 'd777aa17-92ad-457f-b6b4-77290dd67f79'
const USER_ID      = 'f9caf248-6150-4ef3-9760-fa88f2396a1b'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// ─── Bekannte Locations aus der Org (aus Datenbankabfrage) ───────────────────
const KNOWN = {
  locations: {
    herford:     { id: '59b78873-c737-40c9-8932-1c23542422e9', name: 'Herford' },
    laudenbach:  { id: '4a239986-bd60-4ada-abea-fcff6bfd8334', name: 'Laudenbach' },
    overseas:    { id: '7cfcb8d3-a9a7-44b2-bc90-38a674aa71c5', name: 'Overseas' },
  },
  halls: {
    halle1: { id: 'e68a2e4d-e684-48ec-b9ab-3c5a2081a163', name: 'Halle 1', locationId: '59b78873-c737-40c9-8932-1c23542422e9' },
    halle2: { id: '014b7c02-7545-4266-8c14-5250cbce076f', name: 'Halle 2', locationId: '59b78873-c737-40c9-8932-1c23542422e9' },
    halle3: { id: 'd93ec53f-4c02-4968-8652-a370b968406a', name: 'Halle 3', locationId: '59b78873-c737-40c9-8932-1c23542422e9' },
  },
  areas: {
    fertigung:  { id: 'c02f3004-bb4f-4f68-ac63-976784ba9637', name: 'Fertigung',  hallName: 'Halle 1' },
    montage:    { id: 'd95ad18c-d719-443b-869d-1fc1c8a13724', name: 'Montage',    hallName: 'Halle 1' },
    zerspanung: { id: '03295e76-ec4c-4cdb-b44b-b6501526b676', name: 'Zerspanung', hallName: 'Halle 1' },
    bereichA:   { id: 'd482a952-e29a-4851-ad62-085fb292ec09', name: 'Bereich a',  hallName: 'Halle 2' },
    bereichB:   { id: '8e42610d-82a1-41ab-84d3-687ba4a490e6', name: 'Bereich b',  hallName: 'Halle 2' },
    bereich3a:  { id: '1969bbd9-1d2e-436c-a2c0-a81e5fa9d318', name: 'Bereich 3a', hallName: 'Halle 3' },
    bereich3b:  { id: '794df5c4-ce80-4b74-b7ed-f83b52c9ccf5', name: 'Bereich 3b', hallName: 'Halle 3' },
    bereich3c:  { id: 'ddb920b0-c93f-4e09-85e5-9029b96795bd', name: 'Bereich 3c', hallName: 'Halle 3' },
    bereich3d:  { id: '20b3a6d6-4135-4ae8-8a7c-06aed8dd36b3', name: 'Bereich 3d', hallName: 'Halle 3' },
  },
}

// ─── Standortzuweisungen pro Assetkategorie ───────────────────────────────────
// Flexodruck-typische Zuordnung: Anilox/Trägerhülsen → Fertigung/Druckvorstufe
// Farbpumpen/Mixer → Farbküche (Bereich a/b in Halle 2)
// Reinigung → Halle 3 Bereiche
// Rakelmesser/Rakelhalter → Halle 1 Fertigung/Montage

function locationForCategory(category) {
  const map = {
    'Trägerhülsen':           { area: KNOWN.areas.fertigung },
    'Anilox-Sleeves':         { area: KNOWN.areas.fertigung },
    'Anilox-Walzen':          { area: KNOWN.areas.fertigung },
    'Adapter & Brücken':      { area: KNOWN.areas.montage },
    'Rakelmesser':            { area: KNOWN.areas.montage },
    'Kammrakel-Systeme':      { area: KNOWN.areas.montage },
    'Farbpumpen':             { area: KNOWN.areas.bereichA },
    'Farbmischsysteme':       { area: KNOWN.areas.bereichA },
    'Reinigungsgeräte':       { area: KNOWN.areas.bereich3a },
    'Rakelhalter':            { area: KNOWN.areas.montage },
    'Druckplatten-Sleeves':   { area: KNOWN.areas.fertigung },
  }
  return map[category] ?? { area: KNOWN.areas.fertigung }
}

// Alle Orte für Verlaufseinträge (Mischung aus allen Bereichen + Standorten)
function allLocationOptions() {
  return [
    ...Object.values(KNOWN.areas).map(a => ({
      label: `${a.hallName} › ${a.name}`, ref: `area:${a.id}`
    })),
    ...Object.values(KNOWN.halls).map(h => ({
      label: h.name, ref: `hall:${h.id}`
    })),
    { label: 'Kompetenzcenter', ref: null }, // wird nach Erstellung gefüllt
    { label: 'Herford – Eingang Lager', ref: `location:${KNOWN.locations.herford.id}` },
    { label: 'Laudenbach – Lager', ref: `location:${KNOWN.locations.laudenbach.id}` },
    { label: 'Kompetenzcenter – Schulungsraum', ref: null },
  ]
}

async function main() {
  // ── 1. Kompetenzcenter anlegen ──────────────────────────────────────────
  console.log('Lege Kompetenzcenter an...')
  const { data: kc, error: kcErr } = await sb.from('locations').insert({
    organization_id: ORG_ID,
    name: 'Kompetenzcenter',
    address: 'Planckstr. 15, 32052 Herford',
  }).select('id').single()

  if (kcErr) { console.error('Fehler Kompetenzcenter:', kcErr.message); process.exit(1) }
  const kcId = kc.id
  console.log(`  ✓ Kompetenzcenter: ${kcId}`)

  // ── 2. Hallen im Kompetenzcenter anlegen ───────────────────────────────
  const { data: hallKC } = await sb.from('halls').insert([
    { organization_id: ORG_ID, location_id: kcId, name: 'Schulung & Demo' },
    { organization_id: ORG_ID, location_id: kcId, name: 'Technik & Labor' },
  ]).select('id, name')
  const hallSchulungId = hallKC.find(h => h.name === 'Schulung & Demo').id
  const hallTechnikId  = hallKC.find(h => h.name === 'Technik & Labor').id
  console.log(`  ✓ Hallen im KC: Schulung & Demo (${hallSchulungId}), Technik & Labor (${hallTechnikId})`)

  // ── 3. Bereiche im Kompetenzcenter anlegen ─────────────────────────────
  const { data: areasKC } = await sb.from('areas').insert([
    { organization_id: ORG_ID, hall_id: hallSchulungId, name: 'Demo-Druckwerk' },
    { organization_id: ORG_ID, hall_id: hallSchulungId, name: 'Showroom' },
    { organization_id: ORG_ID, hall_id: hallTechnikId,  name: 'Prüflabor' },
    { organization_id: ORG_ID, hall_id: hallTechnikId,  name: 'Lager Muster' },
  ]).select('id, name')

  const areaDemoDruck  = areasKC.find(a => a.name === 'Demo-Druckwerk').id
  const areaShowroom   = areasKC.find(a => a.name === 'Showroom').id
  const areaPruef      = areasKC.find(a => a.name === 'Prüflabor').id
  const areaLagerMust  = areasKC.find(a => a.name === 'Lager Muster').id
  console.log(`  ✓ Bereiche angelegt: Demo-Druckwerk, Showroom, Prüflabor, Lager Muster`)

  // Für Verlaufseinträge: alle Orte inkl. Kompetenzcenter
  const allLocs = [
    { label: 'Halle 1 › Fertigung',      ref: `area:${KNOWN.areas.fertigung.id}` },
    { label: 'Halle 1 › Montage',        ref: `area:${KNOWN.areas.montage.id}` },
    { label: 'Halle 1 › Zerspanung',     ref: `area:${KNOWN.areas.zerspanung.id}` },
    { label: 'Halle 2 › Bereich a',      ref: `area:${KNOWN.areas.bereichA.id}` },
    { label: 'Halle 2 › Bereich b',      ref: `area:${KNOWN.areas.bereichB.id}` },
    { label: 'Halle 3 › Bereich 3a',     ref: `area:${KNOWN.areas.bereich3a.id}` },
    { label: 'Halle 3 › Bereich 3b',     ref: `area:${KNOWN.areas.bereich3b.id}` },
    { label: 'Halle 3 › Bereich 3c',     ref: `area:${KNOWN.areas.bereich3c.id}` },
    { label: 'Kompetenzcenter – Demo-Druckwerk', ref: `area:${areaDemoDruck}` },
    { label: 'Kompetenzcenter – Showroom',       ref: `area:${areaShowroom}` },
    { label: 'Kompetenzcenter – Prüflabor',      ref: `area:${areaPruef}` },
    { label: 'Kompetenzcenter – Lager Muster',   ref: `area:${areaLagerMust}` },
    { label: 'Herford – Eingang Lager',  ref: `location:${KNOWN.locations.herford.id}` },
    { label: 'Laudenbach – Außenlager',  ref: `location:${KNOWN.locations.laudenbach.id}` },
  ]

  // ── 4. Assets laden ────────────────────────────────────────────────────
  const { data: assets } = await sb.from('assets')
    .select('id, title, category, location, location_ref')
    .eq('organization_id', ORG_ID)
    .is('deleted_at', null)

  console.log(`\nVerarbeite ${assets.length} Assets...`)

  // Zuerst alle bestehenden location_history Einträge löschen
  const assetIds = assets.map(a => a.id)
  await sb.from('asset_location_history').delete().in('asset_id', assetIds)

  for (const asset of assets) {
    // ── Aktuellen Standort basierend auf Kategorie bestimmen ──────────────
    const { area } = locationForCategory(asset.category)

    // Manche Produkte kommen auch mal ins Kompetenzcenter
    const kcVariants = [
      { label: 'Kompetenzcenter – Demo-Druckwerk', ref: `area:${areaDemoDruck}` },
      { label: 'Kompetenzcenter – Prüflabor',      ref: `area:${areaPruef}` },
    ]
    const useKC = Math.random() < 0.35 // 35% landen aktuell im KC
    const currentLoc = useKC ? pick(kcVariants) : { label: `Halle 1 › ${area.name}`, ref: `area:${area.id}` }

    // Asset aktualisieren
    await sb.from('assets').update({
      location: currentLoc.label,
      location_ref: currentLoc.ref,
    }).eq('id', asset.id)

    // ── Standortverlauf erzeugen (4–8 Einträge) ────────────────────────────
    const count = randInt(4, 8)
    const historyLocs = []

    // Startort: immer Herford Lager oder Laudenbach (Eingang/Wareneingang)
    historyLocs.push({ label: 'Herford – Wareneingang', ref: `location:${KNOWN.locations.herford.id}` })

    // Zwischenstationen aus allLocs (ohne aktuellen Standort, ohne Duplikate)
    const pool = allLocs.filter(l => l.ref !== currentLoc.ref)
    while (historyLocs.length < count - 1) {
      const candidate = pick(pool)
      if (!historyLocs.find(h => h.ref === candidate.ref)) {
        historyLocs.push(candidate)
      }
    }

    // Aktuellen Ort als letzten Eintrag (jüngster)
    historyLocs.push(currentLoc)

    // Zeitstempel: von ältestem zu jüngstem (vor 730 bis vor 5 Tagen)
    const totalDays = 730
    const step = Math.floor(totalDays / historyLocs.length)
    const historyRows = historyLocs.map((loc, i) => {
      const daysBack = totalDays - i * step - randInt(0, step - 1)
      return {
        asset_id: asset.id,
        organization_id: ORG_ID,
        location: loc.label,
        changed_at: daysAgo(Math.max(daysBack, i === historyLocs.length - 1 ? 5 : daysBack)),
      }
    })

    // Nach changed_at sortieren (älteste zuerst)
    historyRows.sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at))

    const { error: histErr } = await sb.from('asset_location_history').insert(historyRows)
    if (histErr) {
      console.error(`  ✗ History für "${asset.title}": ${histErr.message}`)
    } else {
      console.log(`  ✓ ${asset.title.padEnd(48)} → ${currentLoc.label.padEnd(35)} (${historyRows.length} Verlaufseinträge)`)
    }
  }

  console.log('\n✅ Fertig.')
}

main().catch(e => { console.error(e); process.exit(1) })
