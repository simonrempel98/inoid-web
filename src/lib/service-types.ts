import {
  Search, Wrench, Hammer, Settings2, Layers,
  Sparkles, Package, AlertTriangle, Archive, FileText,
  type LucideIcon,
} from 'lucide-react'

export type EventType = {
  value: string
  label: string
  color: string
  icon: LucideIcon
}

// Alle Farben aus der INOMETA-Palette (Blautöne + neutrale Akzente)
export const EVENT_TYPES: EventType[] = [
  { value: 'inspection',   label: 'Inspektion',     color: '#0099cc', icon: Search        },
  { value: 'maintenance',  label: 'Wartung',         color: '#003366', icon: Wrench        },
  { value: 'repair',       label: 'Reparatur',       color: '#0077b6', icon: Hammer        },
  { value: 'overhaul',     label: 'Überholung',      color: '#005c8a', icon: Settings2     },
  { value: 'coating',      label: 'Beschichtung',    color: '#00a8c8', icon: Layers        },
  { value: 'cleaning',     label: 'Reinigung',       color: '#38b2d4', icon: Sparkles      },
  { value: 'installation', label: 'Einbau/Montage',  color: '#004e8c', icon: Package       },
  { value: 'incident',     label: 'Vorfall/Schaden', color: '#cc4400', icon: AlertTriangle },
  { value: 'decommission', label: 'Stilllegung',     color: '#6b7d99', icon: Archive       },
  { value: 'other',        label: 'Sonstiges',       color: '#96aed2', icon: FileText      },
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
