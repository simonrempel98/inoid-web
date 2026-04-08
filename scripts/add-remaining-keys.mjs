import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'

const LOCALES_DIR = 'messages'

const DE = {
  organisation: {
    tree: {
      confirmDelete: "Wirklich löschen? Alle untergeordneten Einträge werden ebenfalls gelöscht.",
      editLocation: "Standort bearbeiten", editHall: "Halle bearbeiten",
      deleteLocation: "Standort löschen", deleteHall: "Halle löschen", deleteArea: "Bereich löschen",
      addressOptional: "Adresse (optional)",
      locationPlaceholder: "Standortname z.B. Werk Bocholt",
      hallPlaceholder: "Hallenname z.B. Halle 1",
      areaPlaceholder: "Bereichsname z.B. Druckzone A",
      addLocation: "Standort hinzufügen", addHall: "Halle hinzufügen", addArea: "Bereich hinzufügen",
      noLocationsHint: "Noch keine Standorte angelegt. Füge deinen ersten Standort hinzu.",
    },
    standort: {
      back: "Organisation",
      halls: "Hallen", areas: "Bereiche",
      assetsLabel: "Assets", hallsLabel: "Hallen", areasLabel: "Bereiche",
      directTitle: "Direkt am Standort",
      empty: "Noch keine Assets an diesem Standort",
      leer: "Leer",
    },
    halle: {
      assetsTotal: "Assets gesamt", areas: "Bereiche",
      directTitle: "Direkt in der Halle",
      empty: "Noch keine Assets in dieser Halle",
      leer: "Leer",
    },
  },
  area: {
    badge: "Bereich",
    processType: "Prozesstyp", shiftModel: "Schichtmodell",
    responsible: "Verantwortlicher", areaSqm: "Fläche",
    areaSqmLabel: "Fläche (m²)", machines: "Maschinen",
    machinesLabel: "Anzahl Maschinen/Anlagen",
    hinweise: "Hinweise & Notizen",
    notesLabel: "Notizen / Sicherheitshinweise",
    notesPlaceholder: "z.B. PSA erforderlich, Lärmschutz, Zutrittsregelung...",
    docs: "Dokumente", uploadDoc: "Hochladen", uploading: "Lädt...",
    uploadingImage: "Lädt hoch...", addImage: "Bild hinzufügen",
    typicalDocs: "Typische Dokumente für diesen Bereich:",
    noAssets: "Noch keine Assets in diesem Bereich",
    selectProcess: "- Auswählen -",
    responsiblePlaceholder: "Max Mustermann",
    areaSqmPlaceholder: "350",
    machinesPlaceholder: "4",
    saveError: "Fehler: {msg}", dbError: "DB-Fehler: {msg}",
  },
  vorlagen: {
    title: "Vorlagen", new: "Neu",
    info: "Vorlagen definieren Felder und Standardwerte für neue Assets. Beim Anlegen eines Assets kannst du eine Vorlage auswählen und das Formular wird automatisch ausgefüllt.",
    noTitle: "Noch keine Vorlagen",
    noDesc: "Erstelle deine erste Vorlage für eine Asset-Kategorie.",
    noAction: "+ Erste Vorlage erstellen",
    noCategory: "Keine Kategorie",
    techFields: "{count} techn. Felder",
    commFields: "{count} komm. Felder",
    usedCount: "{count}x verwendet",
    form: {
      title: "Neue Vorlage", basics: "Grunddaten",
      iconLabel: "Icon", iconSearch: "Icon suchen... (z.B. Wrench, Gauge)",
      nameLabel: "Name *", namePlaceholder: "z.B. Bohrkrone PDC",
      descLabel: "Beschreibung", descPlaceholder: "Optionale Beschreibung...",
      categoryLabel: "Kategorie", categoryPlaceholder: "z.B. Bohrkronen",
      manufacturerLabel: "Hersteller", manufacturerPlaceholder: "z.B. Hilti",
      techFieldsTitle: "Technische Felder",
      techFieldsDesc: "Definiere welche Kennwerte bei diesem Asset-Typ erfasst werden sollen.",
      commFieldsTitle: "Kommerzielle Felder",
      commFieldsDesc: "Einkaufspreise, Lieferant, Garantie usw.",
      fieldName: "Bezeichnung", unit: "Einheit", unitPlaceholder: "mm",
      addField: "+ Feld hinzufügen",
      defaultValuePlaceholder: "Standardwert für \"{label}\"{unit} (optional)",
      commDefaultPlaceholder: "Standardwert für \"{label}\" (optional)",
      save: "Vorlage speichern", saving: "Wird gespeichert...",
      nameRequired: "Bitte einen Namen eingeben.",
    },
  },
  assets: {
    statusActions: {
      changeStatus: "Status ändern", custom: "Eigene",
      addCustomStatus: "Eigenen Status anlegen",
      deleteAsset: "Asset löschen",
      deleteTitle: "Endgültig löschen?",
      deleteDesc: "Das Asset wird unwiderruflich gelöscht.",
      deleteWarning: "Diese Aktion kann nicht rückgängig gemacht werden.",
      deleteConfirm: "Ja, löschen",
    },
    duplicate: {
      button: "Duplizieren", title: "Asset duplizieren?",
      desc: "Eine Kopie von \"{title}\" wird angelegt. Seriennummer, Fotos, QR-Code und NFC-Tag werden nicht übernommen.",
      confirm: "Ja, duplizieren", copying: "Wird kopiert...",
    },
    cardActions: {
      duplicateTitle: "Duplizieren", editTitle: "Bearbeiten",
    },
  },
  service: {
    verlauf: {
      list: "Liste", gantt: "Gantt",
      noSchedules: "Keine aktiven Wartungsintervalle für den Gantt-Chart.",
    },
  },
  invoice: {
    back: "Zurück", print: "Drucken / PDF",
    recipient: "Rechnungsempfänger",
    number: "Rechnungsnummer", date: "Rechnungsdatum", dueDate: "Zahlungsziel",
    statusLabel: "Status",
    statusPaid: "Bezahlt", statusCancelled: "Storniert", statusPending: "Ausstehend",
    title: "Rechnung",
    descCol: "Beschreibung", amountCol: "Betrag (netto)",
    planDesc: "INOid {plan} - Monatslizenz",
    planSubDesc: "Zugang zur INOid Asset-Management-Plattform, {plan}-Plan, monatlich kündbar",
    netAmount: "Nettobetrag", vatAmount: "zzgl. {rate} % MwSt.", grossAmount: "Gesamtbetrag",
    bankTitle: "Bankverbindung",
    bankRecipient: "Empfänger", bankName: "Bank", bankIBAN: "IBAN",
    bankBIC: "BIC", bankRef: "Verwendungszweck",
    activationTitle: "Aktivierungscode",
    activationDesc: "Geben Sie diesen Code unter Abonnement - Aktivierungscode ein, um Ihren Plan zu aktivieren.",
    footer1: "Diese Rechnung wurde gemäß §14 UStG ausgestellt. Der Rechnungsaussteller ist im deutschen Handelsregister eingetragen.",
    footer2: "Bei Fragen wenden Sie sich bitte an: {email}",
    vatId: "USt-ID", taxNumber: "St-Nr.",
    defaultCountry: "Deutschland",
    companyTag: "Inomet GmbH",
  },
}

