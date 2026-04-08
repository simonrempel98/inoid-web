import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: {
    statusTitle: 'Asset-Status',
    statusSubtitle: 'Eigene Status definieren',
    systemStatuses: 'System-Statuses',
    customStatuses: 'Eigene Statuses',
    newStatus: '+ Neu',
    noCustom: 'Noch keine eigenen Statuses',
    createFirst: '+ Ersten anlegen',
    saveStatus: 'Status anlegen',
    statusPlaceholder: 'z.B. Im Einsatz',
    active: 'Aktiv',
    in_service: 'In Wartung',
    maintenance_due: 'Fällig für Wartung',
    offsite: 'Außer Haus',
    blocked: 'Gesperrt',
    decommissioned: 'Stillgelegt',
  },
  en: {
    statusTitle: 'Asset Status',
    statusSubtitle: 'Define custom statuses',
    systemStatuses: 'System statuses',
    customStatuses: 'Custom statuses',
    newStatus: '+ New',
    noCustom: 'No custom statuses yet',
    createFirst: '+ Create first',
    saveStatus: 'Create status',
    statusPlaceholder: 'e.g. In use',
    active: 'Active',
    in_service: 'In maintenance',
    maintenance_due: 'Maintenance due',
    offsite: 'Offsite',
    blocked: 'Blocked',
    decommissioned: 'Decommissioned',
  },
  fr: {
    statusTitle: 'Statut des actifs',
    statusSubtitle: 'Définir des statuts personnalisés',
    systemStatuses: 'Statuts système',
    customStatuses: 'Statuts personnalisés',
    newStatus: '+ Nouveau',
    noCustom: 'Aucun statut personnalisé',
    createFirst: '+ Créer le premier',
    saveStatus: 'Créer le statut',
    statusPlaceholder: 'p.ex. En service',
    active: 'Actif',
    in_service: 'En maintenance',
    maintenance_due: 'Maintenance due',
    offsite: 'Hors site',
    blocked: 'Bloqué',
    decommissioned: 'Désactivé',
  },
  es: {
    statusTitle: 'Estado de activos',
    statusSubtitle: 'Definir estados personalizados',
    systemStatuses: 'Estados del sistema',
    customStatuses: 'Estados personalizados',
    newStatus: '+ Nuevo',
    noCustom: 'Sin estados personalizados',
    createFirst: '+ Crear primero',
    saveStatus: 'Crear estado',
    statusPlaceholder: 'p.ej. En uso',
    active: 'Activo',
    in_service: 'En mantenimiento',
    maintenance_due: 'Mantenimiento pendiente',
    offsite: 'Fuera de sitio',
    blocked: 'Bloqueado',
    decommissioned: 'Dado de baja',
  },
  it: {
    statusTitle: 'Stato degli asset',
    statusSubtitle: 'Definire stati personalizzati',
    systemStatuses: 'Stati di sistema',
    customStatuses: 'Stati personalizzati',
    newStatus: '+ Nuovo',
    noCustom: 'Nessuno stato personalizzato',
    createFirst: '+ Crea il primo',
    saveStatus: 'Crea stato',
    statusPlaceholder: 'es. In uso',
    active: 'Attivo',
    in_service: 'In manutenzione',
    maintenance_due: 'Manutenzione scaduta',
    offsite: 'Fuori sede',
    blocked: 'Bloccato',
    decommissioned: 'Dismesso',
  },
}

for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en
  if (!data.settings) data.settings = {}
  if (!data.settings.statuses) data.settings.statuses = {}
  const s = data.settings.statuses
  s.title = k.statusTitle
  s.subtitle = k.statusSubtitle
  s.systemStatuses = k.systemStatuses
  s.customStatuses = k.customStatuses
  s.newStatus = k.newStatus
  s.noCustom = k.noCustom
  s.createFirst = k.createFirst
  s.saveStatus = k.saveStatus
  s.statusPlaceholder = k.statusPlaceholder
  if (!data.assetStatus) data.assetStatus = {}
  data.assetStatus.active = k.active
  data.assetStatus.in_service = k.in_service
  data.assetStatus.maintenance_due = k.maintenance_due
  data.assetStatus.offsite = k.offsite
  data.assetStatus.blocked = k.blocked
  data.assetStatus.decommissioned = k.decommissioned
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
