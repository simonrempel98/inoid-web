import { readFileSync, writeFileSync } from 'fs'

const locales = ['de','en','fr','es','it','pt','nl','pl','tr','ru','uk','bg','ro','cs','sk','hu','hr','sr','el','fi','sv','da','no','lt','lv','et','ja','zh']

const KEYS = {
  de: {
    scanCameraLabel: 'Kamera {n}',
    scanCameraError: 'Kamera konnte nicht gestartet werden',
    scanPermDeniedTitle: 'Kamerazugriff verweigert',
    scanPermDeniedHint: 'Bitte erlaube den Kamerazugriff in den Browser-Einstellungen und lade die Seite neu.',
    scanReload: 'Neu laden',
    scanHint: 'Richte die Kamera auf einen INOid QR-Code',
    orgTitle: 'Organisation',
  },
  en: {
    scanCameraLabel: 'Camera {n}',
    scanCameraError: 'Could not start camera',
    scanPermDeniedTitle: 'Camera access denied',
    scanPermDeniedHint: 'Please allow camera access in browser settings and reload the page.',
    scanReload: 'Reload',
    scanHint: 'Point the camera at an INOid QR code',
    orgTitle: 'Organisation',
  },
  fr: {
    scanCameraLabel: 'Caméra {n}',
    scanCameraError: 'Impossible de démarrer la caméra',
    scanPermDeniedTitle: 'Accès caméra refusé',
    scanPermDeniedHint: 'Veuillez autoriser l\'accès à la caméra dans les paramètres du navigateur et recharger la page.',
    scanReload: 'Recharger',
    scanHint: 'Pointez la caméra sur un code QR INOid',
    orgTitle: 'Organisation',
  },
  es: {
    scanCameraLabel: 'Cámara {n}',
    scanCameraError: 'No se pudo iniciar la cámara',
    scanPermDeniedTitle: 'Acceso a la cámara denegado',
    scanPermDeniedHint: 'Por favor, permite el acceso a la cámara en la configuración del navegador y recarga la página.',
    scanReload: 'Recargar',
    scanHint: 'Apunta la cámara a un código QR de INOid',
    orgTitle: 'Organización',
  },
  it: {
    scanCameraLabel: 'Fotocamera {n}',
    scanCameraError: 'Impossibile avviare la fotocamera',
    scanPermDeniedTitle: 'Accesso fotocamera negato',
    scanPermDeniedHint: 'Consenti l\'accesso alla fotocamera nelle impostazioni del browser e ricarica la pagina.',
    scanReload: 'Ricarica',
    scanHint: 'Punta la fotocamera su un codice QR INOid',
    orgTitle: 'Organizzazione',
  },
  pt: {
    scanCameraLabel: 'Câmera {n}',
    scanCameraError: 'Não foi possível iniciar a câmera',
    scanPermDeniedTitle: 'Acesso à câmera negado',
    scanPermDeniedHint: 'Permita o acesso à câmera nas configurações do navegador e recarregue a página.',
    scanReload: 'Recarregar',
    scanHint: 'Aponte a câmera para um código QR INOid',
    orgTitle: 'Organização',
  },
  nl: {
    scanCameraLabel: 'Camera {n}',
    scanCameraError: 'Kan camera niet starten',
    scanPermDeniedTitle: 'Cameratoegang geweigerd',
    scanPermDeniedHint: 'Sta cameratoegang toe in de browserinstellingen en herlaad de pagina.',
    scanReload: 'Herladen',
    scanHint: 'Richt de camera op een INOid QR-code',
    orgTitle: 'Organisatie',
  },
  pl: {
    scanCameraLabel: 'Kamera {n}',
    scanCameraError: 'Nie można uruchomić kamery',
    scanPermDeniedTitle: 'Dostęp do kamery odrzucony',
    scanPermDeniedHint: 'Zezwól na dostęp do kamery w ustawieniach przeglądarki i odśwież stronę.',
    scanReload: 'Odśwież',
    scanHint: 'Skieruj kamerę na kod QR INOid',
    orgTitle: 'Organizacja',
  },
  tr: {
    scanCameraLabel: 'Kamera {n}',
    scanCameraError: 'Kamera başlatılamadı',
    scanPermDeniedTitle: 'Kamera erişimi reddedildi',
    scanPermDeniedHint: 'Tarayıcı ayarlarından kamera erişimine izin verin ve sayfayı yenileyin.',
    scanReload: 'Yenile',
    scanHint: 'Kamerayı bir INOid QR koduna yöneltin',
    orgTitle: 'Organizasyon',
  },
  ru: {
    scanCameraLabel: 'Камера {n}',
    scanCameraError: 'Не удалось запустить камеру',
    scanPermDeniedTitle: 'Доступ к камере запрещён',
    scanPermDeniedHint: 'Разрешите доступ к камере в настройках браузера и перезагрузите страницу.',
    scanReload: 'Обновить',
    scanHint: 'Наведите камеру на QR-код INOid',
    orgTitle: 'Организация',
  },
  uk: {
    scanCameraLabel: 'Камера {n}',
    scanCameraError: 'Не вдалося запустити камеру',
    scanPermDeniedTitle: 'Доступ до камери заборонено',
    scanPermDeniedHint: 'Дозвольте доступ до камери в налаштуваннях браузера та перезавантажте сторінку.',
    scanReload: 'Оновити',
    scanHint: 'Наведіть камеру на QR-код INOid',
    orgTitle: 'Організація',
  },
}

// Default to English for unlisted locales
for (const locale of locales) {
  const path = `messages/${locale}.json`
  const data = JSON.parse(readFileSync(path, 'utf8'))
  const k = KEYS[locale] || KEYS.en
  if (!data.scan) data.scan = {}
  data.scan.cameraLabel = k.scanCameraLabel
  data.scan.cameraError = k.scanCameraError
  data.scan.permDeniedTitle = k.scanPermDeniedTitle
  data.scan.permDeniedHint = k.scanPermDeniedHint
  data.scan.reload = k.scanReload
  data.scan.hint = k.scanHint
  if (!data.organisation) data.organisation = {}
  data.organisation.title = k.orgTitle
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`Updated ${locale}`)
}
