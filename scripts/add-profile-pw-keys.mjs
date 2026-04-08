import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: { minChars: 'Mindestens 8 Zeichen', confirmPassword: 'Passwort bestätigen', pwTooShort: 'Passwort muss mindestens 8 Zeichen haben.', pwMismatch: 'Passwörter stimmen nicht überein.' },
  en: { minChars: 'At least 8 characters', confirmPassword: 'Confirm password', pwTooShort: 'Password must be at least 8 characters.', pwMismatch: 'Passwords do not match.' },
  fr: { minChars: 'Au moins 8 caractères', confirmPassword: 'Confirmer le mot de passe', pwTooShort: 'Le mot de passe doit comporter au moins 8 caractères.', pwMismatch: 'Les mots de passe ne correspondent pas.' },
  es: { minChars: 'Mínimo 8 caracteres', confirmPassword: 'Confirmar contraseña', pwTooShort: 'La contraseña debe tener al menos 8 caracteres.', pwMismatch: 'Las contraseñas no coinciden.' },
  it: { minChars: 'Almeno 8 caratteri', confirmPassword: 'Conferma password', pwTooShort: 'La password deve avere almeno 8 caratteri.', pwMismatch: 'Le password non corrispondono.' },
  pt: { minChars: 'Mínimo 8 caracteres', confirmPassword: 'Confirmar senha', pwTooShort: 'A senha deve ter pelo menos 8 caracteres.', pwMismatch: 'As senhas não coincidem.' },
  nl: { minChars: 'Minimaal 8 tekens', confirmPassword: 'Wachtwoord bevestigen', pwTooShort: 'Wachtwoord moet minimaal 8 tekens hebben.', pwMismatch: 'Wachtwoorden komen niet overeen.' },
  pl: { minChars: 'Minimum 8 znaków', confirmPassword: 'Potwierdź hasło', pwTooShort: 'Hasło musi mieć co najmniej 8 znaków.', pwMismatch: 'Hasła nie są zgodne.' },
  tr: { minChars: 'En az 8 karakter', confirmPassword: 'Şifreyi onayla', pwTooShort: 'Şifre en az 8 karakter olmalıdır.', pwMismatch: 'Şifreler eşleşmiyor.' },
  ru: { minChars: 'Не менее 8 символов', confirmPassword: 'Подтвердите пароль', pwTooShort: 'Пароль должен содержать не менее 8 символов.', pwMismatch: 'Пароли не совпадают.' },
  uk: { minChars: 'Не менше 8 символів', confirmPassword: 'Підтвердіть пароль', pwTooShort: 'Пароль повинен містити не менше 8 символів.', pwMismatch: 'Паролі не збігаються.' },
  bg: { minChars: 'Поне 8 символа', confirmPassword: 'Потвърдете паролата', pwTooShort: 'Паролата трябва да има поне 8 символа.', pwMismatch: 'Паролите не съвпадат.' },
  ro: { minChars: 'Minim 8 caractere', confirmPassword: 'Confirmă parola', pwTooShort: 'Parola trebuie să aibă cel puțin 8 caractere.', pwMismatch: 'Parolele nu se potrivesc.' },
  cs: { minChars: 'Alespoň 8 znaků', confirmPassword: 'Potvrdit heslo', pwTooShort: 'Heslo musí mít alespoň 8 znaků.', pwMismatch: 'Hesla se neshodují.' },
  sk: { minChars: 'Aspoň 8 znakov', confirmPassword: 'Potvrdiť heslo', pwTooShort: 'Heslo musí mať aspoň 8 znakov.', pwMismatch: 'Heslá sa nezhodujú.' },
  hu: { minChars: 'Legalább 8 karakter', confirmPassword: 'Jelszó megerősítése', pwTooShort: 'A jelszónak legalább 8 karakternek kell lennie.', pwMismatch: 'A jelszavak nem egyeznek.' },
  hr: { minChars: 'Najmanje 8 znakova', confirmPassword: 'Potvrdi lozinku', pwTooShort: 'Lozinka mora imati najmanje 8 znakova.', pwMismatch: 'Lozinke se ne podudaraju.' },
  sr: { minChars: 'Najmanje 8 znakova', confirmPassword: 'Potvrdi lozinku', pwTooShort: 'Lozinka mora imati najmanje 8 znakova.', pwMismatch: 'Lozinke se ne podudaraju.' },
  el: { minChars: 'Τουλάχιστον 8 χαρακτήρες', confirmPassword: 'Επιβεβαίωση κωδικού', pwTooShort: 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.', pwMismatch: 'Οι κωδικοί δεν ταιριάζουν.' },
  fi: { minChars: 'Vähintään 8 merkkiä', confirmPassword: 'Vahvista salasana', pwTooShort: 'Salasanan on oltava vähintään 8 merkkiä pitkä.', pwMismatch: 'Salasanat eivät täsmää.' },
  sv: { minChars: 'Minst 8 tecken', confirmPassword: 'Bekräfta lösenord', pwTooShort: 'Lösenordet måste ha minst 8 tecken.', pwMismatch: 'Lösenorden stämmer inte överens.' },
  da: { minChars: 'Mindst 8 tegn', confirmPassword: 'Bekræft adgangskode', pwTooShort: 'Adgangskoden skal have mindst 8 tegn.', pwMismatch: 'Adgangskoderne stemmer ikke overens.' },
  no: { minChars: 'Minst 8 tegn', confirmPassword: 'Bekreft passord', pwTooShort: 'Passordet må ha minst 8 tegn.', pwMismatch: 'Passordene stemmer ikke overens.' },
  lt: { minChars: 'Mažiausiai 8 simboliai', confirmPassword: 'Patvirtinti slaptažodį', pwTooShort: 'Slaptažodis turi būti bent 8 simbolių.', pwMismatch: 'Slaptažodžiai nesutampa.' },
  lv: { minChars: 'Vismaz 8 simboli', confirmPassword: 'Apstiprināt paroli', pwTooShort: 'Parolei jābūt vismaz 8 simboliem.', pwMismatch: 'Paroles nesakrīt.' },
  et: { minChars: 'Vähemalt 8 märki', confirmPassword: 'Kinnita salasõna', pwTooShort: 'Parool peab olema vähemalt 8 märki pikk.', pwMismatch: 'Salasõnad ei ühti.' },
  ja: { minChars: '8文字以上', confirmPassword: 'パスワード確認', pwTooShort: 'パスワードは8文字以上必要です。', pwMismatch: 'パスワードが一致しません。' },
  zh: { minChars: '至少8个字符', confirmPassword: '确认密码', pwTooShort: '密码至少需要8个字符。', pwMismatch: '密码不匹配。' },
}

for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en
  if (!data.settings) data.settings = {}
  if (!data.settings.profile) data.settings.profile = {}
  data.settings.profile.minChars = k.minChars
  data.settings.profile.confirmPassword = k.confirmPassword
  data.settings.profile.pwTooShort = k.pwTooShort
  data.settings.profile.pwMismatch = k.pwMismatch
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
