import type { Stop } from '../types/transport'

export const MAX_QUERY_LENGTH = 80
const MIN_PARTIAL_LENGTH = 2

/*
  Make text comparable:
  - lower-case, trim, collapse spaces
  - drop punctuation such as - ( ) , .
  - Urdu: phone keyboards sometimes type Arabic letters that look the same
    as Urdu ones (ي/ی, ك/ک, ه/ہ). Map them to the Urdu letter, and remove
    optional vowel marks (zer, zabar, pesh…).
*/
export function normalizeText(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[يى]/g, 'ی') // Arabic yeh -> Urdu yeh
    .replace(/ك/g, 'ک') // Arabic kaf -> Urdu kaf
    .replace(/ه/g, 'ہ') // Arabic heh -> Urdu heh goal
    .replace(/[ً-ٰٟ]/g, '') // vowel marks
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim()
}

function namesOf(stop: Stop): string[] {
  return [stop.nameEn, stop.nameUr, ...stop.aliases].map(normalizeText)
}

export type StopLookup =
  | { status: 'empty' }
  | { status: 'too_long' }
  | { status: 'not_found' }
  | { status: 'found'; stop: Stop }
  | { status: 'ambiguous'; stops: Stop[] }

/**
  Turn what the user typed into a stop.
  Exact name/alias match wins; otherwise a partial match is used
  only if it points to exactly one stop.
*/
export function lookupStop(rawQuery: string, stops: Stop[]): StopLookup {
  const trimmed = rawQuery.trim()
  if (trimmed === '') return { status: 'empty' }
  if (trimmed.length > MAX_QUERY_LENGTH) return { status: 'too_long' }

  const query = normalizeText(trimmed)
  if (query === '') return { status: 'not_found' }

  const exact = stops.filter((stop) => namesOf(stop).includes(query))
  if (exact.length === 1) return { status: 'found', stop: exact[0] }
  if (exact.length > 1) return { status: 'ambiguous', stops: exact }

  if (query.length < MIN_PARTIAL_LENGTH) return { status: 'not_found' }

  const partial = stops.filter((stop) => namesOf(stop).some((name) => name.includes(query)))
  if (partial.length === 1) return { status: 'found', stop: partial[0] }
  if (partial.length > 1) return { status: 'ambiguous', stops: partial }
  return { status: 'not_found' }
}
