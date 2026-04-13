# -*- coding: utf-8 -*-
"""
Adds Flexodruck feature (f12), tip t7, nav entry and hero.s2val update
to all 28 language files.
"""
import json, os, sys

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')

TRANSLATIONS = {
    'de': {
        'f12_title': 'Flexodruck-Module',
        'f12_desc': 'Spezialisierte Werkzeuge für Flexodruck-Profis. Der Anilox-Rechner berechnet Zellvolumen, Farbverbrauch, Filmdicke und Kosten — Berechnungen werden pro Nutzer mit Name und Notiz gespeichert.',
        'f12_points': [
            'Anilox-Rechner: 5 Modi — Volumen, Farbverbrauch, Filmdicke, Volumen rückwärts, Vergleich',
            'Einheiten wählen: metrisch (cm³/m²) oder US (BCM)',
            'Alle 6 Zellgeometrien: Hexagonal, Tri-helical, Quadrangulär, Diamant, Kanal, Knurl',
            'Farbverwaltung: Lieferant, Typ, Dichte und Kosten (€/kg) hinterlegen',
            'Kostenberechnung: €/Stunde, €/1.000 lm und €/10.000 lm',
            'Berechnungen speicherbar mit Name, Notiz und Verlauf',
            'Optionales Zusatzmodul — durch Admin aktivierbar',
        ],
        't7': 'Im Flexodruck-Modul: Lege deine Farben einmal mit Dichte und Preis an — der Anilox-Rechner trägt die Dichte automatisch ein und berechnet die Kosten pro Stunde und pro Laufmeter.',
        'nav_b': 'Seitenleiste → Flexodruck → Guided Setup / Anilox-Rechner',
    },
    'en': {
        'f12_title': 'Flexo Printing Modules',
        'f12_desc': 'Specialised tools for flexo printing professionals. The Anilox Calculator computes cell volume, ink consumption, film thickness and costs — calculations are saved per user with name and note.',
        'f12_points': [
            'Anilox Calculator: 5 modes — Volume, Ink Consumption, Film Thickness, Reverse, Comparison',
            'Choose units: metric (cm³/m²) or US (BCM)',
            'All 6 cell geometries: Hexagonal, Tri-helical, Quadrangular, Diamond, Channel, Knurl',
            'Ink management: store supplier, type, density and cost (€/kg)',
            'Cost calculation: €/hour, €/1,000 lm and €/10,000 lm',
            'Save calculations with name, note and history view',
            'Optional add-on module — activatable by admin',
        ],
        't7': 'In the Flexo module: set up your inks once with density and price — the Anilox Calculator auto-fills the density and calculates costs per hour and per linear metre.',
        'nav_b': 'Sidebar → Flexo → Guided Setup / Anilox Calculator',
    },
    'fr': {
        'f12_title': 'Modules Flexographie',
        'f12_desc': "Outils spécialisés pour les professionnels de la flexographie. Le calculateur Anilox calcule le volume de cellule, la consommation d'encre, l'épaisseur du film et les coûts — les calculs sont sauvegardés par utilisateur avec nom et note.",
        'f12_points': [
            "Calculateur Anilox : 5 modes — Volume, Consommation d'encre, Épaisseur de film, Inverse, Comparaison",
            'Unités au choix : métrique (cm³/m²) ou US (BCM)',
            'Les 6 géométries de cellules : Hexagonale, Tri-hélicoïdale, Rectangulaire, Diamant, Canal, Moletage',
            "Gestion des encres : fournisseur, type, densité et coût (€/kg)",
            "Calcul des coûts : €/heure, €/1 000 ml, €/10 000 ml",
            "Sauvegarde des calculs avec nom, note et historique",
            "Module complémentaire optionnel — activable par l'administrateur",
        ],
        't7': "Dans le module Flexo : enregistrez vos encres une fois avec densité et prix — le calculateur Anilox remplit automatiquement la densité et calcule les coûts par heure et par mètre linéaire.",
        'nav_b': 'Barre latérale → Flexo → Configuration guidée / Calculateur Anilox',
    },
    'es': {
        'f12_title': 'Módulos de Flexografía',
        'f12_desc': 'Herramientas especializadas para profesionales de la flexografía. La calculadora Anilox calcula el volumen de celda, consumo de tinta, espesor de película y costes — los cálculos se guardan por usuario con nombre y nota.',
        'f12_points': [
            'Calculadora Anilox: 5 modos — Volumen, Consumo de tinta, Espesor de película, Inverso, Comparación',
            'Elegir unidades: métrico (cm³/m²) o US (BCM)',
            'Las 6 geometrías de celda: Hexagonal, Tri-helicoidal, Cuadrangular, Diamante, Canal, Moleteado',
            'Gestión de tintas: proveedor, tipo, densidad y coste (€/kg)',
            'Cálculo de costes: €/hora, €/1.000 ml, €/10.000 ml',
            'Guardar cálculos con nombre, nota e historial',
            'Módulo adicional opcional — activable por el administrador',
        ],
        't7': 'En el módulo Flexo: registra tus tintas una vez con densidad y precio — la calculadora Anilox rellena la densidad automáticamente y calcula los costes por hora y por metro lineal.',
        'nav_b': 'Barra lateral → Flexo → Configuración guiada / Calculadora Anilox',
    },
    'it': {
        'f12_title': 'Moduli Flessografia',
        'f12_desc': "Strumenti specializzati per i professionisti della flessografia. Il calcolatore Anilox calcola il volume della cella, il consumo di inchiostro, lo spessore del film e i costi — i calcoli vengono salvati per utente con nome e nota.",
        'f12_points': [
            'Calcolatore Anilox: 5 modalità — Volume, Consumo inchiostro, Spessore film, Inverso, Confronto',
            'Scegliere le unità: metrico (cm³/m²) o US (BCM)',
            "Tutte le 6 geometrie di cella: Esagonale, Tri-elicoidale, Quadrangolare, Diamante, Canale, Zigrinatura",
            "Gestione inchiostri: fornitore, tipo, densità e costo (€/kg)",
            "Calcolo costi: €/ora, €/1.000 ml, €/10.000 ml",
            "Salvataggio calcoli con nome, nota e storico",
            "Modulo aggiuntivo opzionale — attivabile dall'amministratore",
        ],
        't7': "Nel modulo Flexo: registra i tuoi inchiostri una volta con densità e prezzo — il calcolatore Anilox inserisce automaticamente la densità e calcola i costi per ora e per metro lineare.",
        'nav_b': 'Barra laterale → Flexo → Configurazione guidata / Calcolatore Anilox',
    },
    'nl': {
        'f12_title': 'Flexodruk-modules',
        'f12_desc': 'Gespecialiseerde tools voor flexodruk-professionals. De Anilox-rekenmachine berekent celvolume, inktverbruik, filmdikte en kosten — berekeningen worden per gebruiker opgeslagen met naam en notitie.',
        'f12_points': [
            'Anilox-rekenmachine: 5 modi — Volume, Inktverbruik, Filmdikte, Omgekeerd, Vergelijking',
            'Eenheden kiezen: metrisch (cm³/m²) of US (BCM)',
            'Alle 6 celgeometrieën: Hexagonaal, Tri-helisch, Quadrangulair, Diamant, Kanaal, Knurl',
            'Inktbeheer: leverancier, type, dichtheid en kosten (€/kg)',
            'Kostenberekening: €/uur, €/1.000 lm, €/10.000 lm',
            'Berekeningen opslaan met naam, notitie en geschiedenis',
            'Optionele aanvullende module — activeerbaar door beheerder',
        ],
        't7': 'In de Flexo-module: sla uw inkten één keer op met dichtheid en prijs — de Anilox-rekenmachine vult de dichtheid automatisch in en berekent kosten per uur en per lopende meter.',
        'nav_b': 'Zijbalk → Flexo → Guided Setup / Anilox-rekenmachine',
    },
    'pl': {
        'f12_title': 'Moduły fleksograficzne',
        'f12_desc': 'Specjalistyczne narzędzia dla profesjonalistów fleksografii. Kalkulator Anilox oblicza objętość komórki, zużycie tuszu, grubość filmu i koszty — obliczenia są zapisywane na użytkownika z nazwą i notatką.',
        'f12_points': [
            'Kalkulator Anilox: 5 trybów — Objętość, Zużycie tuszu, Grubość filmu, Odwrotny, Porównanie',
            'Wybór jednostek: metryczne (cm³/m²) lub US (BCM)',
            'Wszystkie 6 geometrii komórek: Heksagonalna, Tri-helikalna, Prostokątna, Diament, Kanał, Radełkowanie',
            'Zarządzanie tuszami: dostawca, typ, gęstość i koszt (€/kg)',
            'Obliczanie kosztów: €/godz., €/1 000 mb, €/10 000 mb',
            'Zapisywanie obliczeń z nazwą, notatką i historią',
            'Opcjonalny moduł dodatkowy — aktywowany przez administratora',
        ],
        't7': 'W module Flexo: dodaj swoje tusze raz z gęstością i ceną — kalkulator Anilox automatycznie wstawi gęstość i obliczy koszty na godzinę i na metr bieżący.',
        'nav_b': 'Pasek boczny → Flexo → Guided Setup / Kalkulator Anilox',
    },
    'pt': {
        'f12_title': 'Módulos de Flexografia',
        'f12_desc': 'Ferramentas especializadas para profissionais de flexografia. A calculadora Anilox calcula o volume da célula, consumo de tinta, espessura do filme e custos — os cálculos são guardados por utilizador com nome e nota.',
        'f12_points': [
            'Calculadora Anilox: 5 modos — Volume, Consumo de tinta, Espessura de filme, Inverso, Comparação',
            'Escolher unidades: métrico (cm³/m²) ou US (BCM)',
            'Todas as 6 geometrias de célula: Hexagonal, Tri-helicoidal, Quadrangular, Diamante, Canal, Moleta',
            'Gestão de tintas: fornecedor, tipo, densidade e custo (€/kg)',
            'Cálculo de custos: €/hora, €/1.000 ml, €/10.000 ml',
            'Guardar cálculos com nome, nota e histórico',
            'Módulo adicional opcional — ativável pelo administrador',
        ],
        't7': 'No módulo Flexo: registe as suas tintas uma vez com densidade e preço — a calculadora Anilox preenche automaticamente a densidade e calcula os custos por hora e por metro linear.',
        'nav_b': 'Barra lateral → Flexo → Configuração guiada / Calculadora Anilox',
    },
    'cs': {
        'f12_title': 'Moduly pro flexotisk',
        'f12_desc': 'Specializované nástroje pro profesionály flexotisku. Kalkulačka Anilox vypočítává objem buňky, spotřebu barvy, tloušťku filmu a náklady — výpočty se ukládají na uživatele se jménem a poznámkou.',
        'f12_points': [
            'Kalkulačka Anilox: 5 režimů — Objem, Spotřeba barvy, Tloušťka filmu, Zpětný, Porovnání',
            'Výběr jednotek: metrické (cm³/m²) nebo US (BCM)',
            'Všech 6 geometrií buněk: Šestihranná, Tri-helikální, Pravoúhlá, Diamant, Kanál, Knurl',
            'Správa barev: dodavatel, typ, hustota a náklady (€/kg)',
            'Výpočet nákladů: €/hod., €/1 000 mb, €/10 000 mb',
            'Uložení výpočtů se jménem, poznámkou a historií',
            'Volitelný doplňkový modul — aktivovatelný správcem',
        ],
        't7': 'V modulu Flexo: zadejte barvy jednou s hustotou a cenou — kalkulačka Anilox automaticky vyplní hustotu a vypočítá náklady na hodinu a na lineární metr.',
        'nav_b': 'Postranní panel → Flexo → Guided Setup / Kalkulačka Anilox',
    },
    'sk': {
        'f12_title': 'Moduly pre flexotlač',
        'f12_desc': 'Špecializované nástroje pre profesionálov flexotlače. Kalkulačka Anilox vypočítava objem bunky, spotrebu farby, hrúbku filmu a náklady — výpočty sa ukladajú na používateľa s názvom a poznámkou.',
        'f12_points': [
            'Kalkulačka Anilox: 5 režimov — Objem, Spotreba farby, Hrúbka filmu, Spätný, Porovnanie',
            'Výber jednotiek: metrické (cm³/m²) alebo US (BCM)',
            'Všetkých 6 geometrií buniek: Šesťuholníková, Tri-helikálna, Obdĺžniková, Diamant, Kanál, Knurl',
            'Správa farieb: dodávateľ, typ, hustota a náklady (€/kg)',
            'Výpočet nákladov: €/hod., €/1 000 mb, €/10 000 mb',
            'Uloženie výpočtov s názvom, poznámkou a históriou',
            'Voliteľný doplnkový modul — aktivovateľný správcom',
        ],
        't7': 'V module Flexo: zadajte farby raz s hustotou a cenou — kalkulačka Anilox automaticky vyplní hustotu a vypočíta náklady na hodinu a na lineárny meter.',
        'nav_b': 'Bočný panel → Flexo → Guided Setup / Kalkulačka Anilox',
    },
    'hu': {
        'f12_title': 'Flexonyomtatás-modulok',
        'f12_desc': 'Speciális eszközök flexonyomtatási szakembereknek. Az Anilox-kalkulátor kiszámítja a cellatérfogatot, festékfelhasználást, filmvastagságot és a költségeket — a számítások névvel és megjegyzéssel tárolhatók felhasználónként.',
        'f12_points': [
            'Anilox-kalkulátor: 5 mód — Térfogat, Festékfelhasználás, Filmvastagság, Fordított, Összehasonlítás',
            'Mértékegységek: metrikus (cm³/m²) vagy US (BCM)',
            'Mind a 6 cellageometria: Hatszögű, Tri-helikális, Négyszögletes, Gyémánt, Csatorna, Knurl',
            'Festékkezelés: szállító, típus, sűrűség és költség (€/kg)',
            'Költségszámítás: €/óra, €/1 000 fm, €/10 000 fm',
            'Számítások mentése névvel, megjegyzéssel és előzményekkel',
            'Opcionális kiegészítő modul — adminisztrátor aktiválhatja',
        ],
        't7': 'A Flexo modulban: rögzítse festékeit egyszer sűrűséggel és árral — az Anilox-kalkulátor automatikusan kitölti a sűrűséget, és kiszámítja az óránkénti és folyóméterenkénti költségeket.',
        'nav_b': 'Oldalsáv → Flexo → Guided Setup / Anilox-kalkulátor',
    },
    'ro': {
        'f12_title': 'Module flexografie',
        'f12_desc': 'Instrumente specializate pentru profesioniști în flexografie. Calculatorul Anilox calculează volumul celulei, consumul de cerneală, grosimea filmului și costurile — calculele sunt salvate per utilizator cu nume și notă.',
        'f12_points': [
            'Calculator Anilox: 5 moduri — Volum, Consum cerneală, Grosime film, Invers, Comparație',
            'Alegere unități: metric (cm³/m²) sau US (BCM)',
            'Toate cele 6 geometrii de celule: Hexagonal, Tri-elicoidal, Dreptunghiular, Diamant, Canal, Knurl',
            'Gestionare cerneluri: furnizor, tip, densitate și cost (€/kg)',
            'Calculul costurilor: €/oră, €/1.000 ml, €/10.000 ml',
            'Salvarea calculelor cu nume, notă și istoric',
            'Modul suplimentar opțional — activat de administrator',
        ],
        't7': 'În modulul Flexo: înregistrați cerneliurile o dată cu densitate și preț — calculatorul Anilox completează automat densitatea și calculează costurile pe oră și pe metru liniar.',
        'nav_b': 'Bara laterală → Flexo → Guided Setup / Calculator Anilox',
    },
    'bg': {
        'f12_title': 'Модули за флексопечат',
        'f12_desc': 'Специализирани инструменти за специалисти по флексопечат. Калкулаторът Анилокс изчислява обема на клетката, консумацията на мастило, дебелината на филма и разходите — изчисленията се запазват за потребител с име и бележка.',
        'f12_points': [
            'Калкулатор Анилокс: 5 режима — Обем, Консумация на мастило, Дебелина на филм, Обратен, Сравнение',
            'Избор на единици: метрични (cm³/m²) или US (BCM)',
            'Всички 6 геометрии на клетките: Шестоъгълна, Три-хеликална, Правоъгълна, Диамант, Канал, Нарязване',
            'Управление на мастила: доставчик, тип, плътност и разходи (€/кг)',
            'Изчисляване на разходи: €/час, €/1 000 пм, €/10 000 пм',
            'Запазване на изчисления с име, бележка и история',
            'Незадължителен допълнителен модул — активира се от администратора',
        ],
        't7': 'В модула Flexo: въведете мастилата си веднъж с плътност и цена — калкулаторът Анилокс автоматично попълва плътността и изчислява разходите на час и на линеен метър.',
        'nav_b': 'Странична лента → Flexo → Guided Setup / Калкулатор Анилокс',
    },
    'ru': {
        'f12_title': 'Модули флексографии',
        'f12_desc': 'Специализированные инструменты для профессионалов флексографии. Калькулятор Анилокс рассчитывает объём ячейки, расход краски, толщину плёнки и затраты — расчёты сохраняются по пользователям с именем и заметкой.',
        'f12_points': [
            'Калькулятор Анилокс: 5 режимов — Объём, Расход краски, Толщина плёнки, Обратный, Сравнение',
            'Выбор единиц: метрические (см³/м²) или US (BCM)',
            'Все 6 геометрий ячеек: Шестиугольная, Три-геликальная, Прямоугольная, Ромбовидная, Канальная, Накатка',
            'Управление красками: поставщик, тип, плотность и стоимость (€/кг)',
            'Расчёт затрат: €/час, €/1 000 пм, €/10 000 пм',
            'Сохранение расчётов с именем, заметкой и историей',
            'Дополнительный опциональный модуль — активируется администратором',
        ],
        't7': 'В модуле Flexo: добавьте краски один раз с плотностью и ценой — калькулятор Анилокс автоматически заполнит плотность и рассчитает затраты в час и на погонный метр.',
        'nav_b': 'Боковая панель → Flexo → Guided Setup / Калькулятор Анилокс',
    },
    'uk': {
        'f12_title': 'Модулі флексодруку',
        'f12_desc': "Спеціалізовані інструменти для фахівців флексографії. Калькулятор Анілокс розраховує об'єм комірки, витрату фарби, товщину плівки та витрати — розрахунки зберігаються для кожного користувача з ім'ям та нотаткою.",
        'f12_points': [
            "Калькулятор Анілокс: 5 режимів — Об'єм, Витрата фарби, Товщина плівки, Зворотний, Порівняння",
            'Вибір одиниць: метричні (см³/м²) або US (BCM)',
            'Всі 6 геометрій комірок: Шестикутна, Три-хелікальна, Прямокутна, Ромб, Канал, Накатка',
            'Управління фарбами: постачальник, тип, щільність та вартість (€/кг)',
            'Розрахунок витрат: €/год, €/1 000 пм, €/10 000 пм',
            'Збереження розрахунків з іменем, нотаткою та історією',
            'Додатковий опціональний модуль — активується адміністратором',
        ],
        't7': 'У модулі Flexo: введіть свої фарби один раз із щільністю та ціною — калькулятор Анілокс автоматично заповнить щільність і розрахує витрати за годину та за погонний метр.',
        'nav_b': 'Бічна панель → Flexo → Guided Setup / Калькулятор Анілокс',
    },
    'tr': {
        'f12_title': 'Fleksografi Modülleri',
        'f12_desc': 'Fleksografi profesyonelleri için özel araçlar. Anilox Hesaplayıcı hücre hacmini, mürekkep tüketimini, film kalınlığını ve maliyetleri hesaplar — hesaplamalar kullanıcı başına ad ve notla kaydedilir.',
        'f12_points': [
            'Anilox Hesaplayıcı: 5 mod — Hacim, Mürekkep Tüketimi, Film Kalınlığı, Ters, Karşılaştırma',
            'Birim seçimi: metrik (cm³/m²) veya US (BCM)',
            'Tüm 6 hücre geometrisi: Altıgen, Tri-helikal, Dörtgen, Elmas, Kanal, Knurl',
            'Mürekkep yönetimi: tedarikçi, tür, yoğunluk ve maliyet (€/kg)',
            'Maliyet hesaplama: €/saat, €/1.000 lm, €/10.000 lm',
            'Hesaplamaları ad, not ve geçmişle kaydetme',
            'İsteğe bağlı ek modül — yönetici tarafından etkinleştirilebilir',
        ],
        't7': 'Flexo modülünde: renklerinizi bir kez yoğunluk ve fiyatla kaydedin — Anilox Hesaplayıcı yoğunluğu otomatik olarak doldurur ve saat başı ve metre başı maliyetleri hesaplar.',
        'nav_b': 'Kenar çubuğu → Flexo → Guided Setup / Anilox Hesaplayıcı',
    },
    'da': {
        'f12_title': 'Flexotryk-moduler',
        'f12_desc': 'Specialiserede værktøjer til flexotryk-professionelle. Anilox-beregneren beregner cellevolumen, blækforbrug, filmtykkelse og omkostninger — beregninger gemmes pr. bruger med navn og bemærkning.',
        'f12_points': [
            'Anilox-beregner: 5 tilstande — Volumen, Blækforbrug, Filmtykkelse, Omvendt, Sammenligning',
            'Vælg enheder: metrisk (cm³/m²) eller US (BCM)',
            'Alle 6 cellegeometrier: Hexagonal, Tri-helikal, Rektangulær, Diamant, Kanal, Knurl',
            'Blækstyring: leverandør, type, densitet og omkostninger (€/kg)',
            'Omkostningsberegning: €/time, €/1.000 lm, €/10.000 lm',
            'Gem beregninger med navn, bemærkning og historik',
            'Valgfrit tillægsmodul — kan aktiveres af administrator',
        ],
        't7': 'I Flexo-modulet: registrer dine blæktyper én gang med densitet og pris — Anilox-beregneren udfylder automatisk densiteten og beregner omkostninger pr. time og pr. løbende meter.',
        'nav_b': 'Sidebjælke → Flexo → Guided Setup / Anilox-beregner',
    },
    'sv': {
        'f12_title': 'Flexotryck-moduler',
        'f12_desc': 'Specialiserade verktyg för flexotrycksproffs. Anilox-räknaren beräknar cellvolym, bläckförbrukning, filmtjocklek och kostnader — beräkningar sparas per användare med namn och anteckning.',
        'f12_points': [
            'Anilox-räknare: 5 lägen — Volym, Bläckförbrukning, Filmtjocklek, Omvänd, Jämförelse',
            'Välj enheter: metrisk (cm³/m²) eller US (BCM)',
            'Alla 6 cellgeometrier: Hexagonal, Tri-helikal, Rektangulär, Diamant, Kanal, Knurl',
            'Bläckhantering: leverantör, typ, densitet och kostnad (€/kg)',
            'Kostnadsberäkning: €/timme, €/1 000 lm, €/10 000 lm',
            'Spara beräkningar med namn, anteckning och historik',
            'Valfri tilläggsmodul — kan aktiveras av administratör',
        ],
        't7': 'I Flexo-modulen: registrera dina bläck en gång med densitet och pris — Anilox-räknaren fyller i densiteten automatiskt och beräknar kostnader per timme och per löpande meter.',
        'nav_b': 'Sidofält → Flexo → Guided Setup / Anilox-räknare',
    },
    'no': {
        'f12_title': 'Flexotrykk-moduler',
        'f12_desc': 'Spesialiserte verktøy for flexotrykk-fagfolk. Anilox-kalkulatoren beregner cellevolum, blekkforbruk, filmtykkelse og kostnader — beregninger lagres per bruker med navn og merknad.',
        'f12_points': [
            'Anilox-kalkulator: 5 moduser — Volum, Blekkforbruk, Filmtykkelse, Omvendt, Sammenligning',
            'Velg enheter: metrisk (cm³/m²) eller US (BCM)',
            'Alle 6 cellegeometrier: Heksagonal, Tri-helikal, Rektangulær, Diamant, Kanal, Knurl',
            'Blekkbehandling: leverandør, type, tetthet og kostnad (€/kg)',
            'Kostnadsberegning: €/time, €/1 000 lm, €/10 000 lm',
            'Lagre beregninger med navn, merknad og historikk',
            'Valgfri tilleggsmodul — kan aktiveres av administrator',
        ],
        't7': 'I Flexo-modulen: registrer blekkene dine én gang med tetthet og pris — Anilox-kalkulatoren fyller inn tettheten automatisk og beregner kostnader per time og per løpende meter.',
        'nav_b': 'Sidefelt → Flexo → Guided Setup / Anilox-kalkulator',
    },
    'fi': {
        'f12_title': 'Fleksopainatus-moduulit',
        'f12_desc': 'Erikoistuneet työkalut fleksopainatus-ammattilaisille. Anilox-laskin laskee solun tilavuuden, musteen kulutuksen, kalvon paksuuden ja kustannukset — laskelmat tallennetaan käyttäjäkohtaisesti nimellä ja muistiinpanolla.',
        'f12_points': [
            'Anilox-laskin: 5 tilaa — Tilavuus, Musteen kulutus, Kalvon paksuus, Käänteinen, Vertailu',
            'Valitse yksiköt: metrinen (cm³/m²) tai US (BCM)',
            'Kaikki 6 solugeometriaa: Kuusikulmainen, Tri-helikaalinen, Suorakulmainen, Timantti, Kanava, Knurl',
            'Musteen hallinta: toimittaja, tyyppi, tiheys ja kustannus (€/kg)',
            'Kustannuslaskenta: €/tunti, €/1 000 jm, €/10 000 jm',
            'Tallenna laskelmat nimellä, muistiinpanolla ja historialla',
            'Valinnainen lisämoduuli — järjestelmänvalvoja voi aktivoida',
        ],
        't7': 'Flexo-moduulissa: rekisteröi musteesi kerran tiheydellä ja hinnalla — Anilox-laskin täyttää tiheyden automaattisesti ja laskee kustannukset tunnissa ja juoksumetrissä.',
        'nav_b': 'Sivupalkki → Flexo → Guided Setup / Anilox-laskin',
    },
    'et': {
        'f12_title': 'Fleksotorke moodulid',
        'f12_desc': 'Spetsialiseeritud tööriistad fleksotorke professionaalidele. Aniloxi kalkulaator arvutab raku mahu, tindi tarbimise, kile paksuse ja kulud — arvutused salvestatakse kasutaja kohta nime ja märkusega.',
        'f12_points': [
            'Aniloxi kalkulaator: 5 režiimi — Maht, Tindi tarbimine, Kile paksus, Pöördväärtus, Võrdlus',
            'Ühikute valimine: meetriline (cm³/m²) või US (BCM)',
            'Kõik 6 raku geomeetriat: Kuusnurkne, Tri-helikaalne, Ristkülikukujuline, Teemant, Kanal, Knurl',
            'Tindihaldus: tarnija, tüüp, tihedus ja maksumus (€/kg)',
            'Kulutuste arvutamine: €/tund, €/1 000 jm, €/10 000 jm',
            'Arvutuste salvestamine nime, märkuse ja ajalooga',
            'Valikuline lisandmoodul — administraator saab aktiveerida',
        ],
        't7': 'Flexo moodulis: registreerige oma tindid kord tiheduse ja hinnaga — Aniloxi kalkulaator täidab tiheduse automaatselt ja arvutab kulud tunnis ja jooksumetris.',
        'nav_b': 'Külgriba → Flexo → Guided Setup / Aniloxi kalkulaator',
    },
    'lt': {
        'f12_title': 'Fleksospaudos moduliai',
        'f12_desc': '„Anilox" skaičiuotuvas apskaičiuoja ląstelės tūrį, dažų suvartojimą, plėvelės storį ir išlaidas — skaičiavimai saugomi kiekvienam vartotojui su pavadinimu ir pastaba.',
        'f12_points': [
            'Anilox skaičiuotuvas: 5 režimai — Tūris, Dažų suvartojimas, Plėvelės storis, Atvirkštinis, Palyginimas',
            'Vienetų pasirinkimas: metriniai (cm³/m²) arba US (BCM)',
            'Visos 6 ląstelių geometrijos: Šešiakampė, Tri-helikinė, Stačiakampė, Deimantas, Kanalas, Knurl',
            'Dažų valdymas: tiekėjas, tipas, tankis ir kaina (€/kg)',
            'Išlaidų skaičiavimas: €/val., €/1 000 mb, €/10 000 mb',
            'Skaičiavimų išsaugojimas su pavadinimu, pastaba ir istorija',
            'Neprivalomas papildomas modulis — administratorius gali suaktyvinti',
        ],
        't7': 'Flexo modulyje: įveskite savo dažus vieną kartą su tankiu ir kaina — Anilox skaičiuotuvas automatiškai užpildo tankį ir apskaičiuoja išlaidas per valandą ir vienam linijiniam metrui.',
        'nav_b': 'Šoninė juosta → Flexo → Guided Setup / Anilox skaičiuotuvas',
    },
    'lv': {
        'f12_title': 'Fleksodrukas moduļi',
        'f12_desc': 'Specializēti rīki fleksodrukas profesionāļiem. Anilox kalkulators aprēķina šūnas tilpumu, tintes patēriņu, plēves biezumu un izmaksas — aprēķini tiek saglabāti katram lietotājam ar nosaukumu un piezīmi.',
        'f12_points': [
            'Anilox kalkulators: 5 režīmi — Tilpums, Tintes patēriņš, Plēves biezums, Apgrieztais, Salīdzinājums',
            'Vienību izvēle: metriskās (cm³/m²) vai US (BCM)',
            'Visas 6 šūnu ģeometrijas: Sešstūrainā, Tri-helikālā, Taisnstūra, Dimanta, Kanāla, Knurl',
            'Tintes pārvaldība: piegādātājs, tips, blīvums un izmaksas (€/kg)',
            'Izmaksu aprēķins: €/stundā, €/1 000 l.m., €/10 000 l.m.',
            'Aprēķinu saglabāšana ar nosaukumu, piezīmi un vēsturi',
            'Izvēles papildu modulis — administrators var aktivizēt',
        ],
        't7': 'Flexo modulī: reģistrējiet savas tintes vienu reizi ar blīvumu un cenu — Anilox kalkulators automātiski aizpildīs blīvumu un aprēķinās izmaksas stundā un lineārajā metrā.',
        'nav_b': 'Sānu josla → Flexo → Guided Setup / Anilox kalkulators',
    },
    'hr': {
        'f12_title': 'Moduli za fleksografski tisak',
        'f12_desc': 'Specijalizirani alati za profesionalce fleksografskog tiska. Anilox kalkulator izračunava volumen ćelije, potrošnju tinte, debljinu filma i troškove — izračuni se spremaju po korisniku s imenom i napomenom.',
        'f12_points': [
            'Anilox kalkulator: 5 načina — Volumen, Potrošnja tinte, Debljina filma, Obrnuto, Usporedba',
            'Izbor jedinica: metrički (cm³/m²) ili US (BCM)',
            'Svih 6 geometrija ćelija: Šesterokutna, Tri-helikalna, Pravokutna, Dijamant, Kanal, Knurl',
            'Upravljanje tintama: dobavljač, vrsta, gustoća i trošak (€/kg)',
            'Izračun troškova: €/sat, €/1.000 tm, €/10.000 tm',
            'Spremanje izračuna s imenom, napomenom i poviješću',
            'Neobavezni dodatni modul — može aktivirati administrator',
        ],
        't7': 'U Flexo modulu: unesite tinte jednom s gustoćom i cijenom — Anilox kalkulator automatski popunjava gustoću i izračunava troškove po satu i po tekućem metru.',
        'nav_b': 'Bočna traka → Flexo → Guided Setup / Anilox kalkulator',
    },
    'sr': {
        'f12_title': 'Модули за флексографски штамп',
        'f12_badge': 'Flexo',
        'f12_desc': 'Специјализовани алати за стручњаке флексографског штампања. Анилокс калкулатор израчунава запремину ћелије, потрошњу боје, дебљину филма и трошкове — прорачуни се чувају по кориснику са именом и напоменом.',
        'f12_points': [
            'Анилокс калкулатор: 5 режима — Запремина, Потрошња боје, Дебљина филма, Обрнуто, Поређење',
            'Избор јединица: метричке (cm³/m²) или US (BCM)',
            'Свих 6 геометрија ћелија: Шестоугаона, Три-хеликална, Правоугаона, Дијамант, Канал, Knurl',
            'Управљање бојама: добављач, тип, густина и трошак (€/kg)',
            'Израчун трошкова: €/сат, €/1.000 тм, €/10.000 тм',
            'Чување прорачуна са именом, напоменом и историјом',
            'Необавезни додатни модул — може активирати администратор',
        ],
        't7': 'У Flexo модулу: унесите бојеједном са густином и ценом — Анилокс калкулатор аутоматски попуњава густину и израчунава трошкове по сату и по текућем метру.',
        'nav_b': 'Бочна трака → Flexo → Guided Setup / Анилокс калкулатор',
    },
    'el': {
        'f12_title': 'Μονάδες φλεξογραφίας',
        'f12_desc': 'Εξειδικευμένα εργαλεία για επαγγελματίες φλεξογραφίας. Η αριθμομηχανή Anilox υπολογίζει τον όγκο κελιού, κατανάλωση μελάνης, πάχος μεμβράνης και κόστος — οι υπολογισμοί αποθηκεύονται ανά χρήστη με όνομα και σημείωση.',
        'f12_points': [
            'Αριθμομηχανή Anilox: 5 τρόποι — Όγκος, Κατανάλωση μελάνης, Πάχος μεμβράνης, Αντίστροφο, Σύγκριση',
            'Επιλογή μονάδων: μετρικές (cm³/m²) ή US (BCM)',
            'Και οι 6 γεωμετρίες κελιών: Εξαγωνική, Τριπλή ελικοειδής, Τετραγωνική, Διαμάντι, Κανάλι, Knurl',
            'Διαχείριση μελανών: προμηθευτής, τύπος, πυκνότητα και κόστος (€/kg)',
            'Υπολογισμός κόστους: €/ώρα, €/1.000 τμ, €/10.000 τμ',
            'Αποθήκευση υπολογισμών με όνομα, σημείωση και ιστορικό',
            'Προαιρετική πρόσθετη λειτουργική μονάδα — ενεργοποιείται από τον διαχειριστή',
        ],
        't7': 'Στη μονάδα Flexo: καταχωρήστε τα μελάνια σας μία φορά με πυκνότητα και τιμή — η αριθμομηχανή Anilox συμπληρώνει αυτόματα την πυκνότητα και υπολογίζει το κόστος ανά ώρα και ανά τρέχον μέτρο.',
        'nav_b': 'Πλαϊνή γραμμή → Flexo → Guided Setup / Αριθμομηχανή Anilox',
    },
    'ja': {
        'f12_title': 'フレキソ印刷モジュール',
        'f12_desc': 'フレキソ印刷のプロ向け専門ツール。アニロックス計算機はセル容積、インク消費量、フィルム厚、コストを計算し、計算結果は名前とメモとともにユーザーごとに保存されます。',
        'f12_points': [
            'アニロックス計算機: 5モード — 容積、インク消費量、フィルム厚、逆算、比較',
            '単位選択: メトリック (cm³/m²) またはUS (BCM)',
            '全6種類のセル形状: 六角形、トライヘリカル、四角形、ダイヤモンド、チャンネル、ナール',
            'インク管理: サプライヤー、種類、密度、コスト (€/kg) を登録',
            'コスト計算: €/時間、€/1,000 lm、€/10,000 lm',
            '計算結果を名前、メモ、履歴とともに保存',
            'オプションの追加モジュール — 管理者が有効化可能',
        ],
        't7': 'Flexoモジュールで: 密度と価格を指定してインクを一度登録するだけ — アニロックス計算機が密度を自動入力し、1時間あたりおよびメートルあたりのコストを計算します。',
        'nav_b': 'サイドバー → Flexo → Guided Setup / アニロックス計算機',
    },
    'zh': {
        'f12_title': '柔版印刷模块',
        'f12_desc': '专为柔版印刷专业人员打造的工具。网纹辊计算器计算网穴容积、油墨消耗量、墨膜厚度和成本 — 计算结果按用户保存，附有名称和备注。',
        'f12_points': [
            '网纹辊计算器：5种模式 — 容积、油墨消耗、墨膜厚度、逆算、对比',
            '单位选择：公制 (cm³/m²) 或美制 (BCM)',
            '全部6种网穴几何形状：六边形、三螺旋、正方形、菱形、沟槽、压花',
            '油墨管理：供应商、类型、密度和成本 (€/kg)',
            '成本计算：€/小时、€/1,000 lm、€/10,000 lm',
            '保存计算结果，附带名称、备注和历史记录',
            '可选附加模块 — 由管理员激活',
        ],
        't7': '在Flexo模块中：一次性录入油墨的密度和价格 — 网纹辊计算器会自动填入密度，并计算每小时和每线性米的成本。',
        'nav_b': '侧边栏 → Flexo → 引导设置 / 网纹辊计算器',
    },
}

