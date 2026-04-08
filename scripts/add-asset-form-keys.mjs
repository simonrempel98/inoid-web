import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: {
    newAsset: 'Neues Asset',
    editAsset: 'Asset bearbeiten',
    stepOf: 'Schritt {step} von {total} · {name}',
    stepBasisdaten: 'Basisdaten',
    stepFotos: 'Fotos',
    stepTechnik: 'Technik',
    stepKommerziell: 'Kommerziell',
    stepQrNfc: 'QR / NFC',
    nameLabel: 'Bezeichnung',
    nameRequired: 'Bezeichnung *',
    articleNumber: 'Artikelnummer',
    serialNumber: 'Seriennummer',
    orderNumber: 'Bestellnummer',
    category: 'Kategorie',
    manufacturer: 'Hersteller',
    location: 'Standort',
    description: 'Beschreibung',
    status: 'Status',
    namePlaceholder: 'z.B. Bohrkrone PDC 125mm',
    locationPlaceholder: 'z.B. Lager A',
    descriptionPlaceholder: 'Optionale Beschreibung…',
    photosHint: 'Bis zu 10 Fotos. Das erste Bild wird als Titelbild verwendet.',
    coverPhoto: 'Titelbild',
    photo: 'Foto',
    techHint: 'Füge technische Kennwerte hinzu (z.B. Gewicht, Leistung, Maße).',
    commHint: 'Füge kommerzielle Informationen hinzu (z.B. Kaufpreis, Lieferant, Garantie).',
    fieldName: 'Bezeichnung',
    fieldValue: 'Wert',
    addField: '+ Feld hinzufügen',
    back: 'Zurück',
    next: 'Weiter',
    saving: 'Wird gespeichert…',
    saveAsset: 'Asset speichern ✓',
    saved: 'Asset angelegt!',
    savedDesc: '„{title}" wurde erfolgreich gespeichert.',
    openAsset: 'Asset öffnen',
    toOverview: 'Zur Übersicht',
    uuidTitle: 'Asset-UUID',
    uuidDesc: 'Diese UUID wird automatisch für QR-Code und NFC-Tag verwendet. Sie kann nicht manuell geändert werden.',
    copy: 'Kopieren',
    copied: '✓ Kopiert',
    nfcTitle: 'NFC-Tag programmieren',
    nfcDesc: 'Kopiere die UUID oben und schreibe sie auf deinen NFC-Tag – z.B. mit einer NFC-Schreib-App auf dem Smartphone.',
    saveChanges: 'Änderungen speichern',
    deleteAsset: 'Asset löschen',
    deleteConfirm: 'Wirklich löschen?',
    deleteDesc: 'Das Asset wird ausgeblendet und kann nicht mehr gefunden werden.',
    yesDelete: 'Ja, löschen',
    qrTitle: 'QR-Code',
    qrLink: 'QR-Link',
    qrFixed: 'Der QR-Code ist fest mit der UUID verknüpft und kann nicht geändert werden.',
    nfcUuid: 'NFC-Tag & UUID',
    nfcUuidDesc: 'Die UUID ist fest mit diesem Asset verknüpft und kann nicht geändert werden. Kopiere sie, um deinen NFC-Tag zu programmieren.',
    noPhotos: 'Noch keine Fotos. Bis zu 10 möglich.',
    techSection: 'Technische Daten',
    commSection: 'Kommerzielle Daten',
    loading: 'Lädt…',
    nameEmpty: 'Bezeichnung darf nicht leer sein.',
    notLoggedIn: 'Nicht eingeloggt',
    noOrg: 'Keine Organisation gefunden',
    saveFailed: 'Asset konnte nicht gespeichert werden',
    uploadFailed: 'Bild-Upload fehlgeschlagen',
    updateFailed: 'Fehler beim Speichern',
    deleteFailed: 'Fehler beim Löschen',
    statusDecommissioned: 'Außer Betrieb',
  },
  en: {
    newAsset: 'New Asset',
    editAsset: 'Edit Asset',
    stepOf: 'Step {step} of {total} · {name}',
    stepBasisdaten: 'Basic Data',
    stepFotos: 'Photos',
    stepTechnik: 'Technical',
    stepKommerziell: 'Commercial',
    stepQrNfc: 'QR / NFC',
    nameLabel: 'Name',
    nameRequired: 'Name *',
    articleNumber: 'Article number',
    serialNumber: 'Serial number',
    orderNumber: 'Order number',
    category: 'Category',
    manufacturer: 'Manufacturer',
    location: 'Location',
    description: 'Description',
    status: 'Status',
    namePlaceholder: 'e.g. Drill bit PDC 125mm',
    locationPlaceholder: 'e.g. Warehouse A',
    descriptionPlaceholder: 'Optional description…',
    photosHint: 'Up to 10 photos. The first image is used as the cover photo.',
    coverPhoto: 'Cover',
    photo: 'Photo',
    techHint: 'Add technical specifications (e.g. weight, power, dimensions).',
    commHint: 'Add commercial information (e.g. purchase price, supplier, warranty).',
    fieldName: 'Label',
    fieldValue: 'Value',
    addField: '+ Add field',
    back: 'Back',
    next: 'Next',
    saving: 'Saving…',
    saveAsset: 'Save asset ✓',
    saved: 'Asset created!',
    savedDesc: '"{title}" has been saved successfully.',
    openAsset: 'Open asset',
    toOverview: 'To overview',
    uuidTitle: 'Asset UUID',
    uuidDesc: 'This UUID is automatically used for QR code and NFC tag. It cannot be changed manually.',
    copy: 'Copy',
    copied: '✓ Copied',
    nfcTitle: 'Program NFC tag',
    nfcDesc: 'Copy the UUID above and write it to your NFC tag – e.g. with an NFC writer app on your smartphone.',
    saveChanges: 'Save changes',
    deleteAsset: 'Delete asset',
    deleteConfirm: 'Really delete?',
    deleteDesc: 'The asset will be hidden and can no longer be found.',
    yesDelete: 'Yes, delete',
    qrTitle: 'QR Code',
    qrLink: 'QR link',
    qrFixed: 'The QR code is permanently linked to the UUID and cannot be changed.',
    nfcUuid: 'NFC tag & UUID',
    nfcUuidDesc: 'The UUID is permanently linked to this asset and cannot be changed. Copy it to program your NFC tag.',
    noPhotos: 'No photos yet. Up to 10 possible.',
    techSection: 'Technical Data',
    commSection: 'Commercial Data',
    loading: 'Loading…',
    nameEmpty: 'Name must not be empty.',
    notLoggedIn: 'Not logged in',
    noOrg: 'No organization found',
    saveFailed: 'Asset could not be saved',
    uploadFailed: 'Image upload failed',
    updateFailed: 'Error saving',
    deleteFailed: 'Error deleting',
    statusDecommissioned: 'Decommissioned',
  },
  fr: {
    newAsset: 'Nouvel actif',
    editAsset: 'Modifier l\'actif',
    stepOf: 'Étape {step} sur {total} · {name}',
    stepBasisdaten: 'Données de base',
    stepFotos: 'Photos',
    stepTechnik: 'Technique',
    stepKommerziell: 'Commercial',
    stepQrNfc: 'QR / NFC',
    nameLabel: 'Désignation',
    nameRequired: 'Désignation *',
    articleNumber: 'Numéro d\'article',
    serialNumber: 'Numéro de série',
    orderNumber: 'Numéro de commande',
    category: 'Catégorie',
    manufacturer: 'Fabricant',
    location: 'Emplacement',
    description: 'Description',
    status: 'Statut',
    namePlaceholder: 'p.ex. Trépan PDC 125mm',
    locationPlaceholder: 'p.ex. Entrepôt A',
    descriptionPlaceholder: 'Description optionnelle…',
    photosHint: 'Jusqu\'à 10 photos. La première image est utilisée comme photo de couverture.',
    coverPhoto: 'Couverture',
    photo: 'Photo',
    techHint: 'Ajoutez des spécifications techniques (p.ex. poids, puissance, dimensions).',
    commHint: 'Ajoutez des informations commerciales (p.ex. prix d\'achat, fournisseur, garantie).',
    fieldName: 'Étiquette',
    fieldValue: 'Valeur',
    addField: '+ Ajouter un champ',
    back: 'Retour',
    next: 'Suivant',
    saving: 'Enregistrement…',
    saveAsset: 'Enregistrer l\'actif ✓',
    saved: 'Actif créé !',
    savedDesc: '"{title}" a été enregistré avec succès.',
    openAsset: 'Ouvrir l\'actif',
    toOverview: 'Vue d\'ensemble',
    uuidTitle: 'UUID de l\'actif',
    uuidDesc: 'Cet UUID est automatiquement utilisé pour le QR code et le tag NFC. Il ne peut pas être modifié manuellement.',
    copy: 'Copier',
    copied: '✓ Copié',
    nfcTitle: 'Programmer le tag NFC',
    nfcDesc: 'Copiez l\'UUID ci-dessus et écrivez-le sur votre tag NFC – p.ex. avec une application NFC sur votre smartphone.',
    saveChanges: 'Enregistrer les modifications',
    deleteAsset: 'Supprimer l\'actif',
    deleteConfirm: 'Vraiment supprimer ?',
    deleteDesc: 'L\'actif sera masqué et ne pourra plus être trouvé.',
    yesDelete: 'Oui, supprimer',
    qrTitle: 'QR Code',
    qrLink: 'Lien QR',
    qrFixed: 'Le QR code est lié de façon permanente à l\'UUID et ne peut pas être modifié.',
    nfcUuid: 'Tag NFC & UUID',
    nfcUuidDesc: 'L\'UUID est lié de façon permanente à cet actif et ne peut pas être modifié. Copiez-le pour programmer votre tag NFC.',
    noPhotos: 'Pas encore de photos. Jusqu\'à 10 possibles.',
    techSection: 'Données techniques',
    commSection: 'Données commerciales',
    loading: 'Chargement…',
    nameEmpty: 'La désignation ne peut pas être vide.',
    notLoggedIn: 'Non connecté',
    noOrg: 'Aucune organisation trouvée',
    saveFailed: 'L\'actif n\'a pas pu être enregistré',
    uploadFailed: 'Échec du téléversement d\'image',
    updateFailed: 'Erreur lors de l\'enregistrement',
    deleteFailed: 'Erreur lors de la suppression',
    statusDecommissioned: 'Désactivé',
  },
  es: {
    newAsset: 'Nuevo activo',
    editAsset: 'Editar activo',
    stepOf: 'Paso {step} de {total} · {name}',
    stepBasisdaten: 'Datos básicos',
    stepFotos: 'Fotos',
    stepTechnik: 'Técnico',
    stepKommerziell: 'Comercial',
    stepQrNfc: 'QR / NFC',
    nameLabel: 'Designación',
    nameRequired: 'Designación *',
    articleNumber: 'Número de artículo',
    serialNumber: 'Número de serie',
    orderNumber: 'Número de pedido',
    category: 'Categoría',
    manufacturer: 'Fabricante',
    location: 'Ubicación',
    description: 'Descripción',
    status: 'Estado',
    namePlaceholder: 'p.ej. Broca PDC 125mm',
    locationPlaceholder: 'p.ej. Almacén A',
    descriptionPlaceholder: 'Descripción opcional…',
    photosHint: 'Hasta 10 fotos. La primera imagen se usa como foto de portada.',
    coverPhoto: 'Portada',
    photo: 'Foto',
    techHint: 'Añade especificaciones técnicas (p.ej. peso, potencia, dimensiones).',
    commHint: 'Añade información comercial (p.ej. precio de compra, proveedor, garantía).',
    fieldName: 'Etiqueta',
    fieldValue: 'Valor',
    addField: '+ Añadir campo',
    back: 'Atrás',
    next: 'Siguiente',
    saving: 'Guardando…',
    saveAsset: 'Guardar activo ✓',
    saved: '¡Activo creado!',
    savedDesc: '"{title}" se ha guardado correctamente.',
    openAsset: 'Abrir activo',
    toOverview: 'Vista general',
    uuidTitle: 'UUID del activo',
    uuidDesc: 'Este UUID se usa automáticamente para el código QR y la etiqueta NFC. No se puede cambiar manualmente.',
    copy: 'Copiar',
    copied: '✓ Copiado',
    nfcTitle: 'Programar etiqueta NFC',
    nfcDesc: 'Copia el UUID de arriba y escríbelo en tu etiqueta NFC – p.ej. con una app NFC en tu smartphone.',
    saveChanges: 'Guardar cambios',
    deleteAsset: 'Eliminar activo',
    deleteConfirm: '¿Realmente eliminar?',
    deleteDesc: 'El activo quedará oculto y no podrá encontrarse.',
    yesDelete: 'Sí, eliminar',
    qrTitle: 'Código QR',
    qrLink: 'Enlace QR',
    qrFixed: 'El código QR está vinculado permanentemente al UUID y no puede cambiarse.',
    nfcUuid: 'Etiqueta NFC & UUID',
    nfcUuidDesc: 'El UUID está vinculado permanentemente a este activo y no puede cambiarse. Cópialo para programar tu etiqueta NFC.',
    noPhotos: 'Sin fotos aún. Hasta 10 posibles.',
    techSection: 'Datos técnicos',
    commSection: 'Datos comerciales',
    loading: 'Cargando…',
    nameEmpty: 'La designación no puede estar vacía.',
    notLoggedIn: 'No conectado',
    noOrg: 'No se encontró organización',
    saveFailed: 'No se pudo guardar el activo',
    uploadFailed: 'Error al subir imagen',
    updateFailed: 'Error al guardar',
    deleteFailed: 'Error al eliminar',
    statusDecommissioned: 'Dado de baja',
  },
  it: {
    newAsset: 'Nuovo asset',
    editAsset: 'Modifica asset',
    stepOf: 'Passo {step} di {total} · {name}',
    stepBasisdaten: 'Dati base',
    stepFotos: 'Foto',
    stepTechnik: 'Tecnico',
    stepKommerziell: 'Commerciale',
    stepQrNfc: 'QR / NFC',
    nameLabel: 'Denominazione',
    nameRequired: 'Denominazione *',
    articleNumber: 'Numero articolo',
    serialNumber: 'Numero di serie',
    orderNumber: 'Numero ordine',
    category: 'Categoria',
    manufacturer: 'Produttore',
    location: 'Posizione',
    description: 'Descrizione',
    status: 'Stato',
    namePlaceholder: 'es. Punta PDC 125mm',
    locationPlaceholder: 'es. Magazzino A',
    descriptionPlaceholder: 'Descrizione opzionale…',
    photosHint: 'Fino a 10 foto. La prima immagine viene usata come copertina.',
    coverPhoto: 'Copertina',
    photo: 'Foto',
    techHint: 'Aggiungi specifiche tecniche (es. peso, potenza, dimensioni).',
    commHint: 'Aggiungi informazioni commerciali (es. prezzo d\'acquisto, fornitore, garanzia).',
    fieldName: 'Etichetta',
    fieldValue: 'Valore',
    addField: '+ Aggiungi campo',
    back: 'Indietro',
    next: 'Avanti',
    saving: 'Salvataggio…',
    saveAsset: 'Salva asset ✓',
    saved: 'Asset creato!',
    savedDesc: '"{title}" è stato salvato con successo.',
    openAsset: 'Apri asset',
    toOverview: 'Panoramica',
    uuidTitle: 'UUID asset',
    uuidDesc: 'Questo UUID viene utilizzato automaticamente per il codice QR e il tag NFC. Non può essere modificato manualmente.',
    copy: 'Copia',
    copied: '✓ Copiato',
    nfcTitle: 'Programma tag NFC',
    nfcDesc: 'Copia l\'UUID sopra e scrivilo sul tuo tag NFC – es. con un\'app NFC sul tuo smartphone.',
    saveChanges: 'Salva modifiche',
    deleteAsset: 'Elimina asset',
    deleteConfirm: 'Eliminare davvero?',
    deleteDesc: 'L\'asset sarà nascosto e non potrà più essere trovato.',
    yesDelete: 'Sì, elimina',
    qrTitle: 'Codice QR',
    qrLink: 'Link QR',
    qrFixed: 'Il codice QR è collegato definitivamente all\'UUID e non può essere modificato.',
    nfcUuid: 'Tag NFC & UUID',
    nfcUuidDesc: 'L\'UUID è collegato definitivamente a questo asset e non può essere modificato. Copialo per programmare il tuo tag NFC.',
    noPhotos: 'Nessuna foto ancora. Fino a 10 possibili.',
    techSection: 'Dati tecnici',
    commSection: 'Dati commerciali',
    loading: 'Caricamento…',
    nameEmpty: 'La denominazione non può essere vuota.',
    notLoggedIn: 'Non connesso',
    noOrg: 'Nessuna organizzazione trovata',
    saveFailed: 'Impossibile salvare l\'asset',
    uploadFailed: 'Caricamento immagine fallito',
    updateFailed: 'Errore durante il salvataggio',
    deleteFailed: 'Errore durante l\'eliminazione',
    statusDecommissioned: 'Dismesso',
  },
}

