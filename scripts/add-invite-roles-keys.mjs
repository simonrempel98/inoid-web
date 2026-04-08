import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: {
    // Invite
    emailLabel: 'E-Mail-Adresse des neuen Mitglieds',
    create: 'Anlegen',
    pending: 'Ausstehend',
    members: 'Mitglieder',
    accepted: 'Angenommen',
    expired: 'Abgelaufen',
    timeLeft: '{h}h {m}m verbleibend',
    copyLink: 'Link',
    copied: 'Kopiert',
    alreadyMember: 'Diese E-Mail-Adresse ist bereits Mitglied.',
    noRole: 'Keine Rolle gefunden. Bitte zuerst eine Rolle anlegen.',
    inviteError: 'Fehler beim Erstellen der Einladung.',
    noMembers: 'Noch keine Mitglieder angelegt.',
    active: 'Aktiv',
    // Roles
    you: 'du',
    membersCount: 'Mitglieder · {count}',
    onlyAdmins: 'Nur Admins können Rollen ändern.',
    adminLabel: 'Admin',
    adminDesc: 'Vollzugriff: Assets, Service, Org-Struktur, Teams & Mitglieder verwalten',
    technikerLabel: 'Techniker',
    technikerDesc: 'Assets & Service bearbeiten, Org-Struktur nur lesen',
    leserLabel: 'Leser',
    leserDesc: 'Alles nur lesen, nichts bearbeiten oder anlegen',
  },
  en: {
    emailLabel: 'Email address of the new member',
    create: 'Create',
    pending: 'Pending',
    members: 'Members',
    accepted: 'Accepted',
    expired: 'Expired',
    timeLeft: '{h}h {m}m remaining',
    copyLink: 'Link',
    copied: 'Copied',
    alreadyMember: 'This email address is already a member.',
    noRole: 'No role found. Please create a role first.',
    inviteError: 'Error creating invitation.',
    noMembers: 'No members yet.',
    active: 'Active',
    you: 'you',
    membersCount: 'Members · {count}',
    onlyAdmins: 'Only admins can change roles.',
    adminLabel: 'Admin',
    adminDesc: 'Full access: manage assets, service, org structure, teams & members',
    technikerLabel: 'Technician',
    technikerDesc: 'Edit assets & service, read-only org structure',
    leserLabel: 'Reader',
    leserDesc: 'Read-only access, no editing or creation',
  },
  fr: {
    emailLabel: 'Adresse e-mail du nouveau membre',
    create: 'Créer',
    pending: 'En attente',
    members: 'Membres',
    accepted: 'Accepté',
    expired: 'Expiré',
    timeLeft: '{h}h {m}m restant',
    copyLink: 'Lien',
    copied: 'Copié',
    alreadyMember: 'Cette adresse e-mail est déjà membre.',
    noRole: 'Aucun rôle trouvé. Veuillez d\'abord créer un rôle.',
    inviteError: 'Erreur lors de la création de l\'invitation.',
    noMembers: 'Aucun membre encore.',
    active: 'Actif',
    you: 'vous',
    membersCount: 'Membres · {count}',
    onlyAdmins: 'Seuls les admins peuvent modifier les rôles.',
    adminLabel: 'Admin',
    adminDesc: 'Accès complet: gérer les actifs, service, structure org, équipes & membres',
    technikerLabel: 'Technicien',
    technikerDesc: 'Modifier les actifs & service, structure org en lecture seule',
    leserLabel: 'Lecteur',
    leserDesc: 'Accès lecture seule, pas de modification ou création',
  },
  es: {
    emailLabel: 'Dirección de correo del nuevo miembro',
    create: 'Crear',
    pending: 'Pendiente',
    members: 'Miembros',
    accepted: 'Aceptado',
    expired: 'Expirado',
    timeLeft: '{h}h {m}m restante',
    copyLink: 'Enlace',
    copied: 'Copiado',
    alreadyMember: 'Esta dirección de correo ya es miembro.',
    noRole: 'No se encontró rol. Por favor crea un rol primero.',
    inviteError: 'Error al crear la invitación.',
    noMembers: 'Sin miembros aún.',
    active: 'Activo',
    you: 'tú',
    membersCount: 'Miembros · {count}',
    onlyAdmins: 'Solo los admins pueden cambiar roles.',
    adminLabel: 'Admin',
    adminDesc: 'Acceso completo: gestionar activos, servicio, estructura org, equipos y miembros',
    technikerLabel: 'Técnico',
    technikerDesc: 'Editar activos y servicio, estructura org solo lectura',
    leserLabel: 'Lector',
    leserDesc: 'Solo lectura, sin editar ni crear',
  },
  it: {
    emailLabel: 'Indirizzo e-mail del nuovo membro',
    create: 'Crea',
    pending: 'In attesa',
    members: 'Membri',
    accepted: 'Accettato',
    expired: 'Scaduto',
    timeLeft: '{h}h {m}m rimanente',
    copyLink: 'Link',
    copied: 'Copiato',
    alreadyMember: 'Questo indirizzo e-mail è già membro.',
    noRole: 'Nessun ruolo trovato. Crea prima un ruolo.',
    inviteError: 'Errore nella creazione dell\'invito.',
    noMembers: 'Nessun membro ancora.',
    active: 'Attivo',
    you: 'tu',
    membersCount: 'Membri · {count}',
    onlyAdmins: 'Solo gli admin possono cambiare i ruoli.',
    adminLabel: 'Admin',
    adminDesc: 'Accesso completo: gestire asset, servizio, struttura org, team e membri',
    technikerLabel: 'Tecnico',
    technikerDesc: 'Modifica asset e servizio, struttura org in sola lettura',
    leserLabel: 'Lettore',
    leserDesc: 'Solo lettura, nessuna modifica o creazione',
  },
}

for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en

  // Invite keys
  if (!data.settings) data.settings = {}
  if (!data.settings.invite) data.settings.invite = {}
  const inv = data.settings.invite
  inv.emailLabel = k.emailLabel
  inv.create = k.create
  inv.pending = k.pending
  inv.members = k.members
  inv.accepted = k.accepted
  inv.expired = k.expired
  inv.timeLeft = k.timeLeft
  inv.copyLink = k.copyLink
  inv.copied = k.copied
  inv.alreadyMember = k.alreadyMember
  inv.noRole = k.noRole
  inv.inviteError = k.inviteError
  inv.noMembers = k.noMembers
  inv.active = k.active

  // Roles keys
  if (!data.roles) data.roles = {}
  data.roles.you = k.you
  data.roles.membersCount = k.membersCount
  data.roles.onlyAdmins = k.onlyAdmins
  if (!data.roles.admin) data.roles.admin = {}
  data.roles.admin.label = k.adminLabel
  data.roles.admin.description = k.adminDesc
  if (!data.roles.techniker) data.roles.techniker = {}
  data.roles.techniker.label = k.technikerLabel
  data.roles.techniker.description = k.technikerDesc
  if (!data.roles.leser) data.roles.leser = {}
  data.roles.leser.label = k.leserLabel
  data.roles.leser.description = k.leserDesc

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
