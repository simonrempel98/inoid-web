import { readFileSync, writeFileSync, readdirSync } from 'fs'

const translations = {
  de: 'Rollen & Rechte', en: 'Roles & Permissions', fr: 'Rôles & Droits',
  es: 'Roles y Permisos', it: 'Ruoli & Permessi', pt: 'Funções & Permissões',
  nl: 'Rollen & Rechten', pl: 'Role i Uprawnienia', sv: 'Roller & Behörigheter',
  da: 'Roller & Tilladelser', fi: 'Roolit & Oikeudet', nb: 'Roller & Tillatelser',
  cs: 'Role & Oprávnění', sk: 'Role & Oprávnenia', hu: 'Szerepek & Jogosultságok',
  ro: 'Roluri & Permisiuni', bg: 'Роли & Права', el: 'Ρόλοι & Δικαιώματα',
  tr: 'Roller & İzinler', ru: 'Роли & Права', uk: 'Ролі & Права',
  ar: 'الأدوار والصلاحيات', zh: '角色与权限', ja: 'ロールと権限',
  ko: '역할 및 권한', th: 'บทบาทและสิทธิ์', vi: 'Vai trò & Quyền hạn',
  id: 'Peran & Izin',
}

const messagesDir = 'C:/Users/Simon/Projects/inoid-web/messages'
const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'))

for (const file of files) {
  const lang = file.replace('.json', '')
  const path = `${messagesDir}/${file}`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  if (!data.nav) data.nav = {}
  data.nav.roles = translations[lang] || translations.en
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
}
console.log('Done')