const EN = {
  organisation: {
    tree: {
      confirmDelete: "Really delete? All subordinate entries will also be deleted.",
      editLocation: "Edit location", editHall: "Edit hall",
      deleteLocation: "Delete location", deleteHall: "Delete hall", deleteArea: "Delete area",
      addressOptional: "Address (optional)",
      locationPlaceholder: "Location name e.g. Plant Bocholt",
      hallPlaceholder: "Hall name e.g. Hall 1",
      areaPlaceholder: "Area name e.g. Printing Zone A",
      addLocation: "Add location", addHall: "Add hall", addArea: "Add area",
      noLocationsHint: "No locations yet. Add your first location.",
    },
    standort: {
      back: "Organisation",
      halls: "Halls", areas: "Areas",
      assetsLabel: "Assets", hallsLabel: "Halls", areasLabel: "Areas",
      directTitle: "Directly at location",
      empty: "No assets at this location yet",
      leer: "Empty",
    },
    halle: {
      assetsTotal: "Total assets", areas: "Areas",
      directTitle: "Directly in hall",
      empty: "No assets in this hall yet",
      leer: "Empty",
    },
  },
  area: {
    badge: "Area",
    processType: "Process type", shiftModel: "Shift model",
    responsible: "Responsible", areaSqm: "Area",
    areaSqmLabel: "Area (m²)", machines: "Machines",
    machinesLabel: "Number of machines/systems",
    hinweise: "Notes & hints",
    notesLabel: "Notes / safety instructions",
    notesPlaceholder: "e.g. PPE required, noise protection, access regulations...",
    docs: "Documents", uploadDoc: "Upload", uploading: "Loading...",
    uploadingImage: "Uploading...", addImage: "Add image",
    typicalDocs: "Typical documents for this area:",
    noAssets: "No assets in this area yet",
    selectProcess: "- Select -",
    responsiblePlaceholder: "John Doe",
    areaSqmPlaceholder: "350",
    machinesPlaceholder: "4",
    saveError: "Error: {msg}", dbError: "DB error: {msg}",
  },
  vorlagen: {
    title: "Templates", new: "New",
    info: "Templates define fields and default values for new assets. When creating an asset, you can select a template and the form will be automatically filled in.",
    noTitle: "No templates yet",
    noDesc: "Create your first template for an asset category.",
    noAction: "+ Create first template",
    noCategory: "No category",
    techFields: "{count} tech. fields",
    commFields: "{count} comm. fields",
    usedCount: "{count}x used",
    form: {
      title: "New template", basics: "Basic data",
      iconLabel: "Icon", iconSearch: "Search icon... (e.g. Wrench, Gauge)",
      nameLabel: "Name *", namePlaceholder: "e.g. PDC drill bit",
      descLabel: "Description", descPlaceholder: "Optional description...",
      categoryLabel: "Category", categoryPlaceholder: "e.g. Drill bits",
      manufacturerLabel: "Manufacturer", manufacturerPlaceholder: "e.g. Hilti",
      techFieldsTitle: "Technical fields",
      techFieldsDesc: "Define which parameters should be recorded for this asset type.",
      commFieldsTitle: "Commercial fields",
      commFieldsDesc: "Purchase prices, supplier, warranty etc.",
      fieldName: "Label", unit: "Unit", unitPlaceholder: "mm",
      addField: "+ Add field",
      defaultValuePlaceholder: "Default value for \"{label}\"{unit} (optional)",
      commDefaultPlaceholder: "Default value for \"{label}\" (optional)",
      save: "Save template", saving: "Saving...",
      nameRequired: "Please enter a name.",
    },
  },
  assets: {
    statusActions: {
      changeStatus: "Change status", custom: "Custom",
      addCustomStatus: "Add custom status",
      deleteAsset: "Delete asset",
      deleteTitle: "Permanently delete?",
      deleteDesc: "The asset will be irreversibly deleted.",
      deleteWarning: "This action cannot be undone.",
      deleteConfirm: "Yes, delete",
    },
    duplicate: {
      button: "Duplicate", title: "Duplicate asset?",
      desc: "A copy of \"{title}\" will be created. Serial number, photos, QR code and NFC tag will not be copied.",
      confirm: "Yes, duplicate", copying: "Copying...",
    },
    cardActions: {
      duplicateTitle: "Duplicate", editTitle: "Edit",
    },
  },
  service: {
    verlauf: {
      list: "List", gantt: "Gantt",
      noSchedules: "No active maintenance intervals for the Gantt chart.",
    },
  },
  invoice: {
    back: "Back", print: "Print / PDF",
    recipient: "Invoice recipient",
    number: "Invoice number", date: "Invoice date", dueDate: "Due date",
    statusLabel: "Status",
    statusPaid: "Paid", statusCancelled: "Cancelled", statusPending: "Pending",
    title: "Invoice",
    descCol: "Description", amountCol: "Amount (net)",
    planDesc: "INOid {plan} - Monthly license",
    planSubDesc: "Access to the INOid asset management platform, {plan} plan, cancellable monthly",
    netAmount: "Net amount", vatAmount: "plus {rate}% VAT", grossAmount: "Total amount",
    bankTitle: "Bank details",
    bankRecipient: "Recipient", bankName: "Bank", bankIBAN: "IBAN",
    bankBIC: "BIC", bankRef: "Reference",
    activationTitle: "Activation code",
    activationDesc: "Enter this code under Subscription - Activation code to activate your plan.",
    footer1: "This invoice was issued in accordance with §14 UStG. The invoice issuer is registered in the German commercial register.",
    footer2: "For questions please contact: {email}",
    vatId: "VAT ID", taxNumber: "Tax no.",
    defaultCountry: "Germany",
    companyTag: "Inomet GmbH",
  },
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {}
      deepMerge(target[key], source[key])
    } else {
      if (target[key] === undefined) target[key] = source[key]
    }
  }
  return target
}

