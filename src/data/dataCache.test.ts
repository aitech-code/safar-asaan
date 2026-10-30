import { describe, expect, it } from 'vitest'
import { sampleData } from './sampleData'
import { loadCache, saveCache, type KeyValueStore } from './dataCache'

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) }
}

const day = 86_400_000

describe('offline data cache', () => {
  it('saves and loads the last good data', () => {
    const store = memoryStore()
    const saved = new Date('2026-10-01T10:00:00Z')
    saveCache(store, sampleData, saved)
    const loaded = loadCache(store, new Date(saved.getTime() + day))
    expect(loaded?.savedAt).toBe(saved.toISOString())
    expect(loaded?.data.routes).toHaveLength(sampleData.routes.length)
  })

  it('ignores copies older than 30 days', () => {
    const store = memoryStore()
    const saved = new Date('2026-09-01T00:00:00Z')
    saveCache(store, sampleData, saved)
    expect(loadCache(store, new Date(saved.getTime() + 31 * day))).toBeNull()
  })

  it('ignores copies "from the future" (wrong phone clock)', () => {
    const store = memoryStore()
    saveCache(store, sampleData, new Date('2026-12-01T00:00:00Z'))
    expect(loadCache(store, new Date('2026-10-01T00:00:00Z'))).toBeNull()
  })

  it('ignores damaged or unexpected content', () => {
    const store = memoryStore()
    store.setItem('safar-asaan:data-cache:v1', '{not json')
    expect(loadCache(store)).toBeNull()
    store.setItem('safar-asaan:data-cache:v1', JSON.stringify({ savedAt: new Date().toISOString(), data: { routes: 'x' } }))
    expect(loadCache(store)).toBeNull()
  })

  it('works when storage is unavailable', () => {
    expect(loadCache(null)).toBeNull()
    expect(() => saveCache(null, sampleData)).not.toThrow()
    const failing: KeyValueStore = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('full')
      },
    }
    expect(loadCache(failing)).toBeNull()
    expect(() => saveCache(failing, sampleData)).not.toThrow()
  })
})
