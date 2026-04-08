import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: {
    // login
    loginTitle: 'Anmelden',
    loginEmailLabel: 'E-Mail',
    loginPasswordLabel: 'Passwort',
    loginError: 'E-Mail oder Passwort falsch.',
    loginForgotPassword: 'Passwort vergessen?',
    loginLoading: 'Wird angemeldet…',
    loginSubmit: 'Anmelden',
    loginRegister: 'Registrieren',
    // register
    registerTitle: 'Account erstellen',
    registerStep1: 'Schritt 1 von 3 – Persönliche Daten',
    registerStep2: 'Schritt 2 von 3 – Organisationsdaten',
    registerStep3: 'Schritt 3 von 3 – Jederzeit upgraden möglich',
    registerFirstName: 'Vorname',
    registerLastName: 'Nachname',
    registerEmail: 'E-Mail',
    registerPassword: 'Passwort',
    registerPasswordConfirm: 'Passwort bestätigen',
    registerPasswordPlaceholder: 'Mindestens 8 Zeichen',
    registerMismatch: 'Passwörter stimmen nicht überein.',
    registerNext: 'Weiter',
    registerBack: 'Zurück',
    registerCompanyTitle: 'Ihr Unternehmen',
    registerCompanyName: 'Firmenname',
    registerIndustry: 'Branche',
    registerIndustryPlaceholder: 'Bitte wählen…',
    registerCountry: 'Land',
    registerZip: 'PLZ',
    registerPlanTitle: 'Plan wählen',
    registerCreating: 'Wird erstellt…',
    registerCreateAccount: 'Konto erstellen',
    registerVerifyTitle: 'E-Mail prüfen',
    registerVerifySent: 'Wir haben eine Bestätigungs-E-Mail an',
    registerVerifyClick: 'Klicke auf den Link in der E-Mail um dein Konto zu aktivieren.',
    registerBackToLogin: 'Zurück zur Anmeldung',
    registerAlreadyRegistered: 'Bereits registriert?',
    registerLoginLink: 'Anmelden',
    // forgot password
    forgotTitle: 'Passwort zurücksetzen',
    forgotSubtitle: 'Wir senden dir einen Link per E-Mail.',
    forgotEmailLabel: 'E-Mail',
    forgotError: 'Fehler beim Senden. Bitte versuche es erneut.',
    forgotLoading: 'Wird gesendet…',
    forgotSubmit: 'Link senden',
    forgotBackToLogin: 'Zurück zur Anmeldung',
    forgotSentTitle: 'E-Mail gesendet',
    forgotSentDesc: 'Prüfe dein Postfach bei {email} und klicke auf den Link zum Zurücksetzen.',
    // reset password
    resetTitle: 'Neues Passwort',
    resetSubtitle: 'Mindestens 8 Zeichen.',
    resetPasswordLabel: 'Neues Passwort',
    resetConfirmLabel: 'Passwort bestätigen',
    resetPasswordPlaceholder: 'Mindestens 8 Zeichen',
    resetMismatch: 'Passwörter stimmen nicht überein.',
    resetTooShort: 'Passwort muss mindestens 8 Zeichen lang sein.',
    resetError: 'Fehler beim Setzen des Passworts. Bitte versuche es erneut.',
    resetLoading: 'Wird gespeichert…',
    resetSubmit: 'Passwort speichern',
    // invite page
    inviteNotFoundTitle: 'Einladung nicht gefunden',
    inviteNotFoundDesc: 'Dieser Link ist ungültig oder bereits verwendet.',
    inviteLoading: 'Lade Einladung…',
    inviteTitle: 'Einladung annehmen',
    inviteInvitedTo: 'Du wurdest zu {org} eingeladen.',
    invitePasswordLabel: 'Passwort wählen',
    inviteConfirmLabel: 'Passwort bestätigen',
    invitePasswordPlaceholder: 'Mindestens 8 Zeichen',
    inviteMismatch: 'Passwörter stimmen nicht überein.',
    inviteProcessing: 'Wird verarbeitet…',
    inviteSubmit: 'Konto erstellen & beitreten',
    // complete form
    completeInvitedBy: 'Du wurdest eingeladen von',
    completeTitle: 'Konto einrichten',
    completeSubtitle: 'Lege dein Passwort fest und bestätige deinen Namen.',
    completeEmailLabel: 'E-MAIL',
    completeNameLabel: 'VOLLSTÄNDIGER NAME',
    completePasswordLabel: 'PASSWORT WÄHLEN',
    completeConfirmLabel: 'PASSWORT BESTÄTIGEN',
    completeMismatch: 'Passwörter stimmen nicht überein.',
    completeTooShort: 'Passwort muss mindestens 8 Zeichen haben.',
    completeLoading: 'Wird eingerichtet…',
    completeSubmit: 'Konto einrichten & loslegen',
  },
  en: {
    loginTitle: 'Sign in',
    loginEmailLabel: 'Email',
    loginPasswordLabel: 'Password',
    loginError: 'Invalid email or password.',
    loginForgotPassword: 'Forgot password?',
    loginLoading: 'Signing in…',
    loginSubmit: 'Sign in',
    loginRegister: 'Register',
    registerTitle: 'Create account',
    registerStep1: 'Step 1 of 3 – Personal data',
    registerStep2: 'Step 2 of 3 – Organization data',
    registerStep3: 'Step 3 of 3 – Upgrade anytime',
    registerFirstName: 'First name',
    registerLastName: 'Last name',
    registerEmail: 'Email',
    registerPassword: 'Password',
    registerPasswordConfirm: 'Confirm password',
    registerPasswordPlaceholder: 'At least 8 characters',
    registerMismatch: 'Passwords do not match.',
    registerNext: 'Next',
    registerBack: 'Back',
    registerCompanyTitle: 'Your company',
    registerCompanyName: 'Company name',
    registerIndustry: 'Industry',
    registerIndustryPlaceholder: 'Please select…',
    registerCountry: 'Country',
    registerZip: 'ZIP code',
    registerPlanTitle: 'Choose plan',
    registerCreating: 'Creating…',
    registerCreateAccount: 'Create account',
    registerVerifyTitle: 'Check email',
    registerVerifySent: 'We sent a confirmation email to',
    registerVerifyClick: 'Click the link in the email to activate your account.',
    registerBackToLogin: 'Back to login',
    registerAlreadyRegistered: 'Already registered?',
    registerLoginLink: 'Sign in',
    forgotTitle: 'Reset password',
    forgotSubtitle: 'We will send you a link by email.',
    forgotEmailLabel: 'Email',
    forgotError: 'Error sending. Please try again.',
    forgotLoading: 'Sending…',
    forgotSubmit: 'Send link',
    forgotBackToLogin: 'Back to login',
    forgotSentTitle: 'Email sent',
    forgotSentDesc: 'Check your inbox at {email} and click the reset link.',
    resetTitle: 'New password',
    resetSubtitle: 'At least 8 characters.',
    resetPasswordLabel: 'New password',
    resetConfirmLabel: 'Confirm password',
    resetPasswordPlaceholder: 'At least 8 characters',
    resetMismatch: 'Passwords do not match.',
    resetTooShort: 'Password must be at least 8 characters.',
    resetError: 'Error setting password. Please try again.',
    resetLoading: 'Saving…',
    resetSubmit: 'Save password',
    inviteNotFoundTitle: 'Invitation not found',
    inviteNotFoundDesc: 'This link is invalid or already used.',
    inviteLoading: 'Loading invitation…',
    inviteTitle: 'Accept invitation',
    inviteInvitedTo: 'You have been invited to {org}.',
    invitePasswordLabel: 'Choose password',
    inviteConfirmLabel: 'Confirm password',
    invitePasswordPlaceholder: 'At least 8 characters',
    inviteMismatch: 'Passwords do not match.',
    inviteProcessing: 'Processing…',
    inviteSubmit: 'Create account & join',
    completeInvitedBy: 'You were invited by',
    completeTitle: 'Set up account',
    completeSubtitle: 'Set your password and confirm your name.',
    completeEmailLabel: 'EMAIL',
    completeNameLabel: 'FULL NAME',
    completePasswordLabel: 'CHOOSE PASSWORD',
    completeConfirmLabel: 'CONFIRM PASSWORD',
    completeMismatch: 'Passwords do not match.',
    completeTooShort: 'Password must be at least 8 characters.',
    completeLoading: 'Setting up…',
    completeSubmit: 'Set up account & get started',
  },
  fr: {
    loginTitle: 'Se connecter',
    loginEmailLabel: 'E-mail',
    loginPasswordLabel: 'Mot de passe',
    loginError: 'E-mail ou mot de passe incorrect.',
    loginForgotPassword: 'Mot de passe oublié ?',
    loginLoading: 'Connexion…',
    loginSubmit: 'Se connecter',
    loginRegister: 'S\'inscrire',
    registerTitle: 'Créer un compte',
    registerStep1: 'Étape 1 sur 3 – Données personnelles',
    registerStep2: 'Étape 2 sur 3 – Données organisation',
    registerStep3: 'Étape 3 sur 3 – Mise à niveau possible à tout moment',
    registerFirstName: 'Prénom',
    registerLastName: 'Nom',
    registerEmail: 'E-mail',
    registerPassword: 'Mot de passe',
    registerPasswordConfirm: 'Confirmer le mot de passe',
    registerPasswordPlaceholder: 'Au moins 8 caractères',
    registerMismatch: 'Les mots de passe ne correspondent pas.',
    registerNext: 'Suivant',
    registerBack: 'Retour',
    registerCompanyTitle: 'Votre entreprise',
    registerCompanyName: 'Nom de l\'entreprise',
    registerIndustry: 'Secteur',
    registerIndustryPlaceholder: 'Veuillez sélectionner…',
    registerCountry: 'Pays',
    registerZip: 'Code postal',
    registerPlanTitle: 'Choisir un plan',
    registerCreating: 'Création…',
    registerCreateAccount: 'Créer un compte',
    registerVerifyTitle: 'Vérifier l\'e-mail',
    registerVerifySent: 'Nous avons envoyé un e-mail de confirmation à',
    registerVerifyClick: 'Cliquez sur le lien dans l\'e-mail pour activer votre compte.',
    registerBackToLogin: 'Retour à la connexion',
    registerAlreadyRegistered: 'Déjà inscrit ?',
    registerLoginLink: 'Se connecter',
    forgotTitle: 'Réinitialiser le mot de passe',
    forgotSubtitle: 'Nous vous enverrons un lien par e-mail.',
    forgotEmailLabel: 'E-mail',
    forgotError: 'Erreur d\'envoi. Veuillez réessayer.',
    forgotLoading: 'Envoi…',
    forgotSubmit: 'Envoyer le lien',
    forgotBackToLogin: 'Retour à la connexion',
    forgotSentTitle: 'E-mail envoyé',
    forgotSentDesc: 'Vérifiez votre boîte à {email} et cliquez sur le lien de réinitialisation.',
    resetTitle: 'Nouveau mot de passe',
    resetSubtitle: 'Au moins 8 caractères.',
    resetPasswordLabel: 'Nouveau mot de passe',
    resetConfirmLabel: 'Confirmer le mot de passe',
    resetPasswordPlaceholder: 'Au moins 8 caractères',
    resetMismatch: 'Les mots de passe ne correspondent pas.',
    resetTooShort: 'Le mot de passe doit comporter au moins 8 caractères.',
    resetError: 'Erreur lors de la définition du mot de passe. Veuillez réessayer.',
    resetLoading: 'Enregistrement…',
    resetSubmit: 'Enregistrer le mot de passe',
    inviteNotFoundTitle: 'Invitation introuvable',
    inviteNotFoundDesc: 'Ce lien est invalide ou déjà utilisé.',
    inviteLoading: 'Chargement de l\'invitation…',
    inviteTitle: 'Accepter l\'invitation',
    inviteInvitedTo: 'Vous avez été invité à {org}.',
    invitePasswordLabel: 'Choisir un mot de passe',
    inviteConfirmLabel: 'Confirmer le mot de passe',
    invitePasswordPlaceholder: 'Au moins 8 caractères',
    inviteMismatch: 'Les mots de passe ne correspondent pas.',
    inviteProcessing: 'Traitement…',
    inviteSubmit: 'Créer un compte & rejoindre',
    completeInvitedBy: 'Vous avez été invité par',
    completeTitle: 'Configurer le compte',
    completeSubtitle: 'Définissez votre mot de passe et confirmez votre nom.',
    completeEmailLabel: 'E-MAIL',
    completeNameLabel: 'NOM COMPLET',
    completePasswordLabel: 'CHOISIR UN MOT DE PASSE',
    completeConfirmLabel: 'CONFIRMER LE MOT DE PASSE',
    completeMismatch: 'Les mots de passe ne correspondent pas.',
    completeTooShort: 'Le mot de passe doit comporter au moins 8 caractères.',
    completeLoading: 'Configuration…',
    completeSubmit: 'Configurer le compte & commencer',
  },
  es: {
    loginTitle: 'Iniciar sesión',
    loginEmailLabel: 'Correo electrónico',
    loginPasswordLabel: 'Contraseña',
    loginError: 'Correo electrónico o contraseña incorrectos.',
    loginForgotPassword: '¿Olvidaste tu contraseña?',
    loginLoading: 'Iniciando sesión…',
    loginSubmit: 'Iniciar sesión',
    loginRegister: 'Registrarse',
    registerTitle: 'Crear cuenta',
    registerStep1: 'Paso 1 de 3 – Datos personales',
    registerStep2: 'Paso 2 de 3 – Datos de la organización',
    registerStep3: 'Paso 3 de 3 – Actualizar en cualquier momento',
    registerFirstName: 'Nombre',
    registerLastName: 'Apellido',
    registerEmail: 'Correo electrónico',
    registerPassword: 'Contraseña',
    registerPasswordConfirm: 'Confirmar contraseña',
    registerPasswordPlaceholder: 'Al menos 8 caracteres',
    registerMismatch: 'Las contraseñas no coinciden.',
    registerNext: 'Siguiente',
    registerBack: 'Atrás',
    registerCompanyTitle: 'Tu empresa',
    registerCompanyName: 'Nombre de la empresa',
    registerIndustry: 'Sector',
    registerIndustryPlaceholder: 'Por favor selecciona…',
    registerCountry: 'País',
    registerZip: 'Código postal',
    registerPlanTitle: 'Elegir plan',
    registerCreating: 'Creando…',
    registerCreateAccount: 'Crear cuenta',
    registerVerifyTitle: 'Verificar correo',
    registerVerifySent: 'Enviamos un correo de confirmación a',
    registerVerifyClick: 'Haz clic en el enlace del correo para activar tu cuenta.',
    registerBackToLogin: 'Volver al inicio de sesión',
    registerAlreadyRegistered: '¿Ya registrado?',
    registerLoginLink: 'Iniciar sesión',
    forgotTitle: 'Restablecer contraseña',
    forgotSubtitle: 'Te enviaremos un enlace por correo electrónico.',
    forgotEmailLabel: 'Correo electrónico',
    forgotError: 'Error al enviar. Por favor inténtalo de nuevo.',
    forgotLoading: 'Enviando…',
    forgotSubmit: 'Enviar enlace',
    forgotBackToLogin: 'Volver al inicio de sesión',
    forgotSentTitle: 'Correo enviado',
    forgotSentDesc: 'Revisa tu bandeja de entrada en {email} y haz clic en el enlace de restablecimiento.',
    resetTitle: 'Nueva contraseña',
    resetSubtitle: 'Al menos 8 caracteres.',
    resetPasswordLabel: 'Nueva contraseña',
    resetConfirmLabel: 'Confirmar contraseña',
    resetPasswordPlaceholder: 'Al menos 8 caracteres',
    resetMismatch: 'Las contraseñas no coinciden.',
    resetTooShort: 'La contraseña debe tener al menos 8 caracteres.',
    resetError: 'Error al establecer la contraseña. Por favor inténtalo de nuevo.',
    resetLoading: 'Guardando…',
    resetSubmit: 'Guardar contraseña',
    inviteNotFoundTitle: 'Invitación no encontrada',
    inviteNotFoundDesc: 'Este enlace es inválido o ya fue utilizado.',
    inviteLoading: 'Cargando invitación…',
    inviteTitle: 'Aceptar invitación',
    inviteInvitedTo: 'Has sido invitado a {org}.',
    invitePasswordLabel: 'Elegir contraseña',
    inviteConfirmLabel: 'Confirmar contraseña',
    invitePasswordPlaceholder: 'Al menos 8 caracteres',
    inviteMismatch: 'Las contraseñas no coinciden.',
    inviteProcessing: 'Procesando…',
    inviteSubmit: 'Crear cuenta y unirse',
    completeInvitedBy: 'Fuiste invitado por',
    completeTitle: 'Configurar cuenta',
    completeSubtitle: 'Establece tu contraseña y confirma tu nombre.',
    completeEmailLabel: 'CORREO ELECTRÓNICO',
    completeNameLabel: 'NOMBRE COMPLETO',
    completePasswordLabel: 'ELEGIR CONTRASEÑA',
    completeConfirmLabel: 'CONFIRMAR CONTRASEÑA',
    completeMismatch: 'Las contraseñas no coinciden.',
    completeTooShort: 'La contraseña debe tener al menos 8 caracteres.',
    completeLoading: 'Configurando…',
    completeSubmit: 'Configurar cuenta y comenzar',
  },
  it: {
    loginTitle: 'Accedi',
    loginEmailLabel: 'Email',
    loginPasswordLabel: 'Password',
    loginError: 'Email o password non corretti.',
    loginForgotPassword: 'Password dimenticata?',
    loginLoading: 'Accesso in corso…',
    loginSubmit: 'Accedi',
    loginRegister: 'Registrati',
    registerTitle: 'Crea account',
    registerStep1: 'Passo 1 di 3 – Dati personali',
    registerStep2: 'Passo 2 di 3 – Dati organizzazione',
    registerStep3: 'Passo 3 di 3 – Aggiornamento possibile in qualsiasi momento',
    registerFirstName: 'Nome',
    registerLastName: 'Cognome',
    registerEmail: 'Email',
    registerPassword: 'Password',
    registerPasswordConfirm: 'Conferma password',
    registerPasswordPlaceholder: 'Almeno 8 caratteri',
    registerMismatch: 'Le password non corrispondono.',
    registerNext: 'Avanti',
    registerBack: 'Indietro',
    registerCompanyTitle: 'La tua azienda',
    registerCompanyName: 'Nome azienda',
    registerIndustry: 'Settore',
    registerIndustryPlaceholder: 'Seleziona…',
    registerCountry: 'Paese',
    registerZip: 'CAP',
    registerPlanTitle: 'Scegli piano',
    registerCreating: 'Creazione…',
    registerCreateAccount: 'Crea account',
    registerVerifyTitle: 'Verifica email',
    registerVerifySent: 'Abbiamo inviato una email di conferma a',
    registerVerifyClick: 'Clicca sul link nell\'email per attivare il tuo account.',
    registerBackToLogin: 'Torna al login',
    registerAlreadyRegistered: 'Già registrato?',
    registerLoginLink: 'Accedi',
    forgotTitle: 'Reimposta password',
    forgotSubtitle: 'Ti invieremo un link via email.',
    forgotEmailLabel: 'Email',
    forgotError: 'Errore nell\'invio. Riprova.',
    forgotLoading: 'Invio…',
    forgotSubmit: 'Invia link',
    forgotBackToLogin: 'Torna al login',
    forgotSentTitle: 'Email inviata',
    forgotSentDesc: 'Controlla la tua casella a {email} e clicca sul link di reimpostazione.',
    resetTitle: 'Nuova password',
    resetSubtitle: 'Almeno 8 caratteri.',
    resetPasswordLabel: 'Nuova password',
    resetConfirmLabel: 'Conferma password',
    resetPasswordPlaceholder: 'Almeno 8 caratteri',
    resetMismatch: 'Le password non corrispondono.',
    resetTooShort: 'La password deve essere di almeno 8 caratteri.',
    resetError: 'Errore nell\'impostazione della password. Riprova.',
    resetLoading: 'Salvataggio…',
    resetSubmit: 'Salva password',
    inviteNotFoundTitle: 'Invito non trovato',
    inviteNotFoundDesc: 'Questo link non è valido o è già stato utilizzato.',
    inviteLoading: 'Caricamento invito…',
    inviteTitle: 'Accetta invito',
    inviteInvitedTo: 'Sei stato invitato a {org}.',
    invitePasswordLabel: 'Scegli password',
    inviteConfirmLabel: 'Conferma password',
    invitePasswordPlaceholder: 'Almeno 8 caratteri',
    inviteMismatch: 'Le password non corrispondono.',
    inviteProcessing: 'Elaborazione…',
    inviteSubmit: 'Crea account e unisciti',
    completeInvitedBy: 'Sei stato invitato da',
    completeTitle: 'Configura account',
    completeSubtitle: 'Imposta la tua password e conferma il tuo nome.',
    completeEmailLabel: 'EMAIL',
    completeNameLabel: 'NOME COMPLETO',
    completePasswordLabel: 'SCEGLI PASSWORD',
    completeConfirmLabel: 'CONFERMA PASSWORD',
    completeMismatch: 'Le password non corrispondono.',
    completeTooShort: 'La password deve essere di almeno 8 caratteri.',
    completeLoading: 'Configurazione…',
    completeSubmit: 'Configura account e inizia',
  },
}

