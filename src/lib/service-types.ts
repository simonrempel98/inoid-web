export type EventType = {
  value: string
  label: string
  color: string
  icon: string
}

export const EVENT_TYPES: EventType[] = [
  { value: 'inspection',   label: 'Inspektion',      color: '#2980B9', icon: '🔍' },
  { value: 'maintenance',  label: 'Wartung',          color: '#27AE60', icon: '🔧' },
  { value: 'repair',       label: 'Reparatur',        color: '#E74C3C', icon: '🛠️' },
  { value: 'overhaul',     label: 'Überholung',       color: '#8E44AD', icon: '⚙️' },
  { value: 'coating',      label: 'Beschichtung',     color: '#16A085', icon: '🎨' },
  { value: 'cleaning',     label: 'Reinigung',        color: '#1ABC9C', icon: '🧹' },
  { value: 'installation', label: 'Einbau/Montage',   color: '#F39C12', icon: '🏗️' },
  { value: 'incident',     label: 'Vorfall/Schaden',  color: '#C0392B', icon: '⚠️' },
  { value: 'decommission', label: 'Stilllegung',      color: '#7F8C8D', icon: '🔒' },
  { value: 'other',        label: 'Sonstiges',        color: '#95A5A6', icon: '📝' },
]

export function getEventType(value: string): EventType {
  return EVENT_TYPES.find(e => e.value === value) ?? EVENT_TYPES[EVENT_TYPES.length - 1]
}

export const INTERVAL_PRESETS = [
  { label: 'Wöchentlich',     days: 7 },
  { label: 'Monatlich',       days: 30 },
  { label: 'Vierteljährlich', days: 90 },
  { label: 'Halbjährlich',    days: 180 },
  { label: 'Jährlich',        days: 365 },
  { label: '2-jährlich',      days: 730 },
]