def update_file(lang):
    path = os.path.join(MESSAGES_DIR, f'{lang}.json')
    if not os.path.exists(path):
        print(f'  SKIP {lang} (not found)')
        return

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    t = TRANSLATIONS.get(lang, TRANSLATIONS['en'])
    docs = data.get('docs', {})

    # 1. hero.s2val → "12+"
    if 'hero' in docs:
        docs['hero']['s2val'] = '12+'

    # 2. feat.f12
    feat = docs.get('feat', {})
    feat['f12'] = {
        'title': t['f12_title'],
        'badge': 'Flexo',
        'desc':  t['f12_desc'],
        'points': t['f12_points'],
    }
    docs['feat'] = feat

    # 3. tips.t7
    tips = docs.get('tips', {})
    tips['t7'] = t['t7']

    # 4. tips.nav – add Flexodruck entry if not already there
    nav = tips.get('nav', [])
    if not any(item.get('a') == 'Flexodruck' for item in nav):
        nav.append({'a': 'Flexodruck', 'b': t['nav_b']})
    tips['nav'] = nav
    docs['tips'] = tips

    data['docs'] = docs

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  \u2713 {lang}')

if __name__ == '__main__':
    langs = [f[:-5] for f in os.listdir(MESSAGES_DIR) if f.endswith('.json')]
    langs.sort()
    print(f'Updating {len(langs)} language files...')
    for lang in langs:
        update_file(lang)
    print('Done.')