for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en

  // loginPage
  if (!data.loginPage) data.loginPage = {}
  const lp = data.loginPage
  lp.title = k.loginTitle
  lp.emailLabel = k.loginEmailLabel
  lp.passwordLabel = k.loginPasswordLabel
  lp.error = k.loginError
  lp.forgotPassword = k.loginForgotPassword
  lp.loading = k.loginLoading
  lp.submit = k.loginSubmit
  lp.register = k.loginRegister

  // registerPage
  if (!data.registerPage) data.registerPage = {}
  const rp = data.registerPage
  rp.title = k.registerTitle
  rp.step1 = k.registerStep1
  rp.step2 = k.registerStep2
  rp.step3 = k.registerStep3
  rp.firstName = k.registerFirstName
  rp.lastName = k.registerLastName
  rp.email = k.registerEmail
  rp.password = k.registerPassword
  rp.passwordConfirm = k.registerPasswordConfirm
  rp.passwordPlaceholder = k.registerPasswordPlaceholder
  rp.mismatch = k.registerMismatch
  rp.next = k.registerNext
  rp.back = k.registerBack
  rp.companyTitle = k.registerCompanyTitle
  rp.companyName = k.registerCompanyName
  rp.industry = k.registerIndustry
  rp.industryPlaceholder = k.registerIndustryPlaceholder
  rp.country = k.registerCountry
  rp.zip = k.registerZip
  rp.planTitle = k.registerPlanTitle
  rp.creating = k.registerCreating
  rp.createAccount = k.registerCreateAccount
  rp.verifyTitle = k.registerVerifyTitle
  rp.verifySent = k.registerVerifySent
  rp.verifyClick = k.registerVerifyClick
  rp.backToLogin = k.registerBackToLogin
  rp.alreadyRegistered = k.registerAlreadyRegistered
  rp.loginLink = k.registerLoginLink

  // forgotPage
  if (!data.forgotPage) data.forgotPage = {}
  const fp = data.forgotPage
  fp.title = k.forgotTitle
  fp.subtitle = k.forgotSubtitle
  fp.emailLabel = k.forgotEmailLabel
  fp.error = k.forgotError
  fp.loading = k.forgotLoading
  fp.submit = k.forgotSubmit
  fp.backToLogin = k.forgotBackToLogin
  fp.sentTitle = k.forgotSentTitle
  fp.sentDesc = k.forgotSentDesc

  // resetPage
  if (!data.resetPage) data.resetPage = {}
  const rsp = data.resetPage
  rsp.title = k.resetTitle
  rsp.subtitle = k.resetSubtitle
  rsp.passwordLabel = k.resetPasswordLabel
  rsp.confirmLabel = k.resetConfirmLabel
  rsp.passwordPlaceholder = k.resetPasswordPlaceholder
  rsp.mismatch = k.resetMismatch
  rsp.tooShort = k.resetTooShort
  rsp.error = k.resetError
  rsp.loading = k.resetLoading
  rsp.submit = k.resetSubmit

  // invitePage
  if (!data.invitePage) data.invitePage = {}
  const ip = data.invitePage
  ip.notFoundTitle = k.inviteNotFoundTitle
  ip.notFoundDesc = k.inviteNotFoundDesc
  ip.loading = k.inviteLoading
  ip.title = k.inviteTitle
  ip.invitedTo = k.inviteInvitedTo
  ip.passwordLabel = k.invitePasswordLabel
  ip.confirmLabel = k.inviteConfirmLabel
  ip.passwordPlaceholder = k.invitePasswordPlaceholder
  ip.mismatch = k.inviteMismatch
  ip.processing = k.inviteProcessing
  ip.submit = k.inviteSubmit

  // completePage
  if (!data.completePage) data.completePage = {}
  const cp = data.completePage
  cp.invitedBy = k.completeInvitedBy
  cp.title = k.completeTitle
  cp.subtitle = k.completeSubtitle
  cp.emailLabel = k.completeEmailLabel
  cp.nameLabel = k.completeNameLabel
  cp.passwordLabel = k.completePasswordLabel
  cp.confirmLabel = k.completeConfirmLabel
  cp.mismatch = k.completeMismatch
  cp.tooShort = k.completeTooShort
  cp.loading = k.completeLoading
  cp.submit = k.completeSubmit

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
