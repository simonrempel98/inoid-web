import { readFileSync, writeFileSync, readdirSync } from 'fs'

const translations = {
  de: { intervalShort: 'alle {n}T', overdueShort: '{days}T überfällig', dueInShort: 'in {n}T', deleteConfirmTitle: 'Intervall löschen?', deleteConfirmBody: '"{name}" wird unwiderruflich gelöscht.', deleting: 'Wird gelöscht…', confirmDelete: 'Ja, löschen' },
  en: { intervalShort: 'every {n}d', overdueShort: '{days}d overdue', dueInShort: 'in {n}d', deleteConfirmTitle: 'Delete interval?', deleteConfirmBody: '"{name}" will be permanently deleted.', deleting: 'Deleting…', confirmDelete: 'Yes, delete' },
  fr: { intervalShort: 'ts les {n}j', overdueShort: '{days}j de retard', dueInShort: 'dans {n}j', deleteConfirmTitle: "Supprimer l'intervalle?", deleteConfirmBody: '"{name}" sera définitivement supprimé.', deleting: 'Suppression…', confirmDelete: 'Oui, supprimer' },
  es: { intervalShort: 'cada {n}d', overdueShort: '{days}d de retraso', dueInShort: 'en {n}d', deleteConfirmTitle: '¿Eliminar intervalo?', deleteConfirmBody: '"{name}" se eliminará permanentemente.', deleting: 'Eliminando…', confirmDelete: 'Sí, eliminar' },
  it: { intervalShort: 'ogni {n}g', overdueShort: '{days}g in ritardo', dueInShort: 'tra {n}g', deleteConfirmTitle: 'Eliminare intervallo?', deleteConfirmBody: '"{name}" verrà eliminato definitivamente.', deleting: 'Eliminazione…', confirmDelete: 'Sì, elimina' },
  pt: { intervalShort: 'cada {n}d', overdueShort: '{days}d atrasado', dueInShort: 'em {n}d', deleteConfirmTitle: 'Excluir intervalo?', deleteConfirmBody: '"{name}" será excluído permanentemente.', deleting: 'Excluindo…', confirmDelete: 'Sim, excluir' },
  nl: { intervalShort: 'elke {n}d', overdueShort: '{days}d te laat', dueInShort: 'over {n}d', deleteConfirmTitle: 'Interval verwijderen?', deleteConfirmBody: '"{name}" wordt definitief verwijderd.', deleting: 'Verwijderen…', confirmDelete: 'Ja, verwijderen' },
  pl: { intervalShort: 'co {n}d', overdueShort: '{days}d po terminie', dueInShort: 'za {n}d', deleteConfirmTitle: 'Usunąć interwał?', deleteConfirmBody: '"{name}" zostanie trwale usunięty.', deleting: 'Usuwanie…', confirmDelete: 'Tak, usuń' },
  sv: { intervalShort: 'var {n}d', overdueShort: '{days}d försenad', dueInShort: 'om {n}d', deleteConfirmTitle: 'Ta bort intervall?', deleteConfirmBody: '"{name}" tas bort permanent.', deleting: 'Tar bort…', confirmDelete: 'Ja, ta bort' },
  da: { intervalShort: 'hver {n}d', overdueShort: '{days}d overskredet', dueInShort: 'om {n}d', deleteConfirmTitle: 'Slet interval?', deleteConfirmBody: '"{name}" slettes permanent.', deleting: 'Sletter…', confirmDelete: 'Ja, slet' },
  fi: { intervalShort: 'joka {n}p', overdueShort: '{days}p myöhässä', dueInShort: '{n}p kuluttua', deleteConfirmTitle: 'Poistetaanko väli?', deleteConfirmBody: '"{name}" poistetaan pysyvästi.', deleting: 'Poistetaan…', confirmDelete: 'Kyllä, poista' },
  nb: { intervalShort: 'hver {n}d', overdueShort: '{days}d forfalt', dueInShort: 'om {n}d', deleteConfirmTitle: 'Slett intervall?', deleteConfirmBody: '"{name}" slettes permanent.', deleting: 'Sletter…', confirmDelete: 'Ja, slett' },
  cs: { intervalShort: 'každých {n}d', overdueShort: '{days}d po termínu', dueInShort: 'za {n}d', deleteConfirmTitle: 'Smazat interval?', deleteConfirmBody: '"{name}" bude trvale smazán.', deleting: 'Mazání…', confirmDelete: 'Ano, smazat' },
  sk: { intervalShort: 'každých {n}d', overdueShort: '{days}d po termíne', dueInShort: 'za {n}d', deleteConfirmTitle: 'Odstrániť interval?', deleteConfirmBody: '"{name}" bude trvale odstránený.', deleting: 'Odstraňovanie…', confirmDelete: 'Áno, odstrániť' },
  hu: { intervalShort: 'minden {n}n', overdueShort: '{days}n késve', dueInShort: '{n}n múlva', deleteConfirmTitle: 'Törölje az intervallumot?', deleteConfirmBody: '"{name}" véglegesen törlésre kerül.', deleting: 'Törlés…', confirmDelete: 'Igen, törlés' },
  ro: { intervalShort: 'la fiecare {n}z', overdueShort: '{days}z întârziat', dueInShort: 'în {n}z', deleteConfirmTitle: 'Ștergeți intervalul?', deleteConfirmBody: '"{name}" va fi șters permanent.', deleting: 'Se șterge…', confirmDelete: 'Da, ștergeți' },
  bg: { intervalShort: 'всеки {n}д', overdueShort: '{days}д закъснение', dueInShort: 'след {n}д', deleteConfirmTitle: 'Изтриване на интервал?', deleteConfirmBody: '"{name}" ще бъде изтрит завинаги.', deleting: 'Изтриване…', confirmDelete: 'Да, изтрий' },
  el: { intervalShort: 'κάθε {n}η', overdueShort: '{days}η καθυστέρηση', dueInShort: 'σε {n}η', deleteConfirmTitle: 'Διαγραφή διαστήματος;', deleteConfirmBody: 'Το "{name}" θα διαγραφεί μόνιμα.', deleting: 'Διαγραφή…', confirmDelete: 'Ναι, διαγραφή' },
  tr: { intervalShort: 'her {n}g', overdueShort: '{days}g gecikmiş', dueInShort: '{n}g sonra', deleteConfirmTitle: 'Aralık silinsin mi?', deleteConfirmBody: '"{name}" kalıcı olarak silinecek.', deleting: 'Siliniyor…', confirmDelete: 'Evet, sil' },
  ru: { intervalShort: 'каждые {n}д', overdueShort: '{days}д просрочено', dueInShort: 'через {n}д', deleteConfirmTitle: 'Удалить интервал?', deleteConfirmBody: '"{name}" будет удалён навсегда.', deleting: 'Удаление…', confirmDelete: 'Да, удалить' },
  uk: { intervalShort: 'кожні {n}д', overdueShort: '{days}д прострочено', dueInShort: 'через {n}д', deleteConfirmTitle: 'Видалити інтервал?', deleteConfirmBody: '"{name}" буде видалено назавжди.', deleting: 'Видалення…', confirmDelete: 'Так, видалити' },
  ar: { intervalShort: 'كل {n}ي', overdueShort: '{days}ي متأخر', dueInShort: 'خلال {n}ي', deleteConfirmTitle: 'حذف الفترة؟', deleteConfirmBody: 'سيتم حذف "{name}" نهائيًا.', deleting: 'جارٍ الحذف…', confirmDelete: 'نعم، احذف' },
  zh: { intervalShort: '每{n}天', overdueShort: '逾期{days}天', dueInShort: '{n}天后', deleteConfirmTitle: '删除周期？', deleteConfirmBody: '"{name}"将被永久删除。', deleting: '删除中…', confirmDelete: '是，删除' },
  ja: { intervalShort: '{n}日ごと', overdueShort: '{days}日超過', dueInShort: '{n}日後', deleteConfirmTitle: '間隔を削除しますか？', deleteConfirmBody: '"{name}"は完全に削除されます。', deleting: '削除中…', confirmDelete: 'はい、削除' },
  ko: { intervalShort: '{n}일마다', overdueShort: '{days}일 초과', dueInShort: '{n}일 후', deleteConfirmTitle: '간격을 삭제할까요?', deleteConfirmBody: '"{name}"이(가) 영구적으로 삭제됩니다.', deleting: '삭제 중…', confirmDelete: '예, 삭제' },
  th: { intervalShort: 'ทุก {n}วัน', overdueShort: 'เกิน {days}วัน', dueInShort: 'อีก {n}วัน', deleteConfirmTitle: 'ลบช่วงเวลา?', deleteConfirmBody: '"{name}" จะถูกลบอย่างถาวร', deleting: 'กำลังลบ…', confirmDelete: 'ใช่ ลบ' },
  vi: { intervalShort: 'mỗi {n}ng', overdueShort: 'quá hạn {days}ng', dueInShort: 'còn {n}ng', deleteConfirmTitle: 'Xóa khoảng thời gian?', deleteConfirmBody: '"{name}" sẽ bị xóa vĩnh viễn.', deleting: 'Đang xóa…', confirmDelete: 'Có, xóa' },
  id: { intervalShort: 'setiap {n}h', overdueShort: '{days}h terlambat', dueInShort: '{n}h lagi', deleteConfirmTitle: 'Hapus interval?', deleteConfirmBody: '"{name}" akan dihapus secara permanen.', deleting: 'Menghapus…', confirmDelete: 'Ya, hapus' },
}

const messagesDir = 'C:/Users/Simon/Projects/inoid-web/messages'
const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const lang = file.replace('.json', '')
  const t = translations[lang] || translations.en
  const path = `${messagesDir}/${file}`
  const data = JSON.parse(readFileSync(path, 'utf8'))

  if (!data.service) data.service = {}
  if (!data.service.schedules) data.service.schedules = {}

  data.service.schedules.intervalShort = t.intervalShort
  data.service.schedules.overdueShort = t.overdueShort
  data.service.schedules.dueInShort = t.dueInShort
  data.service.schedules.deleteConfirmTitle = t.deleteConfirmTitle
  data.service.schedules.deleteConfirmBody = t.deleteConfirmBody
  data.service.schedules.deleting = t.deleting
  data.service.schedules.confirmDelete = t.confirmDelete

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${file}`)
}
