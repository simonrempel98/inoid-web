import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: {
    rolesSubtitle: 'Lege fest, wer was in der Organisation darf.',
    billingSelectPlan: 'Plan wählen',
    billingCurrent: 'Aktuell',
    billingNet: 'zzgl. MwSt./Monat',
    billingCreateInvoice: 'Rechnung erstellen',
    billingShowForm: 'Rechnung erstellen & anzeigen',
    billingAddress: 'Rechnungsadresse',
    billingNameLabel: 'Name / Firma *',
    billingStreet: 'Straße & Hausnummer',
    billingCity: 'PLZ & Ort',
    billingCountry: 'Land',
    billingVatId: 'USt-ID (optional)',
    billingAfterTransfer: 'Nach Überweisung erhalten Sie Ihren 9-stelligen Aktivierungscode per E-Mail.',
    billingRedeemCode: 'Aktivierungscode einlösen',
    billingCodePlaceholder: '9-stelliger Code',
    billingCodeHint: 'Nach Zahlungseingang wird der Code per E-Mail an die Admins übermittelt.',
    billingActivate: 'Aktivieren',
    billingHistory: 'Rechnungshistorie',
    billingPaid: 'Bezahlt',
    biilingCancelled: 'Storniert',
    billingPending: 'Ausstehend',
    billingActivated: 'Plan „{plan}" erfolgreich aktiviert!',
    billingCurrentPlan: 'Aktueller Plan:',
  },
  en: {
    rolesSubtitle: 'Define who can do what in your organization.',
    billingSelectPlan: 'Select plan',
    billingCurrent: 'Current',
    billingNet: 'excl. VAT/month',
    billingCreateInvoice: 'Create invoice',
    billingShowForm: 'Create & view invoice',
    billingAddress: 'Billing address',
    billingNameLabel: 'Name / Company *',
    billingStreet: 'Street & number',
    billingCity: 'ZIP & city',
    billingCountry: 'Country',
    billingVatId: 'VAT ID (optional)',
    billingAfterTransfer: 'After payment you will receive your 9-digit activation code by email.',
    billingRedeemCode: 'Redeem activation code',
    billingCodePlaceholder: '9-digit code',
    billingCodeHint: 'After payment, the code will be sent to admins by email.',
    billingActivate: 'Activate',
    billingHistory: 'Invoice history',
    billingPaid: 'Paid',
    biilingCancelled: 'Cancelled',
    billingPending: 'Pending',
    billingActivated: 'Plan "{plan}" successfully activated!',
    billingCurrentPlan: 'Current plan:',
  },
  fr: {
    rolesSubtitle: 'Définissez qui peut faire quoi dans votre organisation.',
    billingSelectPlan: 'Choisir un plan',
    billingCurrent: 'Actuel',
    billingNet: 'HT/mois',
    billingCreateInvoice: 'Créer une facture',
    billingShowForm: 'Créer et afficher la facture',
    billingAddress: 'Adresse de facturation',
    billingNameLabel: 'Nom / Société *',
    billingStreet: 'Rue et numéro',
    billingCity: 'Code postal et ville',
    billingCountry: 'Pays',
    billingVatId: 'N° TVA (optionnel)',
    billingAfterTransfer: 'Après paiement, vous recevrez votre code à 9 chiffres par e-mail.',
    billingRedeemCode: 'Utiliser un code d\'activation',
    billingCodePlaceholder: 'Code à 9 chiffres',
    billingCodeHint: 'Après paiement, le code sera envoyé aux admins par e-mail.',
    billingActivate: 'Activer',
    billingHistory: 'Historique des factures',
    billingPaid: 'Payé',
    biilingCancelled: 'Annulé',
    billingPending: 'En attente',
    billingActivated: 'Plan "{plan}" activé avec succès!',
    billingCurrentPlan: 'Plan actuel:',
  },
  es: {
    rolesSubtitle: 'Define quién puede hacer qué en tu organización.',
    billingSelectPlan: 'Seleccionar plan',
    billingCurrent: 'Actual',
    billingNet: 'excl. IVA/mes',
    billingCreateInvoice: 'Crear factura',
    billingShowForm: 'Crear y ver factura',
    billingAddress: 'Dirección de facturación',
    billingNameLabel: 'Nombre / Empresa *',
    billingStreet: 'Calle y número',
    billingCity: 'CP y ciudad',
    billingCountry: 'País',
    billingVatId: 'NIF/CIF (opcional)',
    billingAfterTransfer: 'Tras el pago recibirás tu código de activación de 9 dígitos por email.',
    billingRedeemCode: 'Canjear código de activación',
    billingCodePlaceholder: 'Código de 9 dígitos',
    billingCodeHint: 'Tras el pago, el código se enviará a los admins por email.',
    billingActivate: 'Activar',
    billingHistory: 'Historial de facturas',
    billingPaid: 'Pagado',
    biilingCancelled: 'Cancelado',
    billingPending: 'Pendiente',
    billingActivated: '¡Plan "{plan}" activado con éxito!',
    billingCurrentPlan: 'Plan actual:',
  },
}

// Use en as default for all other locales
for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en
  if (!data.roles) data.roles = {}
  data.roles.subtitle = k.rolesSubtitle
  if (!data.settings) data.settings = {}
  if (!data.settings.billing) data.settings.billing = {}
  const b = data.settings.billing
  b.selectPlan = k.billingSelectPlan
  b.current = k.billingCurrent
  b.netPerMonth = k.billingNet
  b.createInvoice = k.billingCreateInvoice
  b.showForm = k.billingShowForm
  b.address = k.billingAddress
  b.nameLabel = k.billingNameLabel
  b.street = k.billingStreet
  b.city = k.billingCity
  b.country = k.billingCountry
  b.vatId = k.billingVatId
  b.afterTransfer = k.billingAfterTransfer
  b.redeemCode = k.billingRedeemCode
  b.codePlaceholder = k.billingCodePlaceholder
  b.codeHint = k.billingCodeHint
  b.activateBtn = k.billingActivate
  b.history = k.billingHistory
  b.paid = k.billingPaid
  b.cancelled = k.biilingCancelled
  b.pending = k.billingPending
  b.activated = k.billingActivated
  b.currentPlanLabel = k.billingCurrentPlan
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
