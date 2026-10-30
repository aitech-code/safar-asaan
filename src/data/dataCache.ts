import type { TransportData } from '../types/transport'

/*
  Keeps the last successfully downloaded route data on the phone, so the
  app still works with a weak or missing signal. The screen always says
  when the saved copy is being used and how old it is.
*/

const CACHE_KEY = 'safar-asaan:data-cache:v1'
/** Older copies are not used: fares and routes change. */
export const MAX_CACHE_AGE_DAYS = 30

export interface CachedData {
  savedAt: string // ISO timestamp
  data: TransportData
}

/** Minimal storage interface so tests can use a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function looksLikeTransportData(value: unknown): value is TransportData {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    Array.isArray(v.stops) &&
    Array.isArray(v.routes) &&
    Array.isArray(v.fares) &&
    v.routes.every(
      (r) =>
        r && typeof r === 'object' && typeof (r as { id?: unknown }).id === 'string' && Array.isArray((r as { stops?: unknown }).stops),
    )
  )
}

export function saveCache(store: KeyValueStore | null, data: TransportData, now = new Date()): void {
  if (!store) return
  try {
    store.setItem(CACHE_KEY, JSON.stringify({ savedAt: now.toISOString(), data } satisfies CachedData))
  } catch {
    // Storage full or blocked: the app still works online.
  }
}

export function loadCache(store: KeyValueStore | null, now = new Date()): CachedData | null {
  if (!store) return null
  try {
    const raw = store.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const { savedAt, data } = parsed as { savedAt?: unknown; data?: unknown }
    if (typeof savedAt !== 'string' || !looksLikeTransportData(data)) return null
    const saved = new Date(savedAt)
    const ageDays = (now.getTime() - saved.getTime()) / 86_400_000
    if (Number.isNaN(ageDays) || ageDays < 0 || ageDays > MAX_CACHE_AGE_DAYS) return null
    return { savedAt, data }
  } catch {
    return null
  }
}

/** The browser's localStorage, or null if the browser blocks it. */
export function browserStore(): KeyValueStore | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
