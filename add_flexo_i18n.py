#!/usr/bin/env python3
"""Add missing flexodruck i18n keys to all 28 language files."""
import json, os, glob

BASE_DIR = r'C:\Users\Simon\Projects\inoid-web\messages'

# German translations for all new keys (and fixes for existing wrong ones)
DE_KEYS = {
    # Fixes to existing keys
    'active': 'Aktiv',
    'inactive': 'Inaktiv',
    # New keys
    'nameRequired': 'Name erforderlich',
    'selectMachineRequired': 'Bitte Maschine auswählen',
    'newMachineSubtitle': 'Druckwerke und Trägerstangen werden automatisch erstellt.',
    'druckwerkeAutoCreated': 'Pro Druckwerk werden automatisch 2 Trägerstangen als feste Einbauten angelegt.',
    'previewTitle': 'Vorschau: Was wird angelegt?',
    'previewStepsTitle': 'Vorschau: Rüstschritte pro Druckwerk',
    'creating': 'Wird angelegt\u2026',
    'createMachine': 'Maschine anlegen',
    'createTemplate': 'Vorlage anlegen',
    'createSetup': 'Rüstvorgang anlegen',
    'creating_setup': 'Wird erstellt\u2026',
    'cancel': 'Abbrechen',
    'save': 'Speichern',
    'saving': 'Wird gespeichert\u2026',
    'back': 'zurück',
    'nextDW': 'weiter',
    'nextToDW': 'Weiter zu',
    'stepsCompleted': '{done} von {total} Schritten erledigt ({pct}%)',
    'readyToStart': 'Bereit zum Rüsten?',
    'readyToStartDesc': 'Starte den Rüstvorgang, um die Schritte abzuhaken.',
    'startButton': 'Starten',
    'allStepsDone': 'Alle Schritte erledigt!',
    'allStepsDoneDesc': 'Der Rüstvorgang kann jetzt abgeschlossen werden.',
    'completeButton': 'Abschließen',
    'setupCompletedBanner': 'Rüstvorgang abgeschlossen',
    'toMachine': 'Zur Maschine',
    'overview': 'Übersicht',
    'noStepsForDW': 'Keine Schritte für dieses Druckwerk.',
    'fixed': 'fest',
    'change': 'ändern',
    'assignAsset': 'Asset zuweisen',
    'variableSlotTypesDesc': 'Diese Slot-Typen können pro Druckwerk mit einem Asset belegt werden. Die Trägerstangen sind immer als feste Einbauten vorhanden.',
    'addSlotPlaceholder': 'Neuer Slot-Typ (z.B. Adapter, Rasterwalze\u2026)',
    'sharedMachinesLabel': 'Auch verfügbar für andere Maschinen',
    'sharedMachinesDesc': 'Optional: Diese Vorlage auch für folgende Maschinen freigeben.',
    'newSetupSubtitle': 'Wähle Maschine und Vorlage – dann geht es los mit dem geführten Setup.',
    'noMachinesYet': 'Es gibt noch keine aktiven Maschinen. Bitte zuerst eine Maschine anlegen.',
    'withoutTemplate': 'Ohne Vorlage (manuell)',
    'setupNameLabel': 'Name / Bezeichnung',
    'startSetupButton': 'Rüstvorgang starten',
    'noSlotsYet': 'Diese Vorlage hat noch keine variablen Slot-Typen definiert.',
    'matrixHintEdit': 'Klicke auf eine Zelle, um das Asset für diesen Druckwerk-Slot zuzuweisen.',
    'matrixHintView': 'Übersicht der Asset-Zuweisungen pro Druckwerk.',
    'slotTypeHeader': 'Slot-Typ',
    'fixedSlotsInfo': 'Trägerstange 1 & 2 werden separat pro Druckwerk in der Maschinenansicht konfiguriert.',
    'addAsset': '+ Asset',
    'currentlyLinked': 'Aktuell verknüpft',
    'remove': 'Entfernen',
    'searchAsset': 'Asset suchen\u2026',
    'noAssetsFound': 'Keine Assets gefunden',
    'noAssetRemove': 'Kein Asset (Zuweisung entfernen)',
}

