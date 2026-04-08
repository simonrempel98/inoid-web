import { readFileSync, writeFileSync, readdirSync } from 'fs'

const translations = {
  de: { manufacturer: 'Hersteller', location: 'Standort', createdAt: 'Angelegt', showAll: 'Alle anzeigen', qrNfc: 'QR-Code & NFC', noQr: 'Kein QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Bestellung', newEntry: '+ Neuer Eintrag', createFirstEntry: '+ Eintrag anlegen' },
  en: { manufacturer: 'Manufacturer', location: 'Location', createdAt: 'Created', showAll: 'Show all', qrNfc: 'QR Code & NFC', noQr: 'No QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Order', newEntry: '+ New entry', createFirstEntry: '+ Add entry' },
  fr: { manufacturer: 'Fabricant', location: 'Emplacement', createdAt: 'Créé le', showAll: 'Tout afficher', qrNfc: 'Code QR & NFC', noQr: 'Pas de QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Commande', newEntry: '+ Nouvelle entrée', createFirstEntry: '+ Ajouter une entrée' },
  es: { manufacturer: 'Fabricante', location: 'Ubicación', createdAt: 'Creado', showAll: 'Ver todo', qrNfc: 'Código QR & NFC', noQr: 'Sin QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Pedido', newEntry: '+ Nueva entrada', createFirstEntry: '+ Añadir entrada' },
  it: { manufacturer: 'Produttore', location: 'Posizione', createdAt: 'Creato', showAll: 'Mostra tutto', qrNfc: 'Codice QR & NFC', noQr: 'Nessun QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Ordine', newEntry: '+ Nuova voce', createFirstEntry: '+ Aggiungi voce' },
  pt: { manufacturer: 'Fabricante', location: 'Localização', createdAt: 'Criado', showAll: 'Ver tudo', qrNfc: 'Código QR & NFC', noQr: 'Sem QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Pedido', newEntry: '+ Nova entrada', createFirstEntry: '+ Adicionar entrada' },
  nl: { manufacturer: 'Fabrikant', location: 'Locatie', createdAt: 'Aangemaakt', showAll: 'Alles tonen', qrNfc: 'QR-code & NFC', noQr: 'Geen QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Bestelling', newEntry: '+ Nieuwe invoer', createFirstEntry: '+ Invoer toevoegen' },
  pl: { manufacturer: 'Producent', location: 'Lokalizacja', createdAt: 'Utworzono', showAll: 'Pokaż wszystko', qrNfc: 'Kod QR & NFC', noQr: 'Brak QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Zamówienie', newEntry: '+ Nowy wpis', createFirstEntry: '+ Dodaj wpis' },
  sv: { manufacturer: 'Tillverkare', location: 'Plats', createdAt: 'Skapad', showAll: 'Visa alla', qrNfc: 'QR-kod & NFC', noQr: 'Ingen QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Beställning', newEntry: '+ Ny post', createFirstEntry: '+ Lägg till post' },
  da: { manufacturer: 'Producent', location: 'Placering', createdAt: 'Oprettet', showAll: 'Vis alle', qrNfc: 'QR-kode & NFC', noQr: 'Ingen QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Bestilling', newEntry: '+ Ny post', createFirstEntry: '+ Tilføj post' },
  fi: { manufacturer: 'Valmistaja', location: 'Sijainti', createdAt: 'Luotu', showAll: 'Näytä kaikki', qrNfc: 'QR-koodi & NFC', noQr: 'Ei QR:ää', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Tilaus', newEntry: '+ Uusi merkintä', createFirstEntry: '+ Lisää merkintä' },
  nb: { manufacturer: 'Produsent', location: 'Plassering', createdAt: 'Opprettet', showAll: 'Vis alle', qrNfc: 'QR-kode & NFC', noQr: 'Ingen QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Bestilling', newEntry: '+ Ny oppføring', createFirstEntry: '+ Legg til oppføring' },
  cs: { manufacturer: 'Výrobce', location: 'Umístění', createdAt: 'Vytvořeno', showAll: 'Zobrazit vše', qrNfc: 'QR kód & NFC', noQr: 'Žádný QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Objednávka', newEntry: '+ Nová položka', createFirstEntry: '+ Přidat položku' },
  sk: { manufacturer: 'Výrobca', location: 'Umiestnenie', createdAt: 'Vytvorené', showAll: 'Zobraziť všetko', qrNfc: 'QR kód & NFC', noQr: 'Žiadny QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Objednávka', newEntry: '+ Nová položka', createFirstEntry: '+ Pridať položku' },
  hu: { manufacturer: 'Gyártó', location: 'Helyszín', createdAt: 'Létrehozva', showAll: 'Összes megjelenítése', qrNfc: 'QR-kód & NFC', noQr: 'Nincs QR', articlePrefix: 'Cikk.', serialPrefix: 'SN', orderPrefix: 'Rendelés', newEntry: '+ Új bejegyzés', createFirstEntry: '+ Bejegyzés hozzáadása' },
  ro: { manufacturer: 'Producător', location: 'Locație', createdAt: 'Creat', showAll: 'Arată tot', qrNfc: 'Cod QR & NFC', noQr: 'Fără QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Comandă', newEntry: '+ Intrare nouă', createFirstEntry: '+ Adăugați intrare' },
  bg: { manufacturer: 'Производител', location: 'Местоположение', createdAt: 'Създадено', showAll: 'Покажи всички', qrNfc: 'QR код & NFC', noQr: 'Няма QR', articlePrefix: 'Арт.', serialPrefix: 'SN', orderPrefix: 'Поръчка', newEntry: '+ Нов запис', createFirstEntry: '+ Добавяне на запис' },
  el: { manufacturer: 'Κατασκευαστής', location: 'Τοποθεσία', createdAt: 'Δημιουργήθηκε', showAll: 'Εμφάνιση όλων', qrNfc: 'Κωδικός QR & NFC', noQr: 'Χωρίς QR', articlePrefix: 'Αρ.', serialPrefix: 'SN', orderPrefix: 'Παραγγελία', newEntry: '+ Νέα καταχώρηση', createFirstEntry: '+ Προσθήκη καταχώρησης' },
  tr: { manufacturer: 'Üretici', location: 'Konum', createdAt: 'Oluşturuldu', showAll: 'Tümünü göster', qrNfc: 'QR Kodu & NFC', noQr: 'QR yok', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Sipariş', newEntry: '+ Yeni giriş', createFirstEntry: '+ Giriş ekle' },
  ru: { manufacturer: 'Производитель', location: 'Местоположение', createdAt: 'Создано', showAll: 'Показать все', qrNfc: 'QR-код & NFC', noQr: 'Нет QR', articlePrefix: 'Арт.', serialPrefix: 'SN', orderPrefix: 'Заказ', newEntry: '+ Новая запись', createFirstEntry: '+ Добавить запись' },
  uk: { manufacturer: 'Виробник', location: 'Місцезнаходження', createdAt: 'Створено', showAll: 'Показати все', qrNfc: 'QR-код & NFC', noQr: 'Немає QR', articlePrefix: 'Арт.', serialPrefix: 'SN', orderPrefix: 'Замовлення', newEntry: '+ Новий запис', createFirstEntry: '+ Додати запис' },
  ar: { manufacturer: 'الشركة المصنعة', location: 'الموقع', createdAt: 'تاريخ الإنشاء', showAll: 'عرض الكل', qrNfc: 'رمز QR & NFC', noQr: 'لا يوجد QR', articlePrefix: 'رقم', serialPrefix: 'SN', orderPrefix: 'طلب', newEntry: '+ إدخال جديد', createFirstEntry: '+ إضافة إدخال' },
  zh: { manufacturer: '制造商', location: '位置', createdAt: '创建于', showAll: '查看全部', qrNfc: 'QR码 & NFC', noQr: '无QR码', articlePrefix: '货号', serialPrefix: 'SN', orderPrefix: '订单', newEntry: '+ 新条目', createFirstEntry: '+ 添加条目' },
  ja: { manufacturer: 'メーカー', location: '場所', createdAt: '作成日', showAll: 'すべて表示', qrNfc: 'QRコード & NFC', noQr: 'QRなし', articlePrefix: '品番', serialPrefix: 'SN', orderPrefix: '注文', newEntry: '+ 新しいエントリ', createFirstEntry: '+ エントリを追加' },
  ko: { manufacturer: '제조업체', location: '위치', createdAt: '생성일', showAll: '전체 보기', qrNfc: 'QR코드 & NFC', noQr: 'QR 없음', articlePrefix: '품번', serialPrefix: 'SN', orderPrefix: '주문', newEntry: '+ 새 항목', createFirstEntry: '+ 항목 추가' },
  th: { manufacturer: 'ผู้ผลิต', location: 'ตำแหน่ง', createdAt: 'สร้างเมื่อ', showAll: 'แสดงทั้งหมด', qrNfc: 'QR Code & NFC', noQr: 'ไม่มี QR', articlePrefix: 'สินค้า', serialPrefix: 'SN', orderPrefix: 'คำสั่งซื้อ', newEntry: '+ รายการใหม่', createFirstEntry: '+ เพิ่มรายการ' },
  vi: { manufacturer: 'Nhà sản xuất', location: 'Vị trí', createdAt: 'Ngày tạo', showAll: 'Xem tất cả', qrNfc: 'Mã QR & NFC', noQr: 'Không có QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Đơn hàng', newEntry: '+ Mục mới', createFirstEntry: '+ Thêm mục' },
  id: { manufacturer: 'Produsen', location: 'Lokasi', createdAt: 'Dibuat', showAll: 'Tampilkan semua', qrNfc: 'Kode QR & NFC', noQr: 'Tidak ada QR', articlePrefix: 'Art.', serialPrefix: 'SN', orderPrefix: 'Pesanan', newEntry: '+ Entri baru', createFirstEntry: '+ Tambah entri' },
}

const messagesDir = 'C:/Users/Simon/Projects/inoid-web/messages'
const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const lang = file.replace('.json', '')
  const tr = translations[lang] || translations.en
  const path = `${messagesDir}/${file}`
  const data = JSON.parse(readFileSync(path, 'utf8'))

  if (!data.assets) data.assets = {}
  if (!data.assets.fields) data.assets.fields = {}
  if (!data.assets.detail) data.assets.detail = {}

  data.assets.fields.manufacturer = tr.manufacturer
  data.assets.fields.location = tr.location

  data.assets.detail.createdAt = tr.createdAt
  data.assets.detail.showAll = tr.showAll
  data.assets.detail.qrNfc = tr.qrNfc
  data.assets.detail.noQr = tr.noQr
  data.assets.detail.articlePrefix = tr.articlePrefix
  data.assets.detail.serialPrefix = tr.serialPrefix
  data.assets.detail.orderPrefix = tr.orderPrefix
  data.assets.detail.newEntry = tr.newEntry
  data.assets.detail.createFirstEntry = tr.createFirstEntry

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${file}`)
}
