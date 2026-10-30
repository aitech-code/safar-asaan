/*
  All interface text lives here, in both languages.

  English is the "source" list. The Urdu object is typed as
  `Record<TranslationKey, string>`, so TypeScript refuses to build
  if an Urdu translation is missing — you cannot forget one.

  Words in {curly braces} are filled in by the app, e.g. {count}.
*/

export const LANGUAGES = ['en', 'ur'] as const
export type Language = (typeof LANGUAGES)[number]

const en = {
  appName: 'Safar Asaan',
  tagline: 'Find local vans, wagons, minibuses and chingchi routes in Peshawar',
  skipToContent: 'Skip to main content',
  languageLabel: 'Language',
  demoBanner:
    'Prototype: all routes, stops and fares shown are fictional sample data, not real Peshawar transport information.',
  safetyNote: 'Always confirm the route and fare with the driver before you travel.',
  notFoundTitle: 'Page not found',
  backHome: 'Back to home',

  // Search form
  searchHeading: 'Where do you want to go?',
  fromLabel: 'From',
  toLabel: 'To',
  fromPlaceholder: 'Type a neighbourhood or stop',
  toPlaceholder: 'Type a neighbourhood or stop',
  searchButton: 'Find routes',
  swapButton: 'Swap From and To',
  demoHint: 'Demo stops to try: {examples}',
  errEmptyFrom: 'Please enter where you are starting from.',
  errEmptyTo: 'Please enter where you want to go.',
  errTooLong: 'This name is too long. Use 80 characters or fewer.',
  errNotFound: 'No stop called “{query}” is in our list yet. Try another name or choose from the suggestions.',
  errAmbiguous: 'Several stops match “{query}”. Please choose one:',
  errSameStop: 'Starting point and destination are the same stop.',

  // Results
  resultsTitle: '{from} → {to}',
  verifiedRoutesHeading: 'Verified direct routes',
  noVerifiedRoute:
    'No verified direct route was found between these stops. This does not mean there is no transport — our information may be incomplete.',
  notVerifiedHeading: 'Routes not yet verified',
  notVerifiedWarning:
    'The routes below have not been confirmed. Ask the driver or local people before you rely on them.',
  invalidSearch: 'This search link is not valid. Please search again.',
  newSearch: 'New search',
  viewDetails: 'Stops and directions',
  stopsTravelledOne: 'Ride 1 stop',
  stopsTravelledMany: 'Ride {count} stops',

  // Badges and verification
  badgeVerified: 'Verified',
  badgeUnverified: 'Not verified',
  badgeOutdated: 'May be outdated',
  lastVerified: 'Last checked: {date}',
  neverVerified: 'Never checked',
  fictionalTag: 'Fictional demo',

  // Fares
  fareLabel: 'Fare',
  fareAmount: 'Rs {amount}',
  fareNotVerified: 'Fare not verified. Confirm with the driver.',

  // Vehicles
  vehicle_suzuki_van: 'Suzuki van',
  vehicle_wagon: 'Wagon',
  vehicle_minibus: 'Minibus',
  vehicle_chingchi: 'Chingchi',
  // Same vehicles written inside a sentence ("Board the minibus")
  vehicleInSentence_suzuki_van: 'Suzuki van',
  vehicleInSentence_wagon: 'wagon',
  vehicleInSentence_minibus: 'minibus',
  vehicleInSentence_chingchi: 'chingchi',

  // Route details
  directionLabel: 'Direction',
  directionsHeading: 'How to travel',
  directionsBoard: 'Board the {vehicle} at {stop}.',
  directionsCheck: 'Before boarding, ask the driver to confirm the direction: {direction}.',
  directionsRideOne: 'Stay on for 1 stop.',
  directionsRideMany: 'Stay on for {count} stops.',
  directionsAlight: 'Get off at {stop}.',
  tripStopsHeading: 'Stops on your trip',
  fullRouteHeading: 'Full route',
  boardHere: 'Board here',
  getOffHere: 'Get off here',
  noBoarding: 'Drop-off only',
  noAlighting: 'Pick-up only',
  sourceNotesLabel: 'Source notes',
  routeNotFound: 'This route could not be found.',
  backToResults: 'Back to results',

  // Data loading
  loadingRoutes: 'Loading route information…',
  loadError: 'Could not load route information. Please check your internet connection and try again.',
  retry: 'Try again',
  configError: 'The app is not set up correctly. (Administrator: check the .env.local settings.)',
  dataSourceDatabase: 'Data: online database',
  dataSourceSample: 'Data: built-in sample',
  dataSourceCache: 'Data: saved copy from {date}',
  offlineNotice:
    'You are offline or our server cannot be reached. Showing route information saved on {date}. It may be out of date.',

  // Correction reports
  reportLink: 'Report a problem with this route',
  reportMissingLink: 'Know a route we are missing? Tell us',
  reportTitle: 'Report a problem',
  reportAboutRoute: 'About route: {route}',
  reportTypeLabel: 'What is wrong?',
  reportType_wrong_route: 'The route is wrong',
  reportType_wrong_stop: 'A stop is wrong or missing',
  reportType_wrong_fare: 'The fare is wrong',
  reportType_missing_route: 'A route is missing',
  reportType_other: 'Something else',
  reportMessageLabel: 'Please describe the problem',
  reportMessageHint: '5 to 1000 characters. You can write in English or Urdu.',
  reportFareLabel: 'Correct fare in rupees (optional)',
  reportContactLabel: 'Phone or email (optional)',
  reportContactHint: 'Only add this if you are happy for us to contact you about this report.',
  reportPrivacy: 'We do not collect your location. Your report is read only by Safar Asaan administrators.',
  reportSubmit: 'Send report',
  reportSending: 'Sending…',
  reportThanks: 'Thank you! Your report was sent. An administrator will check it.',
  reportAnother: 'Send another report',
  reportFailed: 'Your report could not be sent. Please check your connection and try again.',
  reportDemoMode: 'Demo mode: reports cannot be sent because the app is using built-in sample data.',
  reportCooldown: 'Please wait {seconds} seconds before sending another report.',
  err_typeRequired: 'Please choose what is wrong.',
  err_messageTooShort: 'Please write at least 5 characters.',
  err_messageTooLong: 'Please keep it under 1000 characters.',
  err_fareInvalid: 'Enter a whole number of rupees, for example 50.',
  err_contactTooLong: 'Please keep this under 120 characters.',
}

