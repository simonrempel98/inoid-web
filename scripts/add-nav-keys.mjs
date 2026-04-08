import { readFileSync, writeFileSync, readdirSync } from 'fs'

// Short nav labels for bottom navigation
const translations = {
  de: { assetsShort: 'Assets', wartungShort: 'Wartung', more: 'Mehr' },
  en: { assetsShort: 'Assets', wartungShort: 'Maintenance', more: 'More' },
  fr: { assetsShort: 'Assets', wartungShort: 'Maintenance', more: 'Plus' },
  es: { assetsShort: 'Assets', wartungShort: 'Mantenimiento', more: 'Más' },
  it: { assetsShort: 'Assets', wartungShort: 'Manutenzione', more: 'Altro' },
  pt: { assetsShort: 'Assets', wartungShort: 'Manutenção', more: 'Mais' },
  nl: { assetsShort: 'Assets', wartungShort: 'Onderhoud', more: 'Meer' },
  pl: { assetsShort: 'Zasoby', wartungShort: 'Serwis', more: 'Więcej' },
  sv: { assetsShort: 'Tillgångar', wartungShort: 'Underhåll', more: 'Mer' },
  da: { assetsShort: 'Aktiver', wartungShort: 'Vedligehold', more: 'Mere' },
  fi: { assetsShort: 'Kalusto', wartungShort: 'Huolto', more: 'Lisää' },
  nb: { assetsShort: 'Eiendeler', wartungShort: 'Vedlikehold', more: 'Mer' },
  cs: { assetsShort: 'Majetek', wartungShort: 'Servis', more: 'Více' },
  sk: { assetsShort: 'Majetok', wartungShort: 'Servis', more: 'Viac' },
  hu: { assetsShort: 'Eszközök', wartungShort: 'Karbantartás', more: 'Több' },
  ro: { assetsShort: 'Active', wartungShort: 'Mentenanță', more: 'Mai mult' },
  bg: { assetsShort: 'Активи', wartungShort: 'Сервиз', more: 'Още' },
  el: { assetsShort: 'Πόροι', wartungShort: 'Συντήρηση', more: 'Περισσότερα' },
  tr: { assetsShort: 'Varlıklar', wartungShort: 'Bakım', more: 'Daha' },
  ru: { assetsShort: 'Активы', wartungShort: 'Обслуживание', more: 'Ещё' },
  uk: { assetsShort: 'Активи', wartungShort: 'Обслуговування', more: 'Більше' },
  ar: { assetsShort: 'الأصول', wartungShort: 'الصيانة', more: 'المزيد' },
  zh: { assetsShort: '资产', wartungShort: '维护', more: '更多' },
  ja: { assetsShort: '資産', wartungShort: 'メンテ', more: 'もっと' },
  ko: { assetsShort: '자산', wartungShort: '유지보수', more: '더보기' },
  th: { assetsShort: 'สินทรัพย์', wartungShort: 'การบำรุง', more: 'เพิ่มเติม' },
  vi: { assetsShort: 'Tài sản', wartungShort: 'Bảo trì', more: 'Thêm' },
  id: { assetsShort: 'Aset', wartungShort: 'Pemeliharaan', more: 'Lainnya' },
}

const messagesDir = 'C:/Users/Simon/Projects/inoid-web/messages'
const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const lang = file.replace('.json', '')
  const tr = translations[lang] || translations.en
  const path = `${messagesDir}/${file}`
  const data = JSON.parse(readFileSync(path, 'utf8'))

  if (!data.nav) data.nav = {}
  data.nav.assetsShort = tr.assetsShort
  data.nav.wartungShort = tr.wartungShort
  data.nav.more = tr.more

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${file}`)
}
