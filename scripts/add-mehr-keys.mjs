import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: { help: 'Hilfe' },
  en: { help: 'Help' },
  fr: { help: 'Aide' },
  es: { help: 'Ayuda' },
  it: { help: 'Aiuto' },
  pt: { help: 'Ajuda' },
  nl: { help: 'Help' },
  pl: { help: 'Pomoc' },
  tr: { help: 'Yardım' },
  ru: { help: 'Помощь' },
  uk: { help: 'Допомога' },
  bg: { help: 'Помощ' },
  ro: { help: 'Ajutor' },
  cs: { help: 'Nápověda' },
  sk: { help: 'Pomoc' },
  hu: { help: 'Súgó' },
  hr: { help: 'Pomoć' },
  sr: { help: 'Помоћ' },
  el: { help: 'Βοήθεια' },
  fi: { help: 'Ohje' },
  sv: { help: 'Hjälp' },
  da: { help: 'Hjælp' },
  no: { help: 'Hjelp' },
  lt: { help: 'Pagalba' },
  lv: { help: 'Palīdzība' },
  et: { help: 'Abi' },
  ja: { help: 'ヘルプ' },
  zh: { help: '帮助' },
}

for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en
  if (!data.mehr) data.mehr = {}
  data.mehr.help = k.help
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