for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en

  if (!data.assets) data.assets = {}
  if (!data.assets.form) data.assets.form = {}
  const f = data.assets.form

  f.newAsset = k.newAsset
  f.editAsset = k.editAsset
  f.stepOf = k.stepOf
  if (!f.steps) f.steps = {}
  f.steps.basisdaten = k.stepBasisdaten
  f.steps.fotos = k.stepFotos
  f.steps.technik = k.stepTechnik
  f.steps.kommerziell = k.stepKommerziell
  f.steps.qrNfc = k.stepQrNfc
  f.nameLabel = k.nameLabel
  f.nameRequired = k.nameRequired
  f.articleNumber = k.articleNumber
  f.serialNumber = k.serialNumber
  f.orderNumber = k.orderNumber
  f.category = k.category
  f.manufacturer = k.manufacturer
  f.location = k.location
  f.description = k.description
  f.status = k.status
  f.namePlaceholder = k.namePlaceholder
  f.locationPlaceholder = k.locationPlaceholder
  f.descriptionPlaceholder = k.descriptionPlaceholder
  f.photosHint = k.photosHint
  f.coverPhoto = k.coverPhoto
  f.photo = k.photo
  f.techHint = k.techHint
  f.commHint = k.commHint
  f.fieldName = k.fieldName
  f.fieldValue = k.fieldValue
  f.addField = k.addField
  f.back = k.back
  f.next = k.next
  f.saving = k.saving
  f.saveAsset = k.saveAsset
  f.saved = k.saved
  f.savedDesc = k.savedDesc
  f.openAsset = k.openAsset
  f.toOverview = k.toOverview
  f.uuidTitle = k.uuidTitle
  f.uuidDesc = k.uuidDesc
  f.copy = k.copy
  f.copied = k.copied
  f.nfcTitle = k.nfcTitle
  f.nfcDesc = k.nfcDesc
  f.saveChanges = k.saveChanges
  f.deleteAsset = k.deleteAsset
  f.deleteConfirm = k.deleteConfirm
  f.deleteDesc = k.deleteDesc
  f.yesDelete = k.yesDelete
  f.qrTitle = k.qrTitle
  f.qrLink = k.qrLink
  f.qrFixed = k.qrFixed
  f.nfcUuid = k.nfcUuid
  f.nfcUuidDesc = k.nfcUuidDesc
  f.noPhotos = k.noPhotos
  f.techSection = k.techSection
  f.commSection = k.commSection
  f.loading = k.loading
  f.nameEmpty = k.nameEmpty
  f.notLoggedIn = k.notLoggedIn
  f.noOrg = k.noOrg
  f.saveFailed = k.saveFailed
  f.uploadFailed = k.uploadFailed
  f.updateFailed = k.updateFailed
  f.deleteFailed = k.deleteFailed
  f.statusDecommissioned = k.statusDecommissioned

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
