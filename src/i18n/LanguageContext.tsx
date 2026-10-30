import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LanguageContext, type LanguageContextValue } from './languageContextObject'
import { DIRECTION, fillPlaceholders, isLanguage, translations, type Language } from './translations'

const STORAGE_KEY = 'safar-asaan:language'

/** Read the saved choice. Browser storage can be blocked, so never let it crash the app. */
function readSavedLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isLanguage(saved)) return saved
  } catch {
    // Storage unavailable (private mode, blocked cookies): fall back to English.
  }
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readSavedLanguage)
  const direction = DIRECTION[language]

  // Keep <html lang> and <html dir> in sync. Setting dir="rtl" on <html>
  // flips the whole layout for Urdu, and screen readers use `lang`.
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = direction
  }, [language, direction])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not saved; the choice still works for this visit.
    }
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      direction,
      setLanguage,
      t: (key, values) => fillPlaceholders(translations[language][key], values),
    }),
    [language, direction, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
