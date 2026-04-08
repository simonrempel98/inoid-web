import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: {
    // tree
    noTeams: 'Noch keine Teams angelegt',
    createFirst: 'Erstelle dein erstes Team über den Button oben rechts.',
    // form (create)
    newTeam: 'Neues Team',
    teamInfo: 'Team-Informationen',
    teamNameLabel: 'TEAMNAME *',
    teamNamePlaceholder: 'z.B. Instandhaltung Halle 2',
    locationAssignment: 'Standort-Zuordnung',
    optional: '(optional)',
    noLocationSelected: 'Kein Standort ausgewählt — Team wird ohne Zuordnung angelegt.',
    noOrgData: 'Noch keine Standorte oder Bereiche angelegt.',
    createMembers: 'Mitglieder anlegen',
    colFirst: 'Vorname',
    colLast: 'Nachname',
    colEmail: 'E-Mail',
    colRole: 'Rolle',
    colPassword: 'Passwort',
    addRow: 'Zeile hinzufügen',
    membersToCreate: '{count} Benutzer werden direkt angelegt. Bitte Zugangsdaten weitergeben.',
    creating: 'Wird erstellt…',
    createSubmit: 'Team erstellen & Mitglieder anlegen',
    nameRequired: 'Bitte einen Teamnamen eingeben.',
    created: 'Team erstellt!',
    membersCreated: '{count} Benutzer erfolgreich angelegt.',
    teamCreated: 'Team wurde angelegt.',
    errorsFor: 'Fehler bei {count} Mitglied(ern):',
    openTeam: 'Team öffnen',
    toOverview: 'Zur Übersicht',
    // detail
    locationLabel: 'STANDORT-ZUORDNUNG',
    locationNone: '– Keine Zuordnung –',
    locationsGroup: 'Standorte',
    hallsGroup: 'Hallen',
    areasGroup: 'Bereiche',
    save: 'Speichern',
    cancel: 'Abbrechen',
    edit: 'Bearbeiten',
    memberCount: '{count} Mitglieder',
    addMember: 'Mitglied anlegen',
    newMemberTitle: 'Neues Mitglied anlegen',
    colFirstName: 'VORNAME',
    colLastName: 'NACHNAME',
    colEmailRequired: 'E-MAIL *',
    colRoleLabel: 'ROLLE',
    tempPassword: 'TEMPORÄRES PASSWORT *',
    creating2: 'Wird angelegt…',
    createUser: 'Benutzer anlegen',
    noMembers: 'Noch keine Mitglieder',
    inviteFirst: 'Lade dein erstes Teammitglied ein.',
    rolesAndPermissions: 'Rollen & Rechte',
    removeConfirm: '{name} aus dem Team entfernen?',
    membersSection: 'Mitglieder · {count}',
  },
  en: {
    noTeams: 'No teams yet',
    createFirst: 'Create your first team using the button in the top right.',
    newTeam: 'New Team',
    teamInfo: 'Team Information',
    teamNameLabel: 'TEAM NAME *',
    teamNamePlaceholder: 'e.g. Maintenance Hall 2',
    locationAssignment: 'Location Assignment',
    optional: '(optional)',
    noLocationSelected: 'No location selected — team will be created without assignment.',
    noOrgData: 'No locations or areas created yet.',
    createMembers: 'Create Members',
    colFirst: 'First name',
    colLast: 'Last name',
    colEmail: 'Email',
    colRole: 'Role',
    colPassword: 'Password',
    addRow: 'Add row',
    membersToCreate: '{count} users will be created directly. Please share the login credentials.',
    creating: 'Creating…',
    createSubmit: 'Create team & add members',
    nameRequired: 'Please enter a team name.',
    created: 'Team created!',
    membersCreated: '{count} users created successfully.',
    teamCreated: 'Team has been created.',
    errorsFor: 'Errors for {count} member(s):',
    openTeam: 'Open team',
    toOverview: 'Overview',
    locationLabel: 'LOCATION ASSIGNMENT',
    locationNone: '– No assignment –',
    locationsGroup: 'Locations',
    hallsGroup: 'Halls',
    areasGroup: 'Areas',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    memberCount: '{count} members',
    addMember: 'Add member',
    newMemberTitle: 'New member',
    colFirstName: 'FIRST NAME',
    colLastName: 'LAST NAME',
    colEmailRequired: 'EMAIL *',
    colRoleLabel: 'ROLE',
    tempPassword: 'TEMPORARY PASSWORD *',
    creating2: 'Creating…',
    createUser: 'Create user',
    noMembers: 'No members yet',
    inviteFirst: 'Invite your first team member.',
    rolesAndPermissions: 'Roles & Permissions',
    removeConfirm: 'Remove {name} from the team?',
    membersSection: 'Members · {count}',
  },
  fr: {
    noTeams: 'Aucune équipe encore',
    createFirst: 'Créez votre première équipe via le bouton en haut à droite.',
    newTeam: 'Nouvelle équipe',
    teamInfo: 'Informations sur l\'équipe',
    teamNameLabel: 'NOM DE L\'ÉQUIPE *',
    teamNamePlaceholder: 'p.ex. Maintenance Salle 2',
    locationAssignment: 'Attribution de site',
    optional: '(optionnel)',
    noLocationSelected: 'Aucun site sélectionné — l\'équipe sera créée sans attribution.',
    noOrgData: 'Aucun site ou zone créé encore.',
    createMembers: 'Créer des membres',
    colFirst: 'Prénom',
    colLast: 'Nom',
    colEmail: 'E-mail',
    colRole: 'Rôle',
    colPassword: 'Mot de passe',
    addRow: 'Ajouter une ligne',
    membersToCreate: '{count} utilisateurs seront créés directement. Partagez les identifiants de connexion.',
    creating: 'Création…',
    createSubmit: 'Créer l\'équipe & ajouter des membres',
    nameRequired: 'Veuillez saisir un nom d\'équipe.',
    created: 'Équipe créée !',
    membersCreated: '{count} utilisateurs créés avec succès.',
    teamCreated: 'L\'équipe a été créée.',
    errorsFor: 'Erreurs pour {count} membre(s) :',
    openTeam: 'Ouvrir l\'équipe',
    toOverview: 'Vue d\'ensemble',
    locationLabel: 'ATTRIBUTION DE SITE',
    locationNone: '– Aucune attribution –',
    locationsGroup: 'Sites',
    hallsGroup: 'Halls',
    areasGroup: 'Zones',
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    memberCount: '{count} membres',
    addMember: 'Ajouter un membre',
    newMemberTitle: 'Nouveau membre',
    colFirstName: 'PRÉNOM',
    colLastName: 'NOM',
    colEmailRequired: 'E-MAIL *',
    colRoleLabel: 'RÔLE',
    tempPassword: 'MOT DE PASSE TEMPORAIRE *',
    creating2: 'Création…',
    createUser: 'Créer l\'utilisateur',
    noMembers: 'Aucun membre encore',
    inviteFirst: 'Invitez votre premier membre de l\'équipe.',
    rolesAndPermissions: 'Rôles & Permissions',
    removeConfirm: 'Retirer {name} de l\'équipe ?',
    membersSection: 'Membres · {count}',
  },
  es: {
    noTeams: 'Sin equipos aún',
    createFirst: 'Crea tu primer equipo usando el botón en la esquina superior derecha.',
    newTeam: 'Nuevo equipo',
    teamInfo: 'Información del equipo',
    teamNameLabel: 'NOMBRE DEL EQUIPO *',
    teamNamePlaceholder: 'p.ej. Mantenimiento Nave 2',
    locationAssignment: 'Asignación de ubicación',
    optional: '(opcional)',
    noLocationSelected: 'Sin ubicación seleccionada — el equipo se creará sin asignación.',
    noOrgData: 'No hay ubicaciones o áreas creadas aún.',
    createMembers: 'Crear miembros',
    colFirst: 'Nombre',
    colLast: 'Apellido',
    colEmail: 'Correo',
    colRole: 'Rol',
    colPassword: 'Contraseña',
    addRow: 'Añadir fila',
    membersToCreate: '{count} usuarios se crearán directamente. Por favor comparte las credenciales.',
    creating: 'Creando…',
    createSubmit: 'Crear equipo y añadir miembros',
    nameRequired: 'Por favor introduce un nombre de equipo.',
    created: '¡Equipo creado!',
    membersCreated: '{count} usuarios creados con éxito.',
    teamCreated: 'El equipo ha sido creado.',
    errorsFor: 'Errores para {count} miembro(s):',
    openTeam: 'Abrir equipo',
    toOverview: 'Vista general',
    locationLabel: 'ASIGNACIÓN DE UBICACIÓN',
    locationNone: '– Sin asignación –',
    locationsGroup: 'Ubicaciones',
    hallsGroup: 'Naves',
    areasGroup: 'Áreas',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    memberCount: '{count} miembros',
    addMember: 'Añadir miembro',
    newMemberTitle: 'Nuevo miembro',
    colFirstName: 'NOMBRE',
    colLastName: 'APELLIDO',
    colEmailRequired: 'CORREO *',
    colRoleLabel: 'ROL',
    tempPassword: 'CONTRASEÑA TEMPORAL *',
    creating2: 'Creando…',
    createUser: 'Crear usuario',
    noMembers: 'Sin miembros aún',
    inviteFirst: 'Invita a tu primer miembro del equipo.',
    rolesAndPermissions: 'Roles y Permisos',
    removeConfirm: '¿Eliminar a {name} del equipo?',
    membersSection: 'Miembros · {count}',
  },
  it: {
    noTeams: 'Nessun team ancora',
    createFirst: 'Crea il tuo primo team usando il pulsante in alto a destra.',
    newTeam: 'Nuovo team',
    teamInfo: 'Informazioni team',
    teamNameLabel: 'NOME TEAM *',
    teamNamePlaceholder: 'es. Manutenzione Capannone 2',
    locationAssignment: 'Assegnazione posizione',
    optional: '(opzionale)',
    noLocationSelected: 'Nessuna posizione selezionata — il team sarà creato senza assegnazione.',
    noOrgData: 'Nessuna posizione o area creata ancora.',
    createMembers: 'Crea membri',
    colFirst: 'Nome',
    colLast: 'Cognome',
    colEmail: 'Email',
    colRole: 'Ruolo',
    colPassword: 'Password',
    addRow: 'Aggiungi riga',
    membersToCreate: '{count} utenti verranno creati direttamente. Condividi le credenziali di accesso.',
    creating: 'Creazione…',
    createSubmit: 'Crea team e aggiungi membri',
    nameRequired: 'Inserisci un nome per il team.',
    created: 'Team creato!',
    membersCreated: '{count} utenti creati con successo.',
    teamCreated: 'Il team è stato creato.',
    errorsFor: 'Errori per {count} membro/i:',
    openTeam: 'Apri team',
    toOverview: 'Panoramica',
    locationLabel: 'ASSEGNAZIONE POSIZIONE',
    locationNone: '– Nessuna assegnazione –',
    locationsGroup: 'Posizioni',
    hallsGroup: 'Capannoni',
    areasGroup: 'Aree',
    save: 'Salva',
    cancel: 'Annulla',
    edit: 'Modifica',
    memberCount: '{count} membri',
    addMember: 'Aggiungi membro',
    newMemberTitle: 'Nuovo membro',
    colFirstName: 'NOME',
    colLastName: 'COGNOME',
    colEmailRequired: 'EMAIL *',
    colRoleLabel: 'RUOLO',
    tempPassword: 'PASSWORD TEMPORANEA *',
    creating2: 'Creazione…',
    createUser: 'Crea utente',
    noMembers: 'Nessun membro ancora',
    inviteFirst: 'Invita il tuo primo membro del team.',
    rolesAndPermissions: 'Ruoli e Permessi',
    removeConfirm: 'Rimuovere {name} dal team?',
    membersSection: 'Membri · {count}',
  },
}

