import {
  Package, Wrench, Settings, Cog, Hammer, Zap, Battery, Cpu,
  Server, Monitor, Radio, Wifi, Bluetooth, Box, Archive, Layers,
  Thermometer, Gauge, Ruler, Scale, Compass, Truck, Car, Plane,
  Ship, Building2, Warehouse, Plug, CircuitBoard, HardDrive,
  Database, Network, Wind, Droplets, Flame, Sun, Anchor, Shield,
  Lock, Key, Filter, Microscope, Atom, Cable, Power,
  Lightbulb, Factory, Fan, Scissors, Magnet,
  ClipboardList, Barcode, ScanLine, Tag, Boxes, LayoutGrid,
  Loader, RefreshCw, RotateCw, Snowflake, Timer, Clock,
  AlarmClock, Hourglass, Maximize, Minimize, Move,
  ArrowUpDown, ArrowLeftRight, Activity, BarChart2, TrendingUp,
  Leaf, Sprout, Mountain, Circle, Square, Volume2, TestTube2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  // Werkzeug & Mechanik
  Wrench, Settings, Cog, Hammer, Scissors, Magnet,
  // Elektrik & Elektronik
  Zap, Battery, Cpu, CircuitBoard, HardDrive, Plug, Power, Cable, Lightbulb,
  // Industrie & Maschinen
  Factory, Warehouse, Fan, Gauge,
  // Messtechnik
  Thermometer, Ruler, Scale, Compass, Timer, Clock, AlarmClock,
  Hourglass, Activity, BarChart2, TrendingUp, Volume2,
  // IT & Kommunikation
  Server, Monitor, Radio, Wifi, Bluetooth, Database, Network,
  // Transport & Fahrzeuge
  Truck, Car, Plane, Ship, Anchor,
  // Labor & Wissenschaft
  TestTube2, Microscope, Atom,
  // Lager & Logistik
  Package, Box, Archive, Layers, Boxes, Barcode, ScanLine, Tag, ClipboardList,
  // Gebäude & Infrastruktur
  Building2, Filter, LayoutGrid,
  // Umwelt & Energie
  Wind, Droplets, Flame, Sun, Snowflake, Leaf, Sprout, Mountain,
  // Sicherheit
  Shield, Lock, Key,
  // Formen & Bewegung
  Circle, Square, Loader, RefreshCw, RotateCw,
  ArrowUpDown, ArrowLeftRight, Maximize, Minimize, Move,
}

export const ICON_GROUPS: { label: string; icons: string[] }[] = [
  { label: 'Werkzeug & Mechanik', icons: ['Wrench', 'Settings', 'Cog', 'Hammer', 'Scissors', 'Magnet'] },
  { label: 'Elektrik & Elektronik', icons: ['Zap', 'Battery', 'Cpu', 'CircuitBoard', 'Plug', 'Power', 'Cable', 'Lightbulb'] },
  { label: 'Industrie & Maschinen', icons: ['Factory', 'Warehouse', 'Fan', 'Gauge'] },
  { label: 'Messtechnik & Sensorik', icons: ['Thermometer', 'Ruler', 'Scale', 'Compass', 'Timer', 'Clock', 'Hourglass', 'Activity', 'BarChart2', 'TrendingUp', 'Volume2'] },
  { label: 'IT & Kommunikation', icons: ['Server', 'Monitor', 'Radio', 'Wifi', 'Bluetooth', 'Database', 'Network', 'HardDrive'] },
  { label: 'Transport & Fahrzeuge', icons: ['Truck', 'Car', 'Plane', 'Ship', 'Anchor'] },
  { label: 'Labor & Wissenschaft', icons: ['TestTube2', 'Microscope', 'Atom'] },
  { label: 'Lager & Logistik', icons: ['Package', 'Box', 'Archive', 'Layers', 'Boxes', 'Barcode', 'ScanLine', 'Tag', 'ClipboardList'] },
  { label: 'Umwelt & Energie', icons: ['Wind', 'Droplets', 'Flame', 'Sun', 'Snowflake', 'Leaf', 'Sprout', 'Mountain'] },
  { label: 'Sicherheit', icons: ['Shield', 'Lock', 'Key'] },
  { label: 'Sonstiges', icons: ['Filter', 'LayoutGrid', 'Building2', 'Circle', 'Square', 'RefreshCw', 'RotateCw', 'ArrowUpDown', 'Maximize', 'Move'] },
]

type Props = {
  name: string
  size?: number
  color?: string
}

export function TemplateIcon({ name, size = 20, color = 'currentColor' }: Props) {
  const Icon = ICON_MAP[name]
  if (Icon) {
    return <Icon size={size} color={color} strokeWidth={1.75} />
  }
  // Fallback für alte Emoji-Icons
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{name}</span>
}
