import { useContext } from 'react'
import { LanguageContext } from './languageContextObject'

/** Use inside any component: `const { t, language } = useLanguage()` */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside <LanguageProvider>')
  }
  return context
}