for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en

  if (!data.teams) data.teams = {}
  const t = data.teams

  // tree
  t.noTeams = k.noTeams
  t.createFirst = k.createFirst
  // form
  t.newTeam = k.newTeam
  t.teamInfo = k.teamInfo
  t.teamNameLabel = k.teamNameLabel
  t.teamNamePlaceholder = k.teamNamePlaceholder
  t.locationAssignment = k.locationAssignment
  t.optional = k.optional
  t.noLocationSelected = k.noLocationSelected
  t.noOrgData = k.noOrgData
  t.createMembers = k.createMembers
  t.colFirst = k.colFirst
  t.colLast = k.colLast
  t.colEmail = k.colEmail
  t.colRole = k.colRole
  t.colPassword = k.colPassword
  t.addRow = k.addRow
  t.membersToCreate = k.membersToCreate
  t.creating = k.creating
  t.createSubmit = k.createSubmit
  t.nameRequired = k.nameRequired
  t.created = k.created
  t.membersCreated = k.membersCreated
  t.teamCreated = k.teamCreated
  t.errorsFor = k.errorsFor
  t.openTeam = k.openTeam
  t.toOverview = k.toOverview
  // detail
  t.locationLabel = k.locationLabel
  t.locationNone = k.locationNone
  t.locationsGroup = k.locationsGroup
  t.hallsGroup = k.hallsGroup
  t.areasGroup = k.areasGroup
  t.save = k.save
  t.cancel = k.cancel
  t.edit = k.edit
  t.memberCount = k.memberCount
  t.addMember = k.addMember
  t.newMemberTitle = k.newMemberTitle
  t.colFirstName = k.colFirstName
  t.colLastName = k.colLastName
  t.colEmailRequired = k.colEmailRequired
  t.colRoleLabel = k.colRoleLabel
  t.tempPassword = k.tempPassword
  t.creating2 = k.creating2
  t.createUser = k.createUser
  t.noMembers = k.noMembers
  t.inviteFirst = k.inviteFirst
  t.rolesAndPermissions = k.rolesAndPermissions
  t.removeConfirm = k.removeConfirm
  t.membersSection = k.membersSection

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
