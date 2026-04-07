import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const SUPABASE_URL = 'https://kibiqlffegqrvvaudcju.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpYmlxbGZmZWdxcnZ2YXVkY2p1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTI4NTM3NiwiZXhwIjoyMDkwODYxMzc2fQ.1vOusjzdqErDA_9-EijLKUoqWwKRm3lPbHLZpT4j_To'
const TARGET_EMAIL = 'simonrempel98@icloud.com'

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rand(min, max) { return (Math.random() * (max - min) + min).toFixed(2) }

// ─── Flexodruck-Produkte von Inomet ──────────────────────────────────────────

const ASSETS = [
  // ── Trägerhülsen ──────────────────────────────────────────────────────────
  {
    title: 'Trägerhülse Carbon CF-75',
    category: 'Trägerhülsen',
    manufacturer: 'Inomet GmbH',
    description: 'Leichtbau-Trägerhülse aus Kohlefaserverbund (CFK) für Flexodruckmaschinen. Innen-Ø 75,6 mm. Höchste Rundlaufpräzision durch Autoklav-Fertigung.',
    article_number: 'INO-CF-75-400',
    serial_number: 'SN-CF75-2023-0471',
    order_number: 'ORD-2023-1140',
    status: 'active',
    location: 'Druckhülsenlager R3',
    image_urls: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80'],
    technical_data: {
      'Innen-Ø': '75,6 mm', 'Außen-Ø': '119,6 mm',
      'Wanddicke': '22 mm', 'Länge': '1.400 mm',
      'Material': 'CFK (Carbon)', 'Oberfläche': 'Hartchrom geschliffen',
      'Rundlauftoleranz': '< 0,01 mm', 'Max. Druckgeschwindigkeit': '600 m/min',
      'Druckhärte Oberfläche': '950 HV', 'Gewicht': '3,8 kg',
    },
    commercial_data: {
      'Kaufpreis': '1.280 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '12.03.2023', 'Garantie': '12 Monate',
      'Kostenstelle': 'KST-Druck-01', 'Mindestbestand': '6 Stück',
      'Listenpreis (netto)': '1.180 €', 'Rabatt': '8 %',
    },
  },
  {
    title: 'Trägerhülse Carbon CF-100',
    category: 'Trägerhülsen',
    manufacturer: 'Inomet GmbH',
    description: 'CFK-Trägerhülse für breite Druckwerke. Innen-Ø 100,6 mm. Kompatibel mit allen gängigen Air-Mandrel-Systemen (Böttcher, Windmöller, W&H).',
    article_number: 'INO-CF-100-400',
    serial_number: 'SN-CF100-2023-0209',
    order_number: 'ORD-2023-0882',
    status: 'active',
    location: 'Druckhülsenlager R3',
    image_urls: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80'],
    technical_data: {
      'Innen-Ø': '100,6 mm', 'Außen-Ø': '134,6 mm',
      'Wanddicke': '17 mm', 'Länge': '1.650 mm',
      'Material': 'CFK (Carbon)', 'Oberfläche': 'Hartchrom geschliffen',
      'Rundlauftoleranz': '< 0,01 mm', 'Max. Druckgeschwindigkeit': '600 m/min',
      'Gewicht': '4,2 kg', 'Kupplung': 'Air-Lock kompatibel',
    },
    commercial_data: {
      'Kaufpreis': '1.540 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '08.02.2023', 'Garantie': '12 Monate',
      'Kostenstelle': 'KST-Druck-01', 'Mindestbestand': '4 Stück',
      'Listenpreis (netto)': '1.420 €', 'Rabatt': '8 %',
    },
  },
  {
    title: 'Trägerhülse Glasfaser GF-150',
    category: 'Trägerhülsen',
    manufacturer: 'Inomet GmbH',
    description: 'Glasfaser-Trägerhülse für schwere Druckwerke und lange Auflagen. Innen-Ø 150,6 mm. Hohe Biegesteifigkeit auch bei großer Aufspannlänge.',
    article_number: 'INO-GF-150-500',
    serial_number: 'SN-GF150-2022-1034',
    order_number: 'ORD-2022-3310',
    status: 'active',
    location: 'Druckhülsenlager R4',
    image_urls: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80'],
    technical_data: {
      'Innen-Ø': '150,6 mm', 'Außen-Ø': '196,6 mm',
      'Wanddicke': '23 mm', 'Länge': '2.000 mm',
      'Material': 'GFK (Glasfaser)', 'Oberfläche': 'Hartchrom geschliffen',
      'Rundlauftoleranz': '< 0,012 mm', 'Max. Druckgeschwindigkeit': '400 m/min',
      'Gewicht': '9,4 kg', 'Druckhärte Oberfläche': '900 HV',
    },
    commercial_data: {
      'Kaufpreis': '1.890 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '19.09.2022', 'Garantie': '12 Monate',
      'Kostenstelle': 'KST-Druck-01', 'Mindestbestand': '2 Stück',
      'Listenpreis (netto)': '1.750 €', 'Rabatt': '8 %',
    },
  },

  // ── Anilox-Sleeves ────────────────────────────────────────────────────────
  {
    title: 'Anilox-Sleeve 700 L/cm, 3,0 cm³/m²',
    category: 'Anilox-Sleeves',
    manufacturer: 'Inomet GmbH',
    description: 'Keramisch beschichteter Anilox-Sleeve für Feinrasterdruck (Verpackungsdruck, Displays). 700 L/cm Linierung, Zellvolumen 3,0 cm³/m², Winkel 60°.',
    article_number: 'INO-ANX-700-3,0-60',
    serial_number: 'SN-ANX700-2023-0055',
    order_number: 'ORD-2023-0441',
    status: 'active',
    location: 'Anilox-Lager A1',
    image_urls: ['https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80'],
    technical_data: {
      'Linierung': '700 L/cm', 'Zellvolumen': '3,0 cm³/m²',
      'Rasterwinkel': '60°', 'Zellgeometrie': 'Hexagonal',
      'Beschichtung': 'Keramik (Al₂O₃)', 'Beschichtungsdicke': '0,10 mm',
      'Innen-Ø': '100,6 mm', 'Oberfläche Rauheit Ra': '< 0,15 µm',
      'Max. Farbschichtstärke': '1,2 µm', 'Kompatible Farben': 'UV, Wasserbasiert, Lösemittel',
    },
    commercial_data: {
      'Kaufpreis': '3.200 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '05.04.2023', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Druck-02', 'Rekonditionierbar': 'Ja, bis 5×',
      'Listenpreis (netto)': '2.950 €', 'Mindestbestand': '2 Stück',
    },
  },
  {
    title: 'Anilox-Sleeve 400 L/cm, 7,0 cm³/m²',
    category: 'Anilox-Sleeves',
    manufacturer: 'Inomet GmbH',
    description: 'Anilox-Sleeve für Volltonfelder, Lackanwendungen und Primers. 400 L/cm, hohes Zellvolumen für hohe Farbübertragung.',
    article_number: 'INO-ANX-400-7,0-60',
    serial_number: 'SN-ANX400-2022-0119',
    order_number: 'ORD-2022-2201',
    status: 'active',
    location: 'Anilox-Lager A1',
    image_urls: ['https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80'],
    technical_data: {
      'Linierung': '400 L/cm', 'Zellvolumen': '7,0 cm³/m²',
      'Rasterwinkel': '60°', 'Zellgeometrie': 'Hexagonal',
      'Beschichtung': 'Keramik (Al₂O₃)', 'Beschichtungsdicke': '0,12 mm',
      'Innen-Ø': '100,6 mm', 'Oberfläche Rauheit Ra': '< 0,20 µm',
      'Max. Farbschichtstärke': '3,5 µm', 'Kompatible Farben': 'UV, Wasserbasiert, Primer',
    },
    commercial_data: {
      'Kaufpreis': '2.950 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '15.07.2022', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Druck-02', 'Rekonditionierbar': 'Ja, bis 5×',
      'Listenpreis (netto)': '2.720 €', 'Mindestbestand': '2 Stück',
    },
  },
  {
    title: 'Anilox-Walze Chrom 200 L/cm, 22 cm³/m²',
    category: 'Anilox-Walzen',
    manufacturer: 'Inomet GmbH',
    description: 'Chromstahlgravierte Anilox-Walze für pastöse Farben, Kaltleim und schwere Lacke. Vollwalze mit beidseitigem Zapfen, nicht als Sleeve.',
    article_number: 'INO-AWC-200-22-CR',
    serial_number: 'SN-AWC200-2021-0031',
    order_number: 'ORD-2021-0780',
    status: 'active',
    location: 'Anilox-Lager A2',
    image_urls: ['https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80'],
    technical_data: {
      'Linierung': '200 L/cm', 'Zellvolumen': '22 cm³/m²',
      'Rasterwinkel': '45°', 'Zellgeometrie': 'Pyramidal',
      'Beschichtung': 'Hartchrom', 'Walzen-Ø': '160 mm',
      'Ballenlänge': '1.400 mm', 'Zapfen-Ø': '60 mm',
      'Gewicht': '28 kg', 'Kompatible Medien': 'Kaltleim, Pastös, Lösemittel',
    },
    commercial_data: {
      'Kaufpreis': '5.800 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '22.11.2021', 'Garantie': '12 Monate',
      'Kostenstelle': 'KST-Druck-02', 'Rekonditionierbar': 'Ja, bis 3×',
      'Abschreibung': '5 Jahre', 'Versicherungswert': '6.500 €',
    },
  },

  // ── Adapter ───────────────────────────────────────────────────────────────
  {
    title: 'Brückenadapter BA-75/100',
    category: 'Adapter & Brücken',
    manufacturer: 'Inomet GmbH',
    description: 'Luftkissen-Brückenadapter für die Aufnahme von Ø 100,6 mm Hülsen auf Ø 75,6 mm Zylinder. Präzisionsgefertigt aus Aluminium mit Hartanodisierung.',
    article_number: 'INO-BA-75-100-AL',
    serial_number: 'SN-BA75100-2023-0188',
    order_number: 'ORD-2023-0560',
    status: 'active',
    location: 'Adapter-Lager B1',
    image_urls: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80'],
    technical_data: {
      'Innen-Ø (Zylinder)': '75,6 mm', 'Außen-Ø (Hülse)': '100,6 mm',
      'Länge': '1.400 mm', 'Material': 'Aluminium 7075 hartanodisiert',
      'Wanddicke': '12,5 mm', 'Luftdruck Aufblasen': '6 bar',
      'Rundlauftoleranz': '< 0,008 mm', 'Gewicht': '2,1 kg',
      'Druckluftanschluss': 'G 1/8"', 'Oberflächenhärte': '450 HV',
    },
    commercial_data: {
      'Kaufpreis': '2.100 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '18.04.2023', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Druck-03', 'Mindestbestand': '3 Stück',
      'Listenpreis (netto)': '1.940 €', 'Rabatt': '8 %',
    },
  },
  {
    title: 'Brückenadapter BA-100/150',
    category: 'Adapter & Brücken',
    manufacturer: 'Inomet GmbH',
    description: 'Luftkissen-Brückenadapter für Ø 150,6 mm Hülsen auf Ø 100,6 mm Zylinder. Geeignet für breite Mehrfarbendruckwerke.',
    article_number: 'INO-BA-100-150-AL',
    serial_number: 'SN-BA100150-2022-0077',
    order_number: 'ORD-2022-1450',
    status: 'active',
    location: 'Adapter-Lager B1',
    image_urls: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80'],
    technical_data: {
      'Innen-Ø (Zylinder)': '100,6 mm', 'Außen-Ø (Hülse)': '150,6 mm',
      'Länge': '1.650 mm', 'Material': 'Aluminium 7075 hartanodisiert',
      'Wanddicke': '25 mm', 'Luftdruck Aufblasen': '6 bar',
      'Rundlauftoleranz': '< 0,010 mm', 'Gewicht': '4,8 kg',
      'Druckluftanschluss': 'G 1/8"', 'Oberflächenhärte': '450 HV',
    },
    commercial_data: {
      'Kaufpreis': '2.650 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '07.07.2022', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Druck-03', 'Mindestbestand': '2 Stück',
      'Listenpreis (netto)': '2.450 €', 'Rabatt': '8 %',
    },
  },

  // ── Rakelmesser ───────────────────────────────────────────────────────────
  {
    title: 'Rakelmesser Stahl 0,15 × 30 mm',
    category: 'Rakelmesser',
    manufacturer: 'Inomet GmbH',
    description: 'Präzisions-Rakelmesser aus gehärtetem Federstahl. Einseitig angeschrägt (Bevel 40°). Für keramische und Chromstahl-Aniloxwalzen.',
    article_number: 'INO-RK-015-30-S',
    serial_number: 'SN-RK-2024-BULK',
    order_number: 'ORD-2024-0301',
    status: 'active',
    location: 'Verbrauchsmittellager',
    image_urls: ['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80'],
    technical_data: {
      'Dicke': '0,15 mm', 'Breite': '30 mm',
      'Material': 'Federstahl gehärtet', 'Härte': '650 HV',
      'Bevel-Winkel': '40°', 'Bevel-Länge': '3 mm',
      'Standardlänge': '1.000 mm', 'Toleranz Dicke': '±0,005 mm',
      'Anwendung': 'Keramik + Chromstahl Anilox', 'Kompatibel': 'Kammrakel, offene Rakel',
    },
    commercial_data: {
      'Preis pro 100 Stück': '148 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '10.01.2024', 'Lieferzeit': '3–5 Werktage',
      'Kostenstelle': 'KST-Verbrauch', 'Mindestbestellmenge': '100 Stück',
      'Lagerbestand': '600 Stück', 'Reichweite (geschätzt)': '30 Tage',
    },
  },
  {
    title: 'Rakelmesser Composite 0,25 × 50 mm',
    category: 'Rakelmesser',
    manufacturer: 'Inomet GmbH',
    description: 'Hochleistungs-Rakelmesser aus Faserverbund-Composite. Schonend für keramische Anilox-Beschichtungen, deutlich längere Standzeit vs. Stahl.',
    article_number: 'INO-RK-025-50-C',
    serial_number: 'SN-RKC-2023-BULK',
    order_number: 'ORD-2023-2180',
    status: 'active',
    location: 'Verbrauchsmittellager',
    image_urls: ['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80'],
    technical_data: {
      'Dicke': '0,25 mm', 'Breite': '50 mm',
      'Material': 'Carbon-Composite', 'Flexibilität': 'Halbflexibel',
      'Bevel-Winkel': '45°', 'Bevel-Länge': '5 mm',
      'Standardlänge': '1.000 mm', 'Temperaturbeständigkeit': 'bis 120 °C',
      'Lösemittelbeständigkeit': 'Sehr gut', 'Standzeit vs. Stahl': 'ca. 3–4×',
    },
    commercial_data: {
      'Preis pro 50 Stück': '210 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '14.09.2023', 'Lieferzeit': '5–7 Werktage',
      'Kostenstelle': 'KST-Verbrauch', 'Mindestbestellmenge': '50 Stück',
      'Lagerbestand': '200 Stück', 'Reichweite (geschätzt)': '45 Tage',
    },
  },

  // ── Kammrakel-Systeme ─────────────────────────────────────────────────────
  {
    title: 'Kammrakel-System KRS-300',
    category: 'Kammrakel-Systeme',
    manufacturer: 'Inomet GmbH',
    description: 'Geschlossenes Kammrakel-System aus Edelstahl und Kunststoff für hygienischen Farbkreislauf. Geeignet für UV-, Wasser- und Lösemittelfarben.',
    article_number: 'INO-KRS-300-SS',
    serial_number: 'SN-KRS300-2022-0041',
    order_number: 'ORD-2022-0910',
    status: 'active',
    location: 'Druckmaschine W&H MIRAFLEX',
    image_urls: ['https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80'],
    technical_data: {
      'Arbeitslänge': '300–1.800 mm (stufenlos)', 'Rakelbreite kompatibel': '30–80 mm',
      'Kammermaterial': 'Edelstahl 1.4571', 'Dichtung': 'EPDM / Viton (wechselbar)',
      'Betriebsdruck': 'max. 1,5 bar', 'Anschlüsse': 'G 3/4" Ein-/Auslass',
      'Befestigung': 'T-Nut-Schiene', 'Gewicht': '2,8 kg/m',
      'Temperaturbereich': '–10 bis +80 °C', 'Schnittstelle': 'Pneumatisch, 6 bar',
    },
    commercial_data: {
      'Kaufpreis': '4.200 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '22.06.2022', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Druck-04', 'Abschreibung': '5 Jahre',
      'Ersatzteile': 'Dichtungssatz INO-KRS-DS-300', 'Wartungsintervall': 'Wöchentlich',
    },
  },

  // ── Farbpumpen ────────────────────────────────────────────────────────────
  {
    title: 'Pneumatische Farbpumpe PF-200 1:1',
    category: 'Farbpumpen',
    manufacturer: 'Inomet GmbH',
    description: 'Druckluftbetriebene Membranpumpe 1:1 für wasserbasierte Flexodruckfarben. Selbstansaugend, pulsationsfrei durch Doppelmembran.',
    article_number: 'INO-PF200-1-1-W',
    serial_number: 'SN-PF200-2023-0312',
    order_number: 'ORD-2023-0715',
    status: 'active',
    location: 'Farbküche Station 2',
    image_urls: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80'],
    technical_data: {
      'Übersetzungsverhältnis': '1:1', 'Max. Förderdruck': '7 bar',
      'Fördervolumen': '20 L/min', 'Druckluftanschluss': 'G 1/2"',
      'Luftverbrauch': '30 NL/min', 'Anschlüsse Farbseite': 'G 3/4"',
      'Membranmaterial': 'PTFE', 'Gehäuse': 'PP (Polypropylen)',
      'Medientemperatur': '0–70 °C', 'Selbstansaugung': 'bis 5 m',
    },
    commercial_data: {
      'Kaufpreis': '860 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '02.05.2023', 'Garantie': '12 Monate',
      'Kostenstelle': 'KST-Farbe-01', 'Ersatzmembran': 'INO-MEM-PTFE-200',
      'Abschreibung': '3 Jahre', 'Kompatible Farben': 'Wasser, UV (mit Kit)',
    },
  },
  {
    title: 'Pneumatische Farbpumpe PF-400 2:1',
    category: 'Farbpumpen',
    manufacturer: 'Inomet GmbH',
    description: 'Hochdruckpumpe 2:1 für UV-Farben und lösemittelbasierte Systeme. Ideal für Kammrakel-Betrieb bei kleinen Farbmengen und hohem Druck.',
    article_number: 'INO-PF400-2-1-UV',
    serial_number: 'SN-PF400-2022-0188',
    order_number: 'ORD-2022-1880',
    status: 'active',
    location: 'Farbküche Station 4 (UV)',
    image_urls: ['https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=800&q=80'],
    technical_data: {
      'Übersetzungsverhältnis': '2:1', 'Max. Förderdruck': '14 bar',
      'Fördervolumen': '12 L/min', 'Druckluftanschluss': 'G 1/2"',
      'Luftverbrauch': '25 NL/min', 'Anschlüsse Farbseite': 'G 1/2"',
      'Membranmaterial': 'PTFE', 'Gehäuse': 'Edelstahl 1.4571',
      'Medientemperatur': '0–60 °C', 'Viskositätsbereich': '20–5.000 mPas',
    },
    commercial_data: {
      'Kaufpreis': '1.340 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '28.09.2022', 'Garantie': '12 Monate',
      'Kostenstelle': 'KST-Farbe-02', 'Ersatzmembran': 'INO-MEM-PTFE-400',
      'Abschreibung': '3 Jahre', 'Kompatible Farben': 'UV, Lösemittel, Wasser',
    },
  },

  // ── Farbmixanlage ─────────────────────────────────────────────────────────
  {
    title: 'Farbmixanlage FM-5000',
    category: 'Farbmischsysteme',
    manufacturer: 'Inomet GmbH',
    description: 'Gravimetrisches Farbmischsystem für bis zu 16 Grundfarben. Vollautomatische Rezepturverwaltung, Barcode-Anbindung und Verbrauchsprotokollierung.',
    article_number: 'INO-FM5000-16K',
    serial_number: 'SN-FM5000-2022-0006',
    order_number: 'ORD-2022-0100',
    status: 'active',
    location: 'Farbküche Zentral',
    image_urls: ['https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&q=80'],
    technical_data: {
      'Kanäle': '16 Grundfarben', 'Wiegegenauigkeit': '±1 g',
      'Max. Ansatzgröße': '50 kg', 'Dosiergenauigkeit': '0,1 %',
      'Schnittstellte': 'Ethernet, USB, Barcode-Scanner',
      'Steuerung': 'Touchpanel 12" (Windows Embedded)',
      'Rührwerk': 'Integriert, drehzahlgeregelt', 'Spülprogramm': 'Automatisch',
      'Druckluftbedarf': '6 bar, 40 NL/min', 'Gewicht': '145 kg',
    },
    commercial_data: {
      'Kaufpreis': '38.500 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '14.02.2022', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Farbe-00', 'Abschreibung': '8 Jahre',
      'Softwarepflege': 'FM-ColorControl 3.2 Jahresupdate', 'Wartungsvertrag': 'Inomet ServicePlus',
    },
  },

  // ── Reinigung ─────────────────────────────────────────────────────────────
  {
    title: 'Anilox-Reinigungsgerät ARG-400 Ultraschall',
    category: 'Reinigungsgeräte',
    manufacturer: 'Inomet GmbH',
    description: 'Ultraschall-Reinigungssystem für Anilox-Walzen und -Sleeves. Kavitationsreinigung bei 40 kHz, vollständige Zellenreinigung ohne mechanischen Verschleiß.',
    article_number: 'INO-ARG400-US',
    serial_number: 'SN-ARG400-2021-0018',
    order_number: 'ORD-2021-2250',
    status: 'active',
    location: 'Reinigungsstation Anilox',
    image_urls: ['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80'],
    technical_data: {
      'Ultraschallfrequenz': '40 kHz', 'Heizleistung': '8 kW',
      'Ultraschallleistung': '1.500 W', 'Wannenvolumen': '200 L',
      'Max. Walzendurchmesser': '400 mm', 'Max. Ballenlänge': '1.800 mm',
      'Betriebstemperatur': 'bis 75 °C', 'Reinigungsmittel': 'Wässrig alkalisch',
      'Reinigungsdauer Typ.': '20–40 min', 'Netzanschluss': '3 × 400 V / 32 A',
    },
    commercial_data: {
      'Kaufpreis': '24.800 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '08.10.2021', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Druck-05', 'Abschreibung': '8 Jahre',
      'Reinigungsmittelverbrauch': 'ca. 2 L/Wäsche', 'Wartungsvertrag': 'Jährlich',
    },
  },

  // ── Rakelhalter ───────────────────────────────────────────────────────────
  {
    title: 'Rakelhalter Universal RH-40',
    category: 'Rakelhalter',
    manufacturer: 'Inomet GmbH',
    description: 'Universeller Rakelhalter für Rakelmesser 20–60 mm Breite. Schnellspannsystem für werkzeugfreien Messerwechsel unter 60 Sekunden.',
    article_number: 'INO-RH40-QC',
    serial_number: 'SN-RH40-2023-0092',
    order_number: 'ORD-2023-0321',
    status: 'active',
    location: 'Druckmaschine Bobst M5',
    image_urls: ['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80'],
    technical_data: {
      'Kompatible Rakelmesserbreite': '20–60 mm', 'Material Halter': 'Aluminium eloxiert',
      'Spannmechanik': 'QuickClamp Exzenter', 'Messerwechsel': '< 60 Sek.',
      'Standardlängen': '200–2.400 mm', 'Anpressdruck': 'Pneumatisch regulierbar',
      'Max. Anpressdruck': '0,5 N/mm', 'Kompatibel mit': 'Kammrakel + offene Rakel',
      'Gewicht': '0,9 kg/m',
    },
    commercial_data: {
      'Kaufpreis': '680 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '25.01.2023', 'Garantie': '24 Monate',
      'Kostenstelle': 'KST-Druck-04', 'Mindestbestand': '4 Stück',
      'Ersatzteile': 'Exzenter-Set INO-RH-EX', 'Abschreibung': '5 Jahre',
    },
  },
  {
    title: 'Druckplatten-Sleeve DPS-75 UV',
    category: 'Druckplatten-Sleeves',
    manufacturer: 'Inomet GmbH',
    description: 'Druckplatten-Sleeve aus CFK für fotopolymere Flexodruckplatten. Speziell für UV-Druckanwendungen und dünnwandige Klebebänder (0,38–0,64 mm).',
    article_number: 'INO-DPS-75-UV-M',
    serial_number: 'SN-DPS75-2023-0301',
    order_number: 'ORD-2023-1005',
    status: 'active',
    location: 'Druckhülsenlager R1',
    image_urls: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80'],
    technical_data: {
      'Innen-Ø': '75,6 mm', 'Außen-Ø': '112,8 mm',
      'Wanddicke': '18,6 mm', 'Länge': '1.400 mm',
      'Material': 'CFK', 'Oberfläche': 'Nitrierter Stahl, geschliffen Ra < 0,2 µm',
      'Klebeband-Kompatibilität': '0,38 / 0,50 / 0,64 mm', 'Rundlauftoleranz': '< 0,01 mm',
      'Oberfläche geschliffen für': 'Photopolymer-Platten', 'Max. Druckgeschwindigkeit': '600 m/min',
    },
    commercial_data: {
      'Kaufpreis': '1.420 €', 'Lieferant': 'Inomet GmbH',
      'Kaufdatum': '14.08.2023', 'Garantie': '12 Monate',
      'Kostenstelle': 'KST-Druck-01', 'Mindestbestand': '4 Stück',
      'Listenpreis (netto)': '1.310 €', 'Rabatt': '8 %',
    },
  },
]

