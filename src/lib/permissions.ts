export type AppRole = 'superadmin' | 'admin' | 'techniker' | 'leser'

export const ROLE_LABELS: Record<AppRole, string> = {
  superadmin: 'Superadmin',
  admin:      'Admin',
  techniker:  'Techniker',
  leser:      'Leser',
}

export const ROLE_COLORS: Record<AppRole, string> = {
  superadmin: '#7c3aed',
  admin:      '#003366',
  techniker:  '#0099cc',
  leser:      '#96aed2',
}

export const ROLE_BG: Record<AppRole, string> = {
  superadmin: '#f3eeff',
  admin:      '#e8f0ff',
  techniker:  '#e6f6ff',
  leser:      '#f4f6f9',
}

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  superadmin: 'Vollzugriff über alle Bereiche – kann keine Rechte entzogen werden, auch nicht von anderen Admins',
  admin:      'Vollzugriff: Assets, Service, Org-Struktur, Teams & Mitglieder verwalten',
  techniker:  'Assets & Service bearbeiten, Org-Struktur nur lesen',
  leser:      'Alles nur lesen, nichts bearbeiten oder anlegen',
}

export function isSuperOrAdmin(role: AppRole) {
  return role === 'superadmin' || role === 'admin'
}

export function can(role: AppRole) {
  const isAdmin = role === 'admin' || role === 'superadmin'
  return {
    // Assets
    editAssets:   isAdmin || role === 'techniker',
    deleteAssets: isAdmin,
    // Service
    editService:  isAdmin || role === 'techniker',
    // Org-Struktur
    editOrgStructure: isAdmin,
    // Teams & Mitglieder
    manageTeams:   isAdmin,
    manageMembers: isAdmin,
    manageRoles:   isAdmin,
    // Einstellungen
    editSettings: isAdmin,
    // Vorlagen
    editTemplates: isAdmin || role === 'techniker',
  }
}
