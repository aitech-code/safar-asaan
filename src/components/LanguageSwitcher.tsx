import { useLanguage } from '../i18n/useLanguage'
import { LANGUAGES, LANGUAGE_NAMES } from '../i18n/translations'

/** Two large buttons (easy to tap on small phones) instead of a dropdown. */
export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div role="group" aria-label={t('languageLabel')} className="flex gap-1 rounded-lg bg-brand-800 p-1">
      {LANGUAGES.map((code) => {
        const active = code === language
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            onClick={() => setLanguage(code)}
            className={
              'min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ' +
              (active ? 'bg-white text-brand-800' : 'text-white hover:bg-brand-700')
            }
          >
            {LANGUAGE_NAMES[code]}
          </button>
        )
      })}
    </div>
  )
}