# English translations for all new keys
EN_KEYS = {
    'active': 'Active',
    'inactive': 'Inactive',
    'nameRequired': 'Name required',
    'selectMachineRequired': 'Please select a machine',
    'newMachineSubtitle': 'Printing units and carrier bars will be created automatically.',
    'druckwerkeAutoCreated': 'Each printing unit automatically gets 2 carrier bars as fixed slots.',
    'previewTitle': 'Preview: What will be created?',
    'previewStepsTitle': 'Preview: Setup steps per printing unit',
    'creating': 'Creating\u2026',
    'createMachine': 'Create machine',
    'createTemplate': 'Create template',
    'createSetup': 'Create setup',
    'creating_setup': 'Creating\u2026',
    'cancel': 'Cancel',
    'save': 'Save',
    'saving': 'Saving\u2026',
    'back': 'back',
    'nextDW': 'next',
    'nextToDW': 'Next:',
    'stepsCompleted': '{done} of {total} steps done ({pct}%)',
    'readyToStart': 'Ready to start?',
    'readyToStartDesc': 'Start the setup to check off the steps.',
    'startButton': 'Start',
    'allStepsDone': 'All steps done!',
    'allStepsDoneDesc': 'The setup can now be completed.',
    'completeButton': 'Complete',
    'setupCompletedBanner': 'Setup completed',
    'toMachine': 'To machine',
    'overview': 'Overview',
    'noStepsForDW': 'No steps for this printing unit.',
    'fixed': 'fixed',
    'change': 'change',
    'assignAsset': 'Assign asset',
    'variableSlotTypesDesc': 'These slot types can be assigned an asset per printing unit. Carrier bars are always present as fixed slots.',
    'addSlotPlaceholder': 'New slot type (e.g. Adapter, Anilox\u2026)',
    'sharedMachinesLabel': 'Also available for other machines',
    'sharedMachinesDesc': 'Optional: Share this template with the following machines.',
    'newSetupSubtitle': 'Choose machine and template – then start the guided setup.',
    'noMachinesYet': 'No active machines yet. Please create a machine first.',
    'withoutTemplate': 'Without template (manual)',
    'setupNameLabel': 'Name / Label',
    'startSetupButton': 'Start setup',
    'noSlotsYet': 'This template has no variable slot types defined yet.',
    'matrixHintEdit': 'Click a cell to assign the asset for this printing unit slot.',
    'matrixHintView': 'Overview of asset assignments per printing unit.',
    'slotTypeHeader': 'Slot type',
    'fixedSlotsInfo': 'Carrier bar 1 & 2 are configured separately per printing unit in the machine view.',
    'addAsset': '+ Asset',
    'currentlyLinked': 'Currently linked',
    'remove': 'Remove',
    'searchAsset': 'Search asset\u2026',
    'noAssetsFound': 'No assets found',
    'noAssetRemove': 'No asset (remove assignment)',
}

files = glob.glob(os.path.join(BASE_DIR, '*.json'))
print(f'Found {len(files)} language files')

for fpath in sorted(files):
    lang = os.path.basename(fpath).replace('.json', '')
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    flexo = data.get('flexodruck', {})
    keys_to_use = DE_KEYS if lang == 'de' else EN_KEYS

    updated = False
    for key, val in keys_to_use.items():
        if key not in flexo or (key in ('active', 'inactive') and flexo[key] in ('Active', 'Inactive', 'active', 'inactive')):
            flexo[key] = val
            updated = True

    data['flexodruck'] = flexo

    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

    print(f'  Updated {lang}' if updated else f'  Skipped {lang} (no changes)')

print('Done.')