// ─── Service-Event-Vorlagen für Flexodruck ───────────────────────────────────

const WEEKLY = [
  { type: 'cleaning',
    titles: ['Reinigung nach Produktionsende', 'Hülsenreinigung und Sichtprüfung', 'Kammrakel-Spülung und Dichtkontrolle', 'Farbpumpe gespült und gereinigt', 'Rakelmesser gewechselt und Halter gereinigt'],
    notes: ['Keine Beschädigungen festgestellt.', 'Farbrückstände vollständig entfernt.', 'Dichtungen i.O.', 'Leichte Farbkrusten entfernt.'] },
  { type: 'inspection',
    titles: ['Sichtprüfung Anilox-Oberfläche', 'Wöchentliche Druckprüfung Luftkupplung', 'Rundlaufkontrolle Trägerhülse', 'Hülsenoberfläche auf Kratzer geprüft', 'Funktion Schnellspannsystem geprüft'],
    notes: ['Keine Kratzer, Zellbild i.O.', 'Luftdruck 6 bar gehalten.', 'Rundlaufabweichung < 0,01 mm.', 'Oberfläche einwandfrei.'] },
]

const MONTHLY = [
  { type: 'maintenance',
    titles: ['Tiefenreinigung Anilox Ultraschall', 'Zellvolumenmessung BCM (Prüfbericht)', 'Ölwechsel Farbpumpe – Lager geschmiert', 'Dichtungswechsel Kammrakel', 'Monatliche Überprüfung Farbrezepturen FM-5000'],
    notes: ['Zellvolumen i.O., Abweichung < 2 %.', 'Dichtungen erneuert, kein Leck.', 'Reinigungsbad gewechselt.', 'Rezepturen validiert und gespeichert.'] },
  { type: 'inspection',
    titles: ['Monatsmessung Rakelgeometrie (Bevel-Winkel)', 'Volumenkontrolle Farbvorrat und Gebindeanbruch', 'Überprüfung Anpressdruck Rakelhalter', 'Kontrolle Luftdruckversorgung Adapter'],
    notes: ['Bevel-Winkel i.O.', 'Farbvorrat aktualisiert.', 'Anpressdruck 0,3 N/mm eingestellt.', 'Luftdruck 6 bar korrekt.'] },
]