export type TranslationKey = keyof typeof en

const ur: Record<TranslationKey, string> = {
  appName: 'سفر آسان',
  tagline: 'پشاور میں مقامی وین، ویگن، منی بس اور چنگچی کے راستے تلاش کریں',
  skipToContent: 'مرکزی مواد پر جائیں',
  languageLabel: 'زبان',
  demoBanner:
    'آزمائشی ورژن: یہاں دکھائے گئے تمام راستے، اسٹاپ اور کرائے فرضی نمونہ ڈیٹا ہیں، پشاور ٹرانسپورٹ کی اصل معلومات نہیں۔',
  safetyNote: 'سفر سے پہلے ڈرائیور سے راستہ اور کرایہ ضرور تصدیق کر لیں۔',
  notFoundTitle: 'صفحہ نہیں ملا',
  backHome: 'واپس ہوم پیج پر',

  searchHeading: 'آپ کہاں جانا چاہتے ہیں؟',
  fromLabel: 'کہاں سے',
  toLabel: 'کہاں تک',
  fromPlaceholder: 'علاقے یا اسٹاپ کا نام لکھیں',
  toPlaceholder: 'علاقے یا اسٹاپ کا نام لکھیں',
  searchButton: 'راستے تلاش کریں',
  swapButton: 'کہاں سے اور کہاں تک کو بدلیں',
  demoHint: 'آزمانے کے لیے نمونہ اسٹاپ: {examples}',
  errEmptyFrom: 'براہ کرم لکھیں کہ آپ کہاں سے سفر شروع کر رہے ہیں۔',
  errEmptyTo: 'براہ کرم لکھیں کہ آپ کہاں جانا چاہتے ہیں۔',
  errTooLong: 'یہ نام بہت لمبا ہے۔ زیادہ سے زیادہ 80 حروف استعمال کریں۔',
  errNotFound: '“{query}” نام کا کوئی اسٹاپ ابھی ہماری فہرست میں نہیں ہے۔ کوئی اور نام آزمائیں یا تجاویز میں سے منتخب کریں۔',
  errAmbiguous: '“{query}” سے کئی اسٹاپ ملتے ہیں۔ براہ کرم ایک منتخب کریں:',
  errSameStop: 'روانگی اور منزل ایک ہی اسٹاپ ہیں۔',

  resultsTitle: '{from} ← {to}',
  verifiedRoutesHeading: 'تصدیق شدہ براہ راست راستے',
  noVerifiedRoute:
    'ان اسٹاپس کے درمیان کوئی تصدیق شدہ براہ راست راستہ نہیں ملا۔ اس کا مطلب یہ نہیں کہ یہاں کوئی سواری نہیں چلتی — ہماری معلومات نامکمل ہو سکتی ہیں۔',
  notVerifiedHeading: 'غیر تصدیق شدہ راستے',
  notVerifiedWarning: 'نیچے دیے گئے راستوں کی تصدیق نہیں ہوئی۔ ان پر بھروسہ کرنے سے پہلے ڈرائیور یا مقامی لوگوں سے پوچھ لیں۔',
  invalidSearch: 'یہ تلاش کا لنک درست نہیں۔ براہ کرم دوبارہ تلاش کریں۔',
  newSearch: 'نئی تلاش',
  viewDetails: 'اسٹاپ اور رہنمائی',
  stopsTravelledOne: '1 اسٹاپ کا سفر',
  stopsTravelledMany: '{count} اسٹاپ کا سفر',

  badgeVerified: 'تصدیق شدہ',
  badgeUnverified: 'غیر تصدیق شدہ',
  badgeOutdated: 'شاید پرانی معلومات',
  lastVerified: 'آخری تصدیق: {date}',
  neverVerified: 'کبھی تصدیق نہیں ہوئی',
  fictionalTag: 'فرضی نمونہ',

  fareLabel: 'کرایہ',
  fareAmount: '{amount} روپے',
  fareNotVerified: 'کرایہ تصدیق شدہ نہیں۔ ڈرائیور سے پوچھ لیں۔',

  vehicle_suzuki_van: 'سوزوکی وین',
  vehicle_wagon: 'ویگن',
  vehicle_minibus: 'منی بس',
  vehicle_chingchi: 'چنگچی',
  vehicleInSentence_suzuki_van: 'سوزوکی وین',
  vehicleInSentence_wagon: 'ویگن',
  vehicleInSentence_minibus: 'منی بس',
  vehicleInSentence_chingchi: 'چنگچی',

  directionLabel: 'سمت',
  directionsHeading: 'سفر کیسے کریں',
  directionsBoard: '{stop} سے {vehicle} میں سوار ہوں۔',
  directionsCheck: 'سوار ہونے سے پہلے ڈرائیور سے سمت کی تصدیق کر لیں: {direction}۔',
  directionsRideOne: '1 اسٹاپ تک سوار رہیں۔',
  directionsRideMany: '{count} اسٹاپ تک سوار رہیں۔',
  directionsAlight: '{stop} پر اتر جائیں۔',
  tripStopsHeading: 'آپ کے سفر کے اسٹاپ',
  fullRouteHeading: 'مکمل راستہ',
  boardHere: 'یہاں سوار ہوں',
  getOffHere: 'یہاں اتریں',
  noBoarding: 'صرف اترنے کے لیے',
  noAlighting: 'صرف سوار ہونے کے لیے',
  sourceNotesLabel: 'ماخذ کی تفصیل',
  routeNotFound: 'یہ راستہ نہیں ملا۔',
  backToResults: 'واپس نتائج پر',

  loadingRoutes: 'راستوں کی معلومات لوڈ ہو رہی ہیں…',
  loadError: 'راستوں کی معلومات لوڈ نہیں ہو سکیں۔ براہ کرم انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
  retry: 'دوبارہ کوشش کریں',
  configError: 'ایپ درست طریقے سے سیٹ اپ نہیں ہے۔ (ایڈمنسٹریٹر: ‎.env.local کی ترتیبات چیک کریں۔)',
  dataSourceDatabase: 'ڈیٹا: آن لائن ڈیٹا بیس',
  dataSourceSample: 'ڈیٹا: ایپ میں موجود نمونہ',
  dataSourceCache: 'ڈیٹا: {date} کی محفوظ کاپی',
  offlineNotice:
    'آپ آف لائن ہیں یا ہمارا سرور دستیاب نہیں۔ {date} کو محفوظ کی گئی معلومات دکھائی جا رہی ہیں۔ یہ پرانی ہو سکتی ہیں۔',

  reportLink: 'اس راستے کے بارے میں غلطی کی اطلاع دیں',
  reportMissingLink: 'کوئی راستہ جو ہماری فہرست میں نہیں؟ ہمیں بتائیں',
  reportTitle: 'غلطی کی اطلاع دیں',
  reportAboutRoute: 'راستہ: {route}',
  reportTypeLabel: 'کیا غلط ہے؟',
  reportType_wrong_route: 'راستہ غلط ہے',
  reportType_wrong_stop: 'کوئی اسٹاپ غلط ہے یا موجود نہیں',
  reportType_wrong_fare: 'کرایہ غلط ہے',
  reportType_missing_route: 'کوئی راستہ موجود نہیں',
  reportType_other: 'کچھ اور',
  reportMessageLabel: 'براہ کرم مسئلہ بیان کریں',
  reportMessageHint: '5 سے 1000 حروف۔ آپ اردو یا انگریزی میں لکھ سکتے ہیں۔',
  reportFareLabel: 'درست کرایہ روپوں میں (اختیاری)',
  reportContactLabel: 'فون یا ای میل (اختیاری)',
  reportContactHint: 'یہ صرف تب لکھیں اگر آپ چاہتے ہیں کہ ہم اس اطلاع کے بارے میں آپ سے رابطہ کریں۔',
  reportPrivacy: 'ہم آپ کا مقام (لوکیشن) جمع نہیں کرتے۔ آپ کی اطلاع صرف سفر آسان کے منتظمین پڑھتے ہیں۔',
  reportSubmit: 'اطلاع بھیجیں',
  reportSending: 'بھیجی جا رہی ہے…',
  reportThanks: 'شکریہ! آپ کی اطلاع بھیج دی گئی۔ منتظم اس کی جانچ کریں گے۔',
  reportAnother: 'ایک اور اطلاع بھیجیں',
  reportFailed: 'آپ کی اطلاع نہیں بھیجی جا سکی۔ براہ کرم کنکشن چیک کریں اور دوبارہ کوشش کریں۔',
  reportDemoMode: 'ڈیمو موڈ: اطلاع نہیں بھیجی جا سکتی کیونکہ ایپ نمونہ ڈیٹا استعمال کر رہی ہے۔',
  reportCooldown: 'دوسری اطلاع بھیجنے سے پہلے براہ کرم {seconds} سیکنڈ انتظار کریں۔',
  err_typeRequired: 'براہ کرم منتخب کریں کہ کیا غلط ہے۔',
  err_messageTooShort: 'براہ کرم کم از کم 5 حروف لکھیں۔',
  err_messageTooLong: 'براہ کرم 1000 حروف سے کم رکھیں۔',
  err_fareInvalid: 'روپوں میں پوری رقم لکھیں، مثلاً 50۔',
  err_contactTooLong: 'براہ کرم 120 حروف سے کم رکھیں۔',
}

export const translations: Record<Language, Record<TranslationKey, string>> = { en, ur }

/** Urdu is written right-to-left; English left-to-right. */
export const DIRECTION: Record<Language, 'ltr' | 'rtl'> = { en: 'ltr', ur: 'rtl' }

/** Name of each language written in that language, for the selector. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: 'English', ur: 'اردو' }

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}

/** Replace {name} placeholders with values. Unknown placeholders are left as-is. */
export function fillPlaceholders(text: string, values?: Record<string, string | number>): string {
  if (!values) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  )
}
