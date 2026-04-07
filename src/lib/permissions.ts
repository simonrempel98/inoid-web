export type AppRole = 'admin' | 'techniker' | 'leser'

export const ROLE_LABELS: Record<AppRole, string> = {
  admin:     'Admin',
  techniker: 'Techniker',
  leser:     'Leser',
}

export const ROLE_COLORS: Record<AppRole, string> = {
  admin:     '#003366',
  techniker: '#0099cc',
  leser:     '#96aed2',
}

export const ROLE_BG: Record<AppRole, string> = {
  admin:     '#e8f0ff',
  techniker: '#e6f6ff',
  leser:     '#f4f6f9',
}

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin:     'Vollzugriff: Assets, Service, Org-Struktur, Teams & Mitglieder verwalten',
  techniker: 'Assets & Service bearbeiten, Org-Struktur nur lesen',
  leser:     'Alles nur lesen, nichts bearbeiten oder anlegen',
}

export function can(role: AppRole) {
  return {
    // Assets
    editAssets:   role === 'admin' || role === 'techniker',
    deleteAssets: role === 'admin',
    // Service
    editService:  role === 'admin' || role === 'techniker',
    // Org-Struktur
    editOrgStructure: role === 'admin',
    // Teams & Mitglieder
    manageTeams:   role === 'admin',
    manageMembers: role === 'admin',
    manageRoles:   role === 'admin',
    // Einstellungen
    editSettings: role === 'admin',
    // Vorlagen
    editTemplates: role === 'admin' || role === 'techniker',
  }
}