const YEARLY = [
  { type: 'overhaul',
    titles: ['Jahresrevision Anilox-Sleeve – Neuvergütung', 'Rekonditionierung Trägerhülse (Chrom neu)', 'Jahreswartung Farbmixanlage FM-5000', 'Generalüberholung Farbpumpe PF-400', 'Überholung Kammrakel-System – Kompletttausch Dichtungen'],
    notes: ['Zellvolumen nach Rekonditionierung: Sollwert ±1 %.', 'Chromschicht erneuert, Ra < 0,15 µm.', 'Wartungsprotokoll archiviert.'] },
  { type: 'inspection',
    titles: ['Jährliche Kalibrierung Zellvolumen (DAkkS-Protokoll)', 'Jährliche UVV-Prüfung Hebezeuge Reinigungsgerät', 'Wiederkehrende Prüfung Druckleitungen 6 bar', 'Zertifizierungsmessung Rundlaufgenauigkeit'],
    notes: ['Kalibrierprotokoll ausgestellt.', 'Druckprüfprotokoll archiviert.', 'Alle Grenzwerte eingehalten.'] },
]

const EXTRA = [
  { type: 'repair',
    titles: ['Austausch Dichtungsset Farbpumpe', 'Nachschleifen Trägerhülsen-Oberfläche', 'Tausch defekte Membran Pumpe PF-200', 'Reparatur Schnellspannsystem Rakelhalter', 'Behebung Undichtigkeit Kammrakel'],
    notes: ['Ersatzteil aus Lager entnommen.', 'Dichtheit nach Reparatur geprüft.'] },
  { type: 'maintenance',
    titles: ['Softwareupdate FM-ColorControl auf 3.4', 'Einstellung Rakelhalter-Anpressdruck nach Umbau', 'Neuausrichtung Kammrakel nach Formatwechsel', 'Parametrierung Farbpumpe nach Viskositätswechsel'],
    notes: ['Update erfolgreich, Rezepturen migriert.', 'Anpressdruck dokumentiert.'] },
  { type: 'incident',
    titles: ['Kratzer auf Anilox-Sleeve durch Fremdkörper', 'Rakelmesserbruch – Linie gestoppt', 'Luftverlust Brückenadapter – Hülse nicht stabil', 'Farbpumpe ausgefallen – Störung dokumentiert'],
    notes: ['Schadensmeldung an Hersteller weitergeleitet.', 'Ursache behoben, Produktion wieder freigegeben.'] },
  { type: 'cleaning',
    titles: ['Sonderreinigung nach Farbwechsel (Sonderfarbe)', 'Intensivreinigung nach UV-Farb-Unfall', 'Reinigung Farbmixanlage nach Rezepturwechsel'],
    notes: ['Farbwechsel vollständig abgeschlossen.', 'Keine Kreuzkontamination.'] },
]

