import { describe, expect, it } from 'vitest'
import { DIRECTION, LANGUAGES, fillPlaceholders, isLanguage, translations } from './translations'

describe('translations', () => {
  it('has the same keys in every language', () => {
    const englishKeys = Object.keys(translations.en).sort()
    for (const language of LANGUAGES) {
      expect(Object.keys(translations[language]).sort()).toEqual(englishKeys)
    }
  })

  it('has no empty strings', () => {
    for (const language of LANGUAGES) {
      for (const [key, text] of Object.entries(translations[language])) {
        expect(text.trim(), `${language}.${key} is empty`).not.toBe('')
      }
    }
  })

  it('Urdu text actually contains Urdu script', () => {
    const arabicScript = /[؀-ۿ]/
    for (const [key, text] of Object.entries(translations.ur)) {
      const words = text.replace(/\{\w+\}/g, '')
      if (!/\p{L}/u.test(words)) continue // symbols/placeholders only, e.g. '{from} ← {to}'
      expect(arabicScript.test(words), `ur.${key} has no Urdu characters`).toBe(true)
    }
  })

  it('uses right-to-left only for Urdu', () => {
    expect(DIRECTION.en).toBe('ltr')
    expect(DIRECTION.ur).toBe('rtl')
  })

  it('rejects unknown language codes', () => {
    expect(isLanguage('ur')).toBe(true)
    expect(isLanguage('fr')).toBe(false)
    expect(isLanguage(null)).toBe(false)
  })

  it('uses the same {placeholders} in both languages', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()
    for (const key of Object.keys(translations.en) as (keyof typeof translations.en)[]) {
      expect(placeholders(translations.ur[key]), key).toEqual(placeholders(translations.en[key]))
    }
  })

  it('fills placeholders and leaves unknown ones alone', () => {
    expect(fillPlaceholders('Rs {amount}', { amount: 50 })).toBe('Rs 50')
    expect(fillPlaceholders('{a} and {b}', { a: 'x' })).toBe('x and {b}')
  })
})
