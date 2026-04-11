"""
Updates docs section in all 28 message files.
All translations embedded — no API call needed.
Run: python scripts/update_docs_translations.py
"""
import json
from pathlib import Path

MSG_DIR = Path(__file__).parent.parent / "messages"

# ── All translations ──────────────────────────────────────────────────────────
# Keys: lang code → dict of content values
TRANSLATIONS = {
"de": {
  "hero_s2label": "Feature-Bereiche",
  "qs_s5title": "INOai fragen",
  "qs_s5desc": "Öffne INOai in der Navigation. Stelle Produktfragen zu INOMETA-Walzen, Rakelklingen und Sleeves — jede Antwort nennt ihre Quellen.",
  "feat_f11_badge": "KI",
  "feat_f11_desc": "Dein KI-Assistent für INOMETA-Produkte, Walzentechnologie und Flexodruck. Basiert auf echten Inhalten aus Webseiten, Datenblättern und hochgeladenen Dokumenten — antwortet sofort, speichert jedes Gespräch.",
  "feat_f11_points": [
    "Fragen zu Rasterwalzen, Rakelklingen, Sleeves und Flexodruck sofort beantwortet",
    "Antworten auf Basis gecrawlter Webseiten, PDFs und manuell hochgeladener Dokumente",
    "Strukturierte Ausgabe: Tabellen, Fettschrift, Codeblöcke und Listen (Markdown)",
    "Quellen für jede Antwort angegeben — Website, Datenblatt oder Dokument",
    "Vollständiger Gesprächsverlauf: jeder Chat wird automatisch gespeichert",
    "Frühere Gespräche mit einem Tipp laden und fortsetzen",
    "Antwortet in der Sprache, in der du schreibst — vollständig mehrsprachig",
    "Optionales Zusatzmodul — durch Admin aktivierbar",
  ],
  "tips_t6": "INOid ist vollständig für Smartphones optimiert: Alle Mehrspaltenlayouts wechseln auf Mobile zu einer Spalte, der INOai-Chat füllt den sichtbaren Bereich exakt aus, und lange Fachbegriffe werden immer korrekt umgebrochen.",
  "tips_nav_inoai_b": "Seitenleiste / Bottom-Nav → INOai (✦)",
},
"en": {
  "hero_s2label": "feature areas",
  "qs_s5title": "Ask INOai",
  "qs_s5desc": "Open INOai in the navigation. Ask product questions about INOMETA rolls, doctor blades, and sleeves — every answer cites its sources.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Your AI assistant for INOMETA products, roll technology and flexographic printing. Based on real content from websites, datasheets and uploaded documents — answers immediately, saves every conversation.",
  "feat_f11_points": [
    "Questions about anilox rolls, doctor blades, sleeves and flexographic printing answered instantly",
    "Answers based on crawled websites, PDFs and manually uploaded documents",
    "Structured output: tables, bold text, code blocks and ordered lists (Markdown)",
    "Sources cited for every answer — website, datasheet or document",
    "Complete conversation history: every chat is automatically saved",
    "Load and continue previous conversations with one tap",
    "Answers in the language you write in — fully multilingual",
    "Optional add-on module — can be activated by the admin",
  ],
  "tips_t6": "INOid is fully optimized for smartphones: all multi-column layouts collapse to a single column on mobile, the INOai chat fills the visible screen area exactly, and long technical terms always wrap correctly.",
  "tips_nav_inoai_b": "Sidebar / Bottom Nav → INOai (✦)",
},
"fr": {
  "hero_s2label": "domaines fonctionnels",
  "qs_s5title": "Interroger INOai",
  "qs_s5desc": "Ouvrez INOai dans la navigation. Posez des questions sur les rouleaux, raclettes et manchons INOMETA — chaque réponse cite ses sources.",
  "feat_f11_badge": "IA",
  "feat_f11_desc": "Votre assistant IA pour les produits INOMETA, la technologie des rouleaux et l'impression flexographique. Basé sur le contenu réel de sites web, fiches techniques et documents importés — répond immédiatement, sauvegarde chaque conversation.",
  "feat_f11_points": [
    "Questions sur les rouleaux tramés, raclettes, manchons et impression flexo répondues instantanément",
    "Réponses basées sur des sites web crawlés, des PDFs et des documents importés manuellement",
    "Sortie structurée : tableaux, gras, blocs de code et listes ordonnées (Markdown)",
    "Sources citées pour chaque réponse — site web, fiche technique ou document",
    "Historique complet des conversations : chaque chat est automatiquement sauvegardé",
    "Charger et reprendre les conversations précédentes en un tap",
    "Répond dans la langue dans laquelle vous écrivez — entièrement multilingue",
    "Module complémentaire optionnel — activable par l'administrateur",
  ],
  "tips_t6": "INOid est entièrement optimisé pour les smartphones : toutes les mises en page multi-colonnes se replient en une seule colonne sur mobile, le chat INOai remplit exactement la zone d'écran visible, et les termes techniques longs sont toujours correctement coupés.",
  "tips_nav_inoai_b": "Barre latérale / Nav bas → INOai (✦)",
},
"es": {
  "hero_s2label": "áreas de funciones",
  "qs_s5title": "Preguntar a INOai",
  "qs_s5desc": "Abre INOai en la navegación. Haz preguntas sobre rodillos INOMETA, cuchillas rasquetas y manguitos — cada respuesta cita sus fuentes.",
  "feat_f11_badge": "IA",
  "feat_f11_desc": "Tu asistente de IA para productos INOMETA, tecnología de rodillos e impresión flexográfica. Basado en contenido real de sitios web, fichas técnicas y documentos subidos — responde de inmediato, guarda cada conversación.",
  "feat_f11_points": [
    "Preguntas sobre rodillos anilox, cuchillas rasquetas, manguitos e impresión flexo respondidas al instante",
    "Respuestas basadas en sitios web rastreados, PDFs y documentos subidos manualmente",
    "Salida estructurada: tablas, negrita, bloques de código y listas ordenadas (Markdown)",
    "Fuentes citadas para cada respuesta — sitio web, ficha técnica o documento",
    "Historial completo de conversaciones: cada chat se guarda automáticamente",
    "Cargar y continuar conversaciones anteriores con un toque",
    "Responde en el idioma en que escribes — completamente multilingüe",
    "Módulo adicional opcional — activable por el administrador",
  ],
  "tips_t6": "INOid está completamente optimizado para smartphones: todos los diseños de varias columnas se contraen a una sola columna en móvil, el chat INOai llena exactamente el área de pantalla visible y los términos técnicos largos siempre se ajustan correctamente.",
  "tips_nav_inoai_b": "Barra lateral / Nav inferior → INOai (✦)",
},
"it": {
  "hero_s2label": "aree funzionali",
  "qs_s5title": "Chiedi a INOai",
  "qs_s5desc": "Apri INOai nella navigazione. Fai domande sui prodotti INOMETA, rulli, lame raccogli-inchiostro e manicotti — ogni risposta cita le sue fonti.",
  "feat_f11_badge": "IA",
  "feat_f11_desc": "Il tuo assistente AI per prodotti INOMETA, tecnologia dei rulli e stampa flessografica. Basato su contenuti reali da siti web, schede tecniche e documenti caricati — risponde immediatamente, salva ogni conversazione.",
  "feat_f11_points": [
    "Domande su rulli anilox, lame raccogli-inchiostro, manicotti e stampa flessografica risposte all'istante",
    "Risposte basate su siti web scansionati, PDF e documenti caricati manualmente",
    "Output strutturato: tabelle, grassetto, blocchi di codice ed elenchi ordinati (Markdown)",
    "Fonti citate per ogni risposta — sito web, scheda tecnica o documento",
    "Cronologia completa delle conversazioni: ogni chat viene salvata automaticamente",
    "Carica e riprendi conversazioni precedenti con un tap",
    "Risponde nella lingua in cui scrivi — completamente multilingue",
    "Modulo aggiuntivo opzionale — attivabile dall'amministratore",
  ],
  "tips_t6": "INOid è completamente ottimizzato per smartphone: tutti i layout multi-colonna si riducono a una singola colonna su mobile, la chat INOai riempie esattamente l'area dello schermo visibile e i termini tecnici lunghi vengono sempre spezzati correttamente.",
  "tips_nav_inoai_b": "Barra laterale / Nav inferiore → INOai (✦)",
},
"pt": {
  "hero_s2label": "áreas de funcionalidade",
  "qs_s5title": "Perguntar ao INOai",
  "qs_s5desc": "Abra o INOai na navegação. Faça perguntas sobre produtos INOMETA, rolos, lâminas de tinteiro e mangas — cada resposta cita as suas fontes.",
  "feat_f11_badge": "IA",
  "feat_f11_desc": "O seu assistente de IA para produtos INOMETA, tecnologia de rolos e impressão flexográfica. Baseado em conteúdo real de sites, fichas técnicas e documentos enviados — responde imediatamente, guarda cada conversa.",
  "feat_f11_points": [
    "Perguntas sobre rolos anilox, lâminas de tinteiro, mangas e impressão flexográfica respondidas instantaneamente",
    "Respostas baseadas em sites rastreados, PDFs e documentos enviados manualmente",
    "Saída estruturada: tabelas, negrito, blocos de código e listas ordenadas (Markdown)",
    "Fontes citadas para cada resposta — site, ficha técnica ou documento",
    "Histórico completo de conversas: cada chat é guardado automaticamente",
    "Carregar e continuar conversas anteriores com um toque",
    "Responde no idioma em que escreve — totalmente multilingue",
    "Módulo adicional opcional — ativável pelo administrador",
  ],
  "tips_t6": "O INOid está totalmente otimizado para smartphones: todos os layouts de várias colunas colapsam para uma única coluna no mobile, o chat INOai preenche exatamente a área visível do ecrã e os termos técnicos longos são sempre quebrados corretamente.",
  "tips_nav_inoai_b": "Barra lateral / Nav inferior → INOai (✦)",
},
"nl": {
  "hero_s2label": "functiegebieden",
  "qs_s5title": "INOai vragen",
  "qs_s5desc": "Open INOai in de navigatie. Stel productvragen over INOMETA-rollen, rakelbladen en mouwen — elk antwoord vermeldt zijn bronnen.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Jouw AI-assistent voor INOMETA-producten, roltechnologie en flexodruk. Gebaseerd op echte inhoud van websites, datasheets en geüploade documenten — antwoordt direct, slaat elk gesprek op.",
  "feat_f11_points": [
    "Vragen over rasterrollen, rakelbladen, mouwen en flexodruk direct beantwoord",
    "Antwoorden gebaseerd op gecrawlde websites, PDFs en handmatig geüploade documenten",
    "Gestructureerde uitvoer: tabellen, vetgedrukte tekst, codeblokken en geordende lijsten (Markdown)",
    "Bronnen vermeld bij elk antwoord — website, datasheet of document",
    "Volledige gespreksgeschiedenis: elk gesprek wordt automatisch opgeslagen",
    "Eerdere gesprekken laden en hervatten met één tik",
    "Antwoordt in de taal waarin je schrijft — volledig meertalig",
    "Optionele add-on module — activeerbaar door de beheerder",
  ],
  "tips_t6": "INOid is volledig geoptimaliseerd voor smartphones: alle meerkolomsindelingen worden op mobiel teruggebracht tot één kolom, de INOai-chat vult het zichtbare schermgebied exact, en lange technische termen worden altijd correct afgebroken.",
  "tips_nav_inoai_b": "Zijbalk / Bottom-Nav → INOai (✦)",
},
"pl": {
  "hero_s2label": "obszarów funkcji",
  "qs_s5title": "Zapytaj INOai",
  "qs_s5desc": "Otwórz INOai w nawigacji. Zadawaj pytania o produkty INOMETA, wałki, rakle i tuleje — każda odpowiedź podaje swoje źródła.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Twój asystent AI dla produktów INOMETA, technologii wałków i druku fleksograficznego. Oparty na rzeczywistych treściach ze stron internetowych, kart katalogowych i przesłanych dokumentów — odpowiada natychmiast, zapisuje każdą rozmowę.",
  "feat_f11_points": [
    "Pytania o wałki rastrowe, rakle, tuleje i druk fleksograficzny odpowiadane natychmiast",
    "Odpowiedzi na podstawie przeszukanych stron, PDF-ów i ręcznie przesłanych dokumentów",
    "Strukturowane wyjście: tabele, pogrubienie, bloki kodu i listy numerowane (Markdown)",
    "Źródła podane przy każdej odpowiedzi — strona, karta katalogowa lub dokument",
    "Pełna historia rozmów: każdy czat jest automatycznie zapisywany",
    "Wczytaj i kontynuuj poprzednie rozmowy jednym dotknięciem",
    "Odpowiada w języku, w którym piszesz — w pełni wielojęzyczny",
    "Opcjonalny moduł dodatkowy — możliwy do aktywacji przez administratora",
  ],
  "tips_t6": "INOid jest w pełni zoptymalizowany pod smartfony: wszystkie wielokolumnowe układy zwijają się do jednej kolumny na urządzeniach mobilnych, czat INOai wypełnia dokładnie widoczny obszar ekranu, a długie terminy techniczne zawsze zawijają się poprawnie.",
  "tips_nav_inoai_b": "Pasek boczny / Dolna nawigacja → INOai (✦)",
},
"cs": {
  "hero_s2label": "oblastí funkcí",
  "qs_s5title": "Zeptat se INOai",
  "qs_s5desc": "Otevřete INOai v navigaci. Ptejte se na produkty INOMETA, válce, raklové nože a návleky — každá odpověď uvádí zdroje.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Váš AI asistent pro produkty INOMETA, technologii válců a flexografický tisk. Vychází ze skutečného obsahu webových stránek, datových listů a nahraných dokumentů — odpovídá okamžitě, ukládá každý rozhovor.",
  "feat_f11_points": [
    "Otázky o rastrových válcích, raklových nožích, návlecích a flexotisku zodpovězeny okamžitě",
    "Odpovědi na základě prohledaných webů, PDF a ručně nahraných dokumentů",
    "Strukturovaný výstup: tabulky, tučné písmo, bloky kódu a číslované seznamy (Markdown)",
    "Zdroje uvedeny u každé odpovědi — web, datový list nebo dokument",
    "Kompletní historie konverzací: každý chat je automaticky uložen",
    "Načtení a pokračování předchozích konverzací jedním klepnutím",
    "Odpovídá v jazyce, ve kterém píšete — plně vícejazyčný",
    "Volitelný doplňkový modul — aktivovatelný administrátorem",
  ],
  "tips_t6": "INOid je plně optimalizován pro chytré telefony: všechna vícesl sloupcová rozvržení se na mobilu sbalí do jednoho sloupce, chat INOai přesně vyplňuje viditelnou plochu obrazovky a dlouhé technické pojmy se vždy správně zalomí.",
  "tips_nav_inoai_b": "Postranní panel / Spodní nav → INOai (✦)",
},
"sk": {
  "hero_s2label": "oblastí funkcií",
  "qs_s5title": "Opýtať sa INOai",
  "qs_s5desc": "Otvorte INOai v navigácii. Pýtajte sa na produkty INOMETA, valce, raklové nože a návleky — každá odpoveď uvádza zdroje.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Váš AI asistent pre produkty INOMETA, technológiu valcov a flexografickú tlač. Vychádza zo skutočného obsahu webových stránok, technických listov a nahratých dokumentov — odpovedá okamžite, ukladá každý rozhovor.",
  "feat_f11_points": [
    "Otázky o rastrových valcoch, raklových nožoch, návlekoch a flexotlači zodpovedané okamžite",
    "Odpovede na základe prehľadaných webov, PDF a ručne nahratých dokumentov",
    "Štruktúrovaný výstup: tabuľky, tučné písmo, bloky kódu a číslované zoznamy (Markdown)",
    "Zdroje uvedené pri každej odpovedi — web, technický list alebo dokument",
    "Kompletná história konverzácií: každý chat sa automaticky uloží",
    "Načítanie a pokračovanie predchádzajúcich konverzácií jedným klepnutím",
    "Odpovedá v jazyku, v ktorom píšete — plne viacjazyčný",
    "Voliteľný doplnkový modul — aktivovateľný administrátorom",
  ],
  "tips_t6": "INOid je plne optimalizovaný pre smartfóny: všetky viacstĺpcové rozloženia sa na mobile zbalia do jedného stĺpca, chat INOai presne vypĺňa viditeľnú plochu obrazovky a dlhé technické pojmy sa vždy správne zalomia.",
  "tips_nav_inoai_b": "Bočný panel / Spodná nav → INOai (✦)",
},
"hu": {
  "hero_s2label": "funkciós terület",
  "qs_s5title": "INOai kérdezése",
  "qs_s5desc": "Nyissa meg az INOai-t a navigációban. Tegyen fel termékkérdéseket INOMETA hengerekről, kaparólapokról és hüvelyekről — minden válasz megadja a forrásait.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "AI-asszisztense INOMETA termékekhez, hengertechnológiához és flexográfiai nyomtatáshoz. Weboldalak, adatlapok és feltöltött dokumentumok valódi tartalmán alapul — azonnal válaszol, minden beszélgetést ment.",
  "feat_f11_points": [
    "Raszteres hengerekre, kaparólapokra, hüvelyekre és flexonyomtatásra vonatkozó kérdések azonnali megválaszolása",
    "Feltérképezett weboldalak, PDF-ek és manuálisan feltöltött dokumentumok alapján adott válaszok",
    "Strukturált kimenet: táblázatok, félkövér szöveg, kódblokkok és számozott listák (Markdown)",
    "Minden válasznál idézett források — weboldal, adatlap vagy dokumentum",
    "Teljes beszélgetési előzmények: minden csevegés automatikusan mentésre kerül",
    "Korábbi beszélgetések betöltése és folytatása egyetlen érintéssel",
    "Az Ön által írt nyelven válaszol — teljesen többnyelvű",
    "Opcionális kiegészítő modul — az adminisztrátor aktiválhatja",
  ],
  "tips_t6": "Az INOid teljes mértékben optimalizálva van okostelefonokra: minden többoszlopos elrendezés egyetlen oszlopra szűkül mobilon, az INOai-csevegés pontosan kitölti a látható képernyőterületet, és a hosszú műszaki kifejezések mindig helyesen törnek.",
  "tips_nav_inoai_b": "Oldalsáv / Alsó nav → INOai (✦)",
},
"ro": {
  "hero_s2label": "domenii de funcții",
  "qs_s5title": "Întreabă INOai",
  "qs_s5desc": "Deschideți INOai în navigație. Puneți întrebări despre produsele INOMETA, role, raclete și mâneci — fiecare răspuns citează sursele.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Asistentul dvs. AI pentru produse INOMETA, tehnologia rolelor și imprimarea flexografică. Bazat pe conținut real de pe site-uri web, fișe tehnice și documente încărcate — răspunde imediat, salvează fiecare conversație.",
  "feat_f11_points": [
    "Întrebări despre role anilox, raclete, mâneci și imprimare flexografică răspunse instantaneu",
    "Răspunsuri bazate pe site-uri web accesate automat, PDF-uri și documente încărcate manual",
    "Ieșire structurată: tabele, text îngroșat, blocuri de cod și liste ordonate (Markdown)",
    "Surse citate pentru fiecare răspuns — site web, fișă tehnică sau document",
    "Istoric complet al conversațiilor: fiecare chat este salvat automat",
    "Încărcați și continuați conversațiile anterioare cu o atingere",
    "Răspunde în limba în care scrieți — complet multilingv",
    "Modul suplimentar opțional — activabil de administrator",
  ],
  "tips_t6": "INOid este complet optimizat pentru smartphone-uri: toate aspectele multi-coloană se restrâng la o singură coloană pe mobil, chat-ul INOai umple exact zona vizibilă a ecranului, iar termenii tehnici lungi se împart întotdeauna corect.",
  "tips_nav_inoai_b": "Bară laterală / Nav jos → INOai (✦)",
},
"hr": {
  "hero_s2label": "područja funkcija",
  "qs_s5title": "Pitaj INOai",
  "qs_s5desc": "Otvorite INOai u navigaciji. Postavljajte pitanja o INOMETA proizvodima, valjcima, rakelima i rukavima — svaki odgovor navodi izvore.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Vaš AI asistent za INOMETA proizvode, tehnologiju valjaka i fleksografski tisak. Temelji se na stvarnom sadržaju s web stranica, tehničkih listova i učitanih dokumenata — odmah odgovara, sprema svaki razgovor.",
  "feat_f11_points": [
    "Pitanja o rasterskim valjcima, rakelima, rukavima i flekso tisku odmah odgovorena",
    "Odgovori temeljeni na pregledanim web stranicama, PDF-ovima i ručno učitanim dokumentima",
    "Strukturirani izlaz: tablice, podebljani tekst, blokovi koda i uređeni popisi (Markdown)",
    "Navedeni izvori za svaki odgovor — web stranica, tehnički list ili dokument",
    "Potpuna povijest razgovora: svaki chat se automatski sprema",
    "Učitajte i nastavite prethodne razgovore jednim dodirom",
    "Odgovara na jeziku kojim pišete — potpuno višejezičan",
    "Opcionalni dodatni modul — može ga aktivirati administrator",
  ],
  "tips_t6": "INOid je potpuno optimiziran za pametne telefone: svi višestupčasti rasporedi sažimaju se u jedan stupac na mobilnim uređajima, INOai chat točno ispunjava vidljivo područje zaslona, a dugi tehnički izrazi uvijek se pravilno prelome.",
  "tips_nav_inoai_b": "Bočna traka / Donja nav → INOai (✦)",
},
"sr": {
  "hero_s2label": "oblasti funkcija",
  "qs_s5title": "Pitaj INOai",
  "qs_s5desc": "Otvorite INOai u navigaciji. Postavljajte pitanja o INOMETA proizvodima, valjcima, raklama i rukavima — svaki odgovor navodi izvore.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Vaš AI asistent za INOMETA proizvode, tehnologiju valjaka i fleksografsku štampu. Zasnovan na stvarnom sadržaju sa web stranica, tehničkih listova i otpremljenih dokumenata — odmah odgovara, čuva svaki razgovor.",
  "feat_f11_points": [
    "Pitanja o rasterskim valjcima, raklama, rukavima i flekso štampi odmah odgovorena",
    "Odgovori zasnovani na pregledanim web stranicama, PDF-ovima i ručno otpremljenim dokumentima",
    "Strukturisani izlaz: tabele, podebljani tekst, blokovi koda i uređene liste (Markdown)",
    "Navedeni izvori za svaki odgovor — web stranica, tehnički list ili dokument",
    "Potpuna istorija razgovora: svaki čet se automatski čuva",
    "Učitajte i nastavite prethodne razgovore jednim dodirom",
    "Odgovara na jeziku na kom pišete — potpuno višejezičan",
    "Opcionalni dodatni modul — može ga aktivirati administrator",
  ],
  "tips_t6": "INOid je potpuno optimizovan za pametne telefone: svi višekolonski rasporedi sažimaju se u jednu kolonu na mobilnim uređajima, INOai čet tačno ispunjava vidljivo područje ekrana, a dugi tehnički izrazi uvijek se pravilno prelome.",
  "tips_nav_inoai_b": "Bočna traka / Donja nav → INOai (✦)",
},
"bg": {
  "hero_s2label": "функционални области",
  "qs_s5title": "Питайте INOai",
  "qs_s5desc": "Отворете INOai в навигацията. Задавайте въпроси за продукти на INOMETA, валци, ракели и ръкави — всеки отговор цитира своите източници.",
  "feat_f11_badge": "ИИ",
  "feat_f11_desc": "Вашият AI асистент за продукти на INOMETA, технология на валците и флексографски печат. Базиран на реално съдържание от уебсайтове, технически листове и качени документи — отговаря незабавно, записва всеки разговор.",
  "feat_f11_points": [
    "Въпроси за растерни валци, ракели, ръкави и флексо печат отговорени незабавно",
    "Отговори на базата на обходени уебсайтове, PDF файлове и ръчно качени документи",
    "Структуриран изход: таблици, удебелен текст, блокове с код и номерирани списъци (Markdown)",
    "Цитирани източници за всеки отговор — уебсайт, технически лист или документ",
    "Пълна история на разговорите: всеки чат се записва автоматично",
    "Зареждане и продължаване на предишни разговори с едно докосване",
    "Отговаря на езика, на който пишете — напълно многоезичен",
    "Незадължителен допълнителен модул — активиращ се от администратор",
  ],
  "tips_t6": "INOid е напълно оптимизиран за смартфони: всички многоколонни оформления се свиват до една колона на мобилни устройства, чатът INOai запълва точно видимата екранна площ, а дългите технически термини винаги се прекъсват правилно.",
  "tips_nav_inoai_b": "Страничен панел / Долна навигация → INOai (✦)",
},
"ru": {
  "hero_s2label": "функциональных областей",
  "qs_s5title": "Спросить INOai",
  "qs_s5desc": "Откройте INOai в навигации. Задавайте вопросы о продуктах INOMETA, валах, ракелях и гильзах — каждый ответ указывает источники.",
  "feat_f11_badge": "ИИ",
  "feat_f11_desc": "Ваш ИИ-ассистент по продуктам INOMETA, технологии валов и флексографской печати. Основан на реальном содержании веб-сайтов, технических листов и загруженных документов — отвечает немедленно, сохраняет каждый разговор.",
  "feat_f11_points": [
    "Вопросы о растровых валах, ракелях, гильзах и флексопечати — ответы мгновенно",
    "Ответы на основе обходных веб-страниц, PDF и вручную загруженных документов",
    "Структурированный вывод: таблицы, жирный текст, блоки кода и нумерованные списки (Markdown)",
    "Источники указаны для каждого ответа — веб-сайт, технический лист или документ",
    "Полная история разговоров: каждый чат сохраняется автоматически",
    "Загрузка и продолжение предыдущих разговоров одним нажатием",
    "Отвечает на языке, на котором вы пишете — полностью многоязычный",
    "Дополнительный необязательный модуль — активируется администратором",
  ],
  "tips_t6": "INOid полностью оптимизирован для смартфонов: все многоколонные макеты сворачиваются в один столбец на мобильных устройствах, чат INOai точно заполняет видимую область экрана, а длинные технические термины всегда правильно переносятся.",
  "tips_nav_inoai_b": "Боковая панель / Нижняя нав → INOai (✦)",
},
"uk": {
  "hero_s2label": "функціональних областей",
  "qs_s5title": "Запитати INOai",
  "qs_s5desc": "Відкрийте INOai в навігації. Ставте запитання про продукти INOMETA, вали, ракелі та гільзи — кожна відповідь вказує джерела.",
  "feat_f11_badge": "ШІ",
  "feat_f11_desc": "Ваш ШІ-асистент для продуктів INOMETA, технології валів і флексографічного друку. Базується на реальному вмісті веб-сайтів, технічних аркушів і завантажених документів — відповідає негайно, зберігає кожну розмову.",
  "feat_f11_points": [
    "Питання про растрові вали, ракелі, гільзи і флексодрук — відповіді миттєво",
    "Відповіді на основі обходжених веб-сторінок, PDF і вручну завантажених документів",
    "Структурований вивід: таблиці, жирний текст, блоки коду і нумеровані списки (Markdown)",
    "Джерела зазначені для кожної відповіді — веб-сайт, технічний аркуш або документ",
    "Повна історія розмов: кожен чат зберігається автоматично",
    "Завантаження і продовження попередніх розмов одним дотиком",
    "Відповідає на мові, якою ви пишете — повністю багатомовний",
    "Необов'язковий додатковий модуль — активується адміністратором",
  ],
  "tips_t6": "INOid повністю оптимізований для смартфонів: усі багатоколонкові макети на мобільних пристроях зводяться до одного стовпця, чат INOai точно заповнює видиму область екрана, а довгі технічні терміни завжди правильно переносяться.",
  "tips_nav_inoai_b": "Бічна панель / Нижня нав → INOai (✦)",
},
"el": {
  "hero_s2label": "λειτουργικές περιοχές",
  "qs_s5title": "Ρωτήστε το INOai",
  "qs_s5desc": "Ανοίξτε το INOai στην πλοήγηση. Κάντε ερωτήσεις για προϊόντα INOMETA, κυλίνδρους, ξέστρα και μανίκια — κάθε απάντηση αναφέρει τις πηγές της.",
  "feat_f11_badge": "ΑΙ",
  "feat_f11_desc": "Ο AI βοηθός σας για προϊόντα INOMETA, τεχνολογία κυλίνδρων και φλεξογραφική εκτύπωση. Βασίζεται σε πραγματικό περιεχόμενο ιστοτόπων, φύλλων δεδομένων και ανεβασμένων εγγράφων — απαντά αμέσως, αποθηκεύει κάθε συνομιλία.",
  "feat_f11_points": [
    "Ερωτήσεις για κυλίνδρους anilox, ξέστρα, μανίκια και φλεξο εκτύπωση απαντώνται άμεσα",
    "Απαντήσεις βασισμένες σε ανιχνευμένους ιστοτόπους, PDF και χειροκίνητα ανεβασμένα έγγραφα",
    "Δομημένη έξοδος: πίνακες, έντονο κείμενο, μπλοκ κώδικα και αριθμημένες λίστες (Markdown)",
    "Αναφορά πηγών για κάθε απάντηση — ιστοτόπος, φύλλο δεδομένων ή έγγραφο",
    "Πλήρες ιστορικό συνομιλιών: κάθε chat αποθηκεύεται αυτόματα",
    "Φόρτωση και συνέχεια προηγούμενων συνομιλιών με ένα άγγιγμα",
    "Απαντά στη γλώσσα που γράφετε — πλήρως πολύγλωσσο",
    "Προαιρετικό πρόσθετο module — ενεργοποιείται από τον διαχειριστή",
  ],
  "tips_t6": "Το INOid είναι πλήρως βελτιστοποιημένο για smartphones: όλες οι διατάξεις πολλαπλών στηλών συμπτύσσονται σε μία στήλη στο mobile, το chat INOai γεμίζει ακριβώς την ορατή περιοχή οθόνης, και οι μακροί τεχνικοί όροι τυλίγονται πάντα σωστά.",
  "tips_nav_inoai_b": "Πλαϊνή μπάρα / Κάτω nav → INOai (✦)",
},
"tr": {
  "hero_s2label": "özellik alanı",
  "qs_s5title": "INOai'ye Sor",
  "qs_s5desc": "Gezinmede INOai'yi açın. INOMETA silindirleri, rakel bıçakları ve manşonlar hakkında ürün soruları sorun — her yanıt kaynaklarını belirtir.",
  "feat_f11_badge": "YZ",
  "feat_f11_desc": "INOMETA ürünleri, silindir teknolojisi ve fleksografik baskı için yapay zeka asistanınız. Web siteleri, veri sayfaları ve yüklenen belgelerden gerçek içeriğe dayanır — anında yanıtlar, her konuşmayı kaydeder.",
  "feat_f11_points": [
    "Aniloks silindirleri, rakel bıçakları, manşonlar ve flekso baskı hakkındaki sorular anında yanıtlanır",
    "Taranan web siteleri, PDF'ler ve manuel olarak yüklenen belgelere dayalı yanıtlar",
    "Yapılandırılmış çıktı: tablolar, kalın metin, kod blokları ve sıralı listeler (Markdown)",
    "Her yanıt için belirtilen kaynaklar — web sitesi, veri sayfası veya belge",
    "Tam konuşma geçmişi: her sohbet otomatik olarak kaydedilir",
    "Önceki konuşmaları tek dokunuşla yükleyin ve devam edin",
    "Yazdığınız dilde yanıt verir — tamamen çok dilli",
    "İsteğe bağlı eklenti modül — yönetici tarafından etkinleştirilebilir",
  ],
  "tips_t6": "INOid tamamen akıllı telefon için optimize edilmiştir: tüm çok sütunlu düzenler mobilde tek sütuna daraltılır, INOai sohbeti görünür ekran alanını tam olarak doldurur ve uzun teknik terimler her zaman doğru şekilde kırılır.",
  "tips_nav_inoai_b": "Kenar çubuğu / Alt nav → INOai (✦)",
},
"sv": {
  "hero_s2label": "funktionsområden",
  "qs_s5title": "Fråga INOai",
  "qs_s5desc": "Öppna INOai i navigeringen. Ställ produktfrågor om INOMETA-valsar, raklar och hylsor — varje svar anger sina källor.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Din AI-assistent för INOMETA-produkter, valsteknik och flexotryck. Baserad på verkligt innehåll från webbplatser, datablad och uppladdade dokument — svarar omedelbart, sparar varje konversation.",
  "feat_f11_points": [
    "Frågor om rastervalsar, raklar, hylsor och flexotryck besvaras omedelbart",
    "Svar baserade på crawlade webbplatser, PDF:er och manuellt uppladdade dokument",
    "Strukturerad utdata: tabeller, fet text, kodblock och ordnade listor (Markdown)",
    "Källor anges för varje svar — webbplats, datablad eller dokument",
    "Komplett konversationshistorik: varje chatt sparas automatiskt",
    "Ladda och fortsätt tidigare konversationer med ett tryck",
    "Svarar på det språk du skriver på — helt flerspråkigt",
    "Valfri tilläggsmodul — kan aktiveras av administratören",
  ],
  "tips_t6": "INOid är fullt optimerat för smartphones: alla flerspaltsliga layouter komprimeras till en enda kolumn på mobil, INOai-chatten fyller exakt det synliga skärmområdet och långa tekniska termer bryts alltid korrekt.",
  "tips_nav_inoai_b": "Sidobalk / Nedre nav → INOai (✦)",
},
"da": {
  "hero_s2label": "funktionsområder",
  "qs_s5title": "Spørg INOai",
  "qs_s5desc": "Åbn INOai i navigationen. Stil produktspørgsmål om INOMETA-valser, rakkler og hylstre — hvert svar angiver sine kilder.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Din AI-assistent til INOMETA-produkter, valsteknologi og fleksotryk. Baseret på rigtigt indhold fra hjemmesider, datablade og uploadede dokumenter — svarer øjeblikkeligt, gemmer alle samtaler.",
  "feat_f11_points": [
    "Spørgsmål om rastervalser, rakkler, hylstre og fleksotryk besvaret øjeblikkeligt",
    "Svar baseret på crawlede hjemmesider, PDF'er og manuelt uploadede dokumenter",
    "Struktureret output: tabeller, fed tekst, kodeblokke og ordnede lister (Markdown)",
    "Kilder angivet for hvert svar — hjemmeside, datablad eller dokument",
    "Komplet samtalehistorik: alle chats gemmes automatisk",
    "Indlæs og fortsæt tidligere samtaler med ét tryk",
    "Svarer på det sprog du skriver på — fuldt flersproget",
    "Valgfrit tillægsmodul — kan aktiveres af administratoren",
  ],
  "tips_t6": "INOid er fuldt optimeret til smartphones: alle flerspalte-layouts komprimeres til én kolonne på mobil, INOai-chatten udfylder præcis det synlige skærmområde og lange tekniske begreber brydes altid korrekt.",
  "tips_nav_inoai_b": "Sidebjælke / Nedre nav → INOai (✦)",
},
"no": {
  "hero_s2label": "funksjonsområder",
  "qs_s5title": "Spør INOai",
  "qs_s5desc": "Åpne INOai i navigasjonen. Still produktspørsmål om INOMETA-valser, rakler og hylser — hvert svar angir kildene sine.",
  "feat_f11_badge": "KI",
  "feat_f11_desc": "Din KI-assistent for INOMETA-produkter, valseteknologi og fleksotrykt. Basert på ekte innhold fra nettsider, datablad og opplastede dokumenter — svarer umiddelbart, lagrer alle samtaler.",
  "feat_f11_points": [
    "Spørsmål om rastervalser, rakler, hylser og fleksotrykt besvart umiddelbart",
    "Svar basert på crawlede nettsider, PDF-er og manuelt opplastede dokumenter",
    "Strukturert utdata: tabeller, fet tekst, kodeblokker og nummererte lister (Markdown)",
    "Kilder angitt for hvert svar — nettside, datablad eller dokument",
    "Komplett samtalehistorikk: alle chatter lagres automatisk",
    "Last inn og fortsett tidligere samtaler med ett trykk",
    "Svarer på språket du skriver på — fullt flerspråklig",
    "Valgfri tilleggsmodul — kan aktiveres av administrator",
  ],
  "tips_t6": "INOid er fullt optimalisert for smarttelefoner: alle flerspalte-oppsett komprimeres til én kolonne på mobil, INOai-chatten fyller nøyaktig det synlige skjermområdet og lange tekniske begreper brytes alltid riktig.",
  "tips_nav_inoai_b": "Sidefelt / Nedre nav → INOai (✦)",
},
"fi": {
  "hero_s2label": "toiminta-aluetta",
  "qs_s5title": "Kysy INOailta",
  "qs_s5desc": "Avaa INOai navigoinnissa. Kysy tuotekysymyksiä INOMETA-teloista, raakeleista ja hihnoista — jokainen vastaus mainitsee lähteensä.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "AI-avustajasi INOMETA-tuotteille, telatekniikalle ja fleksopainatukselle. Perustuu todelliseen sisältöön verkkosivuilta, tietolehdistä ja ladatuista dokumenteista — vastaa välittömästi, tallentaa jokaisen keskustelun.",
  "feat_f11_points": [
    "Kysymykset rasteriteloista, raakeleista, hihnoista ja fleksopainatuksesta vastataan välittömästi",
    "Vastaukset perustuvat indeksoituihin verkkosivuihin, PDF-tiedostoihin ja manuaalisesti ladattuihin dokumentteihin",
    "Jäsennelty ulostulo: taulukot, lihavoitu teksti, koodilohkot ja järjestetyt luettelot (Markdown)",
    "Lähteet mainittu jokaiselle vastaukselle — verkkosivusto, tietolehti tai dokumentti",
    "Täydellinen keskusteluhistoria: jokainen chat tallennetaan automaattisesti",
    "Lataa ja jatka aiempia keskusteluja yhdellä napautuksella",
    "Vastaa kielelläsi — täysin monikielinen",
    "Valinnainen lisämoduuli — järjestelmänvalvoja voi aktivoida",
  ],
  "tips_t6": "INOid on täysin optimoitu älypuhelimille: kaikki monisarakkeinen asettelu supistuu yhdeksi sarakkeeksi mobiilissa, INOai-chat täyttää täsmälleen näkyvän näyttöalueen ja pitkät tekniset termit katkeavat aina oikein.",
  "tips_nav_inoai_b": "Sivupalkki / Alanavigaatio → INOai (✦)",
},
"et": {
  "hero_s2label": "funktsioonivaldkonda",
  "qs_s5title": "Küsi INOaillt",
  "qs_s5desc": "Avage INOai navigatsioonis. Esitage tooteküsimusi INOMETA rullide, raakli­teradede ja varrukate kohta — iga vastus viitab allikatele.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Teie AI-assistent INOMETA toodete, rulli tehnoloogia ja fleksograafilise trüki jaoks. Põhineb tegelikul sisul veebisaitidelt, andmelehtedelt ja üleslaaditud dokumentidest — vastab kohe, salvestab iga vestluse.",
  "feat_f11_points": [
    "Küsimused rasterrullide, raakliteradede, varrukate ja fleksoprintimise kohta vastatakse kohe",
    "Vastused indekseeritud veebisaitide, PDF-ide ja käsitsi üleslaaditud dokumentide põhjal",
    "Struktureeritud väljund: tabelid, paks tekst, koodiblokid ja järjestatud loendid (Markdown)",
    "Iga vastuse juures viidatud allikad — veebisait, andmeleht või dokument",
    "Täielik vestlusajalugu: iga vestlus salvestatakse automaatselt",
    "Laadige eelmised vestlused ja jätkake neid ühe puudutusega",
    "Vastab keeles, milles kirjutate — täiesti mitmekeelne",
    "Valikuline lisandmoodul — administraator saab aktiveerida",
  ],
  "tips_t6": "INOid on täielikult optimeeritud nutitelefonidele: kõik mitmeveeru­küljendused tihenduvad mobiilis üheks veeruks, INOai vestlus täidab täpselt nähtava ekraaniala ja pikad tehnilised terminid murtakse alati õigesti.",
  "tips_nav_inoai_b": "Külgriba / Alanavigatsiooni → INOai (✦)",
},
"lv": {
  "hero_s2label": "funkciju jomas",
  "qs_s5title": "Jautājiet INOai",
  "qs_s5desc": "Atveriet INOai navigācijā. Uzdodiet jautājumus par INOMETA produktiem, veltņiem, rakeles asmeņiem un piedurknēm — katra atbilde norāda avotus.",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "Jūsu AI asistents INOMETA produktiem, veltņu tehnoloģijai un fleksogrāfiskajai drukai. Balstīts uz reālu saturu no tīmekļa vietnēm, datu lapām un augšupielādētiem dokumentiem — atbild nekavējoties, saglabā katru sarunu.",
  "feat_f11_points": [
    "Jautājumi par rastrveltņiem, rakeles asmeņiem, piedurknēm un fleksodrukas tehnoloģiju atbildēti tūlīt",
    "Atbildes pamatotas uz indeksētām tīmekļa vietnēm, PDF failiem un manuāli augšupielādētiem dokumentiem",
    "Strukturēts izvads: tabulas, treknraksts, koda bloki un numurēti saraksti (Markdown)",
    "Avoti norādīti katrai atbildei — tīmekļa vietne, datu lapa vai dokuments",
    "Pilna sarunu vēsture: katra saruna tiek automātiski saglabāta",
    "Ielādēt un turpināt iepriekšējās sarunas ar vienu pieskārienu",
    "Atbild jūsu rakstītajā valodā — pilnīgi daudzvalodu",
    "Izvēles papildu modulis — administrators var aktivizēt",
  ],
  "tips_t6": "INOid ir pilnībā optimizēts viedtālruņiem: visi vairāksleju izkārtojumi mobilajā ierīcē saspiežas vienā slejā, INOai tērzēšana precīzi aizpilda redzamo ekrāna laukumu un gari tehniskie termini vienmēr tiek pareizi pārtraukti.",
  "tips_nav_inoai_b": "Sānu josla / Apakšnavigācija → INOai (✦)",
},
"lt": {
  "hero_s2label": "funkcijų sritys",
  "qs_s5title": "Klauskite INOai",
  "qs_s5desc": "Atidarykite INOai naršymoje. Užduokite produktų klausimus apie INOMETA velenėlius, raklelius ir mufas — kiekvienas atsakymas nurodo šaltinius.",
  "feat_f11_badge": "DI",
  "feat_f11_desc": "Jūsų DI asistentas INOMETA produktams, velenėlių technologijai ir fleksografiniam spaudui. Pagrįstas tikru turiniu iš svetainių, techninių lapų ir įkeltų dokumentų — atsako nedelsiant, išsaugo kiekvieną pokalbį.",
  "feat_f11_points": [
    "Klausimai apie rastro velenėlius, raklelius, mufas ir fleksografinį spaudą atsakomi akimirksniu",
    "Atsakymai remiantis nuskaitytos svetainės, PDF ir rankiniu būdu įkeltais dokumentais",
    "Struktūrizuota išvestis: lentelės, pusjuodis tekstas, kodo blokai ir sunumeruoti sąrašai (Markdown)",
    "Kiekviename atsakyme nurodyti šaltiniai — svetainė, techninis lapas ar dokumentas",
    "Pilna pokalbių istorija: kiekvienas pokalbis išsaugomas automatiškai",
    "Įkelkite ir tęskite ankstesnius pokalbius vienu paspaudimu",
    "Atsako jūsų rašymo kalba — visiškai daugiakalbis",
    "Pasirinktinis papildomas modulis — gali suaktyvinti administratorius",
  ],
  "tips_t6": "INOid yra visiškai optimizuotas išmaniesiems telefonams: visi kelių stulpelių išdėstymai mobiliajame įrenginyje suspaudžiami į vieną stulpelį, INOai pokalbis tiksliai užpildo matomą ekrano sritį, o ilgi techniniai terminai visada teisingai laužomi.",
  "tips_nav_inoai_b": "Šoninis skydelis / Apačios nav → INOai (✦)",
},
"ja": {
  "hero_s2label": "機能エリア",
  "qs_s5title": "INOaiに質問する",
  "qs_s5desc": "ナビゲーションでINOaiを開き、INOMETAのロール、ドクターブレード、スリーブに関する製品の質問をしてください — すべての回答は出典を明示します。",
  "feat_f11_badge": "AI",
  "feat_f11_desc": "INOMETAの製品、ローラー技術、フレキソ印刷のためのAIアシスタント。ウェブサイト、データシート、アップロードされたドキュメントの実際のコンテンツに基づき、即座に回答し、すべての会話を自動保存します。",
  "feat_f11_points": [
    "アニロックスロール、ドクターブレード、スリーブ、フレキソ印刷に関する質問に即座に回答",
    "クロールしたウェブサイト、PDF、手動アップロードしたドキュメントに基づく回答",
    "構造化出力：表、太字、コードブロック、番号付きリスト（Markdown）",
    "すべての回答に出典を明記 — ウェブサイト、データシート、またはドキュメント",
    "完全な会話履歴：すべてのチャットが自動的に保存される",
    "ワンタップで過去の会話を読み込んで再開",
    "書いた言語で回答 — 完全多言語対応",
    "オプションのアドオンモジュール — 管理者が有効化可能",
  ],
  "tips_t6": "INOidはスマートフォンに完全最適化されています：すべての複数列レイアウトはモバイルで1列に折りたたまれ、INOaiチャットは表示画面エリアを正確に埋め、長い技術用語は常に正しく折り返されます。",
  "tips_nav_inoai_b": "サイドバー / ボトムナビ → INOai (✦)",
},
"zh": {
  "hero_s2label": "功能区域",
  "qs_s5title": "询问 INOai",
  "qs_s5desc": "在导航栏中打开 INOai。提问有关 INOMETA 辊筒、刮墨刀和套筒的产品问题 — 每个回答都会引用来源。",
  "feat_f11_badge": "人工智能",
  "feat_f11_desc": "您的 AI 助手，专为 INOMETA 产品、辊筒技术和柔版印刷设计。基于网站、数据表和上传文档的真实内容 — 即时回答，自动保存每次对话。",
  "feat_f11_points": [
    "关于网纹辊、刮墨刀、套筒和柔版印刷的问题即时回答",
    "回答基于已爬取的网站、PDF 和手动上传的文档",
    "结构化输出：表格、粗体文字、代码块和有序列表（Markdown）",
    "每个回答都注明来源 — 网站、数据表或文档",
    "完整的对话历史：每次聊天都自动保存",
    "一键加载并继续之前的对话",
    "以您书写的语言回答 — 完全多语言",
    "可选附加模块 — 可由管理员激活",
  ],
  "tips_t6": "INOid 完全针对智能手机进行了优化：所有多列布局在移动端折叠为单列，INOai 聊天精确填充可见屏幕区域，长技术术语始终正确换行。",
  "tips_nav_inoai_b": "侧边栏 / 底部导航 → INOai (✦)",
},
}

