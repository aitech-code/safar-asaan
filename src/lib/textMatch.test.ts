import { describe, expect, it } from 'vitest'
import { sampleData } from '../data/sampleData'
import { lookupStop, normalizeText } from './textMatch'

const stops = sampleData.stops

describe('normalizeText', () => {
  it('ignores case, extra spaces and punctuation', () => {
    expect(normalizeText('  Lal-PUL   (demo) ')).toBe('lal pul demo')
  })

  it('maps Arabic keyboard letters to Urdu letters', () => {
    // Arabic kaf (ك) and Arabic yeh (ي) typed instead of Urdu ک and ی
    expect(normalizeText('كہكشاں')).toBe(normalizeText('کہکشاں'))
    expect(normalizeText('چوكي')).toBe(normalizeText('چوکی'))
  })
})

describe('lookupStop', () => {
  it('rejects empty input', () => {
    expect(lookupStop('   ', stops)).toEqual({ status: 'empty' })
  })

  it('rejects very long input', () => {
    expect(lookupStop('a'.repeat(81), stops)).toEqual({ status: 'too_long' })
  })

  it('treats punctuation-only input as not found', () => {
    expect(lookupStop('!!!', stops)).toEqual({ status: 'not_found' })
  })

  it('finds a stop by full English name', () => {
    expect(lookupStop('Sitara Chowk (demo)', stops)).toMatchObject({ status: 'found', stop: { id: 'stop-sitara' } })
  })

  it('finds a stop by partial name', () => {
    expect(lookupStop('sitara', stops)).toMatchObject({ status: 'found', stop: { id: 'stop-sitara' } })
  })

  it('finds a stop by Urdu name', () => {
    expect(lookupStop('لال پل', stops)).toMatchObject({ status: 'found', stop: { id: 'stop-lalpul' } })
  })

  it('finds a stop by alias', () => {
    expect(lookupStop('red bridge', stops)).toMatchObject({ status: 'found', stop: { id: 'stop-lalpul' } })
  })

  it('reports ambiguity instead of guessing', () => {
    // "ma" appears in several names (Sabz Mandi, Noor Market, Chashma Road)
    const result = lookupStop('ma', stops)
    expect(result.status).toBe('ambiguous')
    if (result.status === 'ambiguous') expect(result.stops.length).toBeGreaterThan(1)
  })

  it('does not match real place names that are not in the data', () => {
    expect(lookupStop('Hayatabad', stops)).toEqual({ status: 'not_found' })
  })
})
