export type EventType = {
  value: string
  label: string
  color: string
}

// Alle Farben aus der INOMETA-Palette (Blautöne + neutrale Akzente)
export const EVENT_TYPES: EventType[] = [
  { value: 'inspection',   label: 'Inspektion',     color: '#0099cc' },
  { value: 'maintenance',  label: 'Wartung',         color: '#003366' },
  { value: 'repair',       label: 'Reparatur',       color: '#0077b6' },
  { value: 'overhaul',     label: 'Überholung',      color: '#005c8a' },
  { value: 'coating',      label: 'Beschichtung',    color: '#00a8c8' },
  { value: 'cleaning',     label: 'Reinigung',       color: '#38b2d4' },
  { value: 'installation', label: 'Einbau/Montage',  color: '#004e8c' },
  { value: 'incident',     label: 'Vorfall/Schaden', color: '#cc4400' },
  { value: 'decommission', label: 'Stilllegung',     color: '#6b7d99' },
  { value: 'other',        label: 'Sonstiges',       color: '#96aed2' },
]

export function getEventType(value: string): EventType {
  return EVENT_TYPES.find(e => e.value === value) ?? EVENT_TYPES[EVENT_TYPES.length - 1]
}

export const INTERVAL_PRESETS = [
  { label: 'Wöchentlich',     days: 7   },
  { label: 'Monatlich',       days: 30  },
  { label: 'Vierteljährlich', days: 90  },
  { label: 'Halbjährlich',    days: 180 },
  { label: 'Jährlich',        days: 365 },
  { label: '2-jährlich',      days: 730 },
]
