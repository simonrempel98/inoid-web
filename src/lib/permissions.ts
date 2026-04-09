export type AppRole = 'superadmin' | 'admin' | 'techniker' | 'leser'

export const ROLE_LABELS: Record<AppRole, string> = {
  superadmin: 'Superadmin',
  admin:      'Admin',
  techniker:  'Techniker',
  leser:      'Leser',
}

export const ROLE_COLORS: Record<AppRole, string> = {
  superadmin: '#7c3aed',   // Violett
  admin:      '#b45309',   // Gold/Amber
  techniker:  '#475569',   // Silber/Slate
  leser:      '#92400e',   // Bronze
}

export const ROLE_BG: Record<AppRole, string> = {
  superadmin: '#ede9fe',
  admin:      '#fef3c7',
  techniker:  '#f1f5f9',
  leser:      '#fef6ee',
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