const files = readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json'))

for (const file of files) {
  const locale = file.replace('.json', '')
  const filePath = join(LOCALES_DIR, file)
  const data = JSON.parse(readFileSync(filePath, 'utf8'))

  const base = locale === 'de' ? DE : EN

  if (!data.organisation.tree) data.organisation.tree = {}
  if (!data.organisation.standort) data.organisation.standort = {}
  if (!data.organisation.halle) data.organisation.halle = {}
  deepMerge(data.organisation.tree, base.organisation.tree)
  deepMerge(data.organisation.standort, base.organisation.standort)
  deepMerge(data.organisation.halle, base.organisation.halle)

  if (!data.area) data.area = {}
  deepMerge(data.area, base.area)

  if (!data.vorlagen) data.vorlagen = {}
  deepMerge(data.vorlagen, base.vorlagen)

  if (!data.assets.statusActions) data.assets.statusActions = {}
  if (!data.assets.duplicate) data.assets.duplicate = {}
  if (!data.assets.cardActions) data.assets.cardActions = {}
  deepMerge(data.assets.statusActions, base.assets.statusActions)
  deepMerge(data.assets.duplicate, base.assets.duplicate)
  deepMerge(data.assets.cardActions, base.assets.cardActions)

  if (!data.service.verlauf) data.service.verlauf = {}
  deepMerge(data.service.verlauf, base.service.verlauf)

  if (!data.invoice) data.invoice = {}
  deepMerge(data.invoice, base.invoice)

  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8')
  process.stdout.write('.')
}
console.log('\nDone.')