# ── Apply to all JSON files ───────────────────────────────────────────────────

def update_lang_file(lang: str):
    path = MSG_DIR / f"{lang}.json"
    if not path.exists():
        print(f"  ⚠  {lang}.json not found, skipping")
        return

    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    t = TRANSLATIONS.get(lang, TRANSLATIONS["en"])  # fallback to EN

    docs = data.setdefault("docs", {})

    # hero
    docs.setdefault("hero", {})["s2val"] = "11+"
    docs["hero"]["s2label"] = t.get("hero_s2label", TRANSLATIONS["en"]["hero_s2label"])

    # qs step 5
    qs = docs.setdefault("qs", {})
    qs["s5title"] = t.get("qs_s5title", TRANSLATIONS["en"]["qs_s5title"])
    qs["s5desc"]  = t.get("qs_s5desc",  TRANSLATIONS["en"]["qs_s5desc"])

    # f11
    feat = docs.setdefault("feat", {})
    f11 = feat.setdefault("f11", {})
    f11["title"]  = "INOai"
    f11["badge"]  = t.get("feat_f11_badge",  TRANSLATIONS["en"]["feat_f11_badge"])
    f11["desc"]   = t.get("feat_f11_desc",   TRANSLATIONS["en"]["feat_f11_desc"])
    f11["points"] = t.get("feat_f11_points", TRANSLATIONS["en"]["feat_f11_points"])

    # tips t6
    tips = docs.setdefault("tips", {})
    tips["t6"] = t.get("tips_t6", TRANSLATIONS["en"]["tips_t6"])

    # nav – add INOai entry
    nav = tips.setdefault("nav", [])
    inoai_b = t.get("tips_nav_inoai_b", TRANSLATIONS["en"]["tips_nav_inoai_b"])
    inoai_entry = {"a": "INOai", "b": inoai_b}
    found = any(item.get("a") == "INOai" for item in nav)
    if not found:
        nav.append(inoai_entry)
    else:
        for i, item in enumerate(nav):
            if item.get("a") == "INOai":
                nav[i] = inoai_entry
                break

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  ✓  {lang}")


if __name__ == "__main__":
    langs = sorted([p.stem for p in MSG_DIR.glob("*.json")])
    print(f"Updating {len(langs)} language files...\n")
    for lang in langs:
        update_lang_file(lang)
    print(f"\nDone — {len(langs)} files updated.")
