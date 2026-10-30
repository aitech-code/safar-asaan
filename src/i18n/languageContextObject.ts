import { createContext } from 'react'
import type { Language, TranslationKey } from './translations'

export interface LanguageContextValue {
  language: Language
  direction: 'ltr' | 'rtl'
  setLanguage: (language: Language) => void
  /** Translate a key; `values` fill {placeholders}. */
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
}

export const LanguageContext = createContext<LanguageContextValue | null>(null)