function generateEvents(assetId, orgId, userId, numEvents) {
  const events = []
  let offset = 8

  for (const tpl of WEEKLY) {
    for (let i = 0; i < 2; i++) {
      events.push({
        asset_id: assetId, organization_id: orgId, created_by: userId,
        event_type: tpl.type,
        title: pick(tpl.titles),
        description: 'Durchgeführt gemäß Wartungsplan Flexodruck. Ergebnis dokumentiert.',
        event_date: daysAgo(offset),
        performed_by: pick(['Drucker 1. Schicht', 'F. Müller', 'Instandhaltung Druckvorstufe', 'A. Kiefer']),
        cost_eur: parseFloat(rand(15, 80)),
        next_service_date: daysAgo(offset - 7),
        notes: pick(tpl.notes),
      })
      offset += 7
    }
  }

  for (const tpl of MONTHLY) {
    for (let i = 0; i < 2; i++) {
      events.push({
        asset_id: assetId, organization_id: orgId, created_by: userId,
        event_type: tpl.type,
        title: pick(tpl.titles),
        description: 'Planmäßige Monatswartung nach Wartungshandbuch Inomet Rev. 4.2.',
        event_date: daysAgo(offset),
        performed_by: pick(['Inomet Servicetechniker', 'Instandhaltung', 'R. Hoffmann', 'Technischer Leiter']),
        cost_eur: parseFloat(rand(80, 450)),
        next_service_date: daysAgo(offset - 30),
        notes: pick(tpl.notes),
      })
      offset += 30
    }
  }

  for (const tpl of YEARLY) {
    for (let i = 0; i < 2; i++) {
      events.push({
        asset_id: assetId, organization_id: orgId, created_by: userId,
        event_type: tpl.type,
        title: pick(tpl.titles),
        description: 'Jährliche Prüfung/Revision nach Vorgabe Hersteller und Betriebsanweisung.',
        event_date: daysAgo(offset),
        performed_by: pick(['Inomet GmbH Serviceabteilung', 'TÜV Rheinland', 'Akkreditiertes Prüflabor', 'Inomet Außendienst']),
        cost_eur: parseFloat(rand(400, 2800)),
        next_service_date: daysAgo(offset - 365),
        notes: pick(tpl.notes),
        external_company: pick(['Inomet GmbH', 'TÜV Rheinland', null, null]),
      })
      offset += 365
    }
  }

  while (events.length < numEvents) {
    const tpl = pick(EXTRA)
    const extraOffset = Math.floor(Math.random() * 60) + 15
    events.push({
      asset_id: assetId, organization_id: orgId, created_by: userId,
      event_type: tpl.type,
      title: pick(tpl.titles),
      description: 'Außerplanmäßige Maßnahme. Dokumentiert und freigegeben.',
      event_date: daysAgo(offset + extraOffset),
      performed_by: pick(['Instandhaltung', 'F. Müller', 'Schichtführer', 'Inomet Service']),
      cost_eur: parseFloat(rand(30, 1500)),
      next_service_date: null,
      notes: pick(tpl.notes),
    })
    offset += extraOffset
  }

  return events
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. User + Org finden
  const { data: { users } } = await sb.auth.admin.listUsers()
  const user = users.find(u => u.email === TARGET_EMAIL)
  if (!user) { console.error('User nicht gefunden'); process.exit(1) }

  const { data: profile } = await sb.from('profiles').select('organization_id').eq('id', user.id).single()
  const orgId = profile.organization_id
  console.log(`✓ User: ${user.id}  Org: ${orgId}`)

  // 2. Alte Assets löschen (hard delete, created_by = dieser User)
  const { data: existing } = await sb.from('assets').select('id').eq('organization_id', orgId).is('deleted_at', null)
  if (existing?.length) {
    const ids = existing.map(a => a.id)
    await sb.from('asset_lifecycle_events').delete().in('asset_id', ids)
    await sb.from('assets').delete().in('id', ids)
    console.log(`✓ ${ids.length} alte Assets + Events gelöscht`)
  }

  // 3. Neue Flexodruck-Assets anlegen
  let created = 0
  for (const asset of ASSETS) {
    const numEvents = Math.floor(Math.random() * 9) + 12 // 12–20
    const assetId = randomUUID()
    const qrCodeUrl = `https://inoid.app/assets/${assetId}`

    const { data: inserted, error } = await sb.from('assets').insert({
      id: assetId,
      organization_id: orgId, created_by: user.id,
      title: asset.title, category: asset.category, manufacturer: asset.manufacturer,
      description: asset.description, article_number: asset.article_number,
      serial_number: asset.serial_number, order_number: asset.order_number,
      status: asset.status, location: asset.location, image_urls: asset.image_urls,
      technical_data: asset.technical_data, commercial_data: asset.commercial_data,
      tags: [asset.category],
      qr_code: qrCodeUrl,
    }).select('id').single()

    if (error || !inserted) { console.error(`✗ ${asset.title}:`, error?.message); continue }

    const events = generateEvents(inserted.id, orgId, user.id, numEvents)
    const { error: evErr } = await sb.from('asset_lifecycle_events').insert(events)
    if (evErr) { console.error(`  ✗ Events "${asset.title}":`, evErr.message) }
    else { console.log(`  ✓ ${asset.title.padEnd(45)} ${events.length} Events`) }
    created++
  }

  console.log(`\n✅ ${created}/${ASSETS.length} Flexodruck-Assets angelegt.`)
}

main().catch(e => { console.error(e); process.exit(1) })
