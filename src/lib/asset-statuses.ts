export type StatusConfig = {
  value: string
  label: string
  color: string
  isSystem?: boolean
}

export const SYSTEM_STATUSES: StatusConfig[] = [
  { value: 'active',           label: 'Aktiv',               color: '#27AE60', isSystem: true },
  { value: 'in_service',       label: 'In Wartung',          color: '#F39C12', isSystem: true },
  { value: 'maintenance_due',  label: 'Fällig für Wartung',  color: '#E67E22', isSystem: true },
  { value: 'offsite',          label: 'Außer Haus',          color: '#9B59B6', isSystem: true },
  { value: 'blocked',          label: 'Gesperrt',            color: '#E74C3C', isSystem: true },
  { value: 'decommissioned',   label: 'Stillgelegt',         color: '#666666', isSystem: true },
]

export function getStatusConfig(value: string, customStatuses: StatusConfig[] = []): StatusConfig {
  return (
    SYSTEM_STATUSES.find(s => s.value === value) ??
    customStatuses.find(s => s.value === value) ??
    { value, label: value, color: '#96aed2' }
  )
}

export function getAllStatuses(customStatuses: StatusConfig[] = []): StatusConfig[] {
  return [...SYSTEM_STATUSES, ...customStatuses]
}

// Status-Badge Styles
export function statusBadgeStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    fontSize: 11, fontWeight: 700,
    padding: '2px 8px', borderRadius: 10,
    backgroundColor: `${color}20`,
    color,
    fontFamily: 'Arial, sans-serif',
  }
}
