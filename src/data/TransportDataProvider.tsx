import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { publicDb, supabaseConfig } from '../lib/supabaseClient'
import type { TransportData } from '../types/transport'
import { browserStore, loadCache, saveCache } from './dataCache'
import { sampleData } from './sampleData'
import { loadTransportData, type QueryClient } from './supabaseData'
import { TransportDataContext, type TransportDataState } from './transportDataContext'

const config = supabaseConfig

export function TransportDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TransportDataState>(() =>
    config.status === 'ok'
      ? { status: 'loading' }
      : config.status === 'invalid'
        ? { status: 'config_error' }
        : { status: 'ready', data: sampleData, source: 'sample' },
  )
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!publicDb) return
    let cancelled = false
    loadTransportData(publicDb as unknown as QueryClient)
      .then((data: TransportData) => {
        if (cancelled) return
        saveCache(browserStore(), data)
        setState({ status: 'ready', data, source: 'database' })
      })
      .catch((error: unknown) => {
        console.error('Safar Asaan: could not load route data', error)
        if (cancelled) return
        // Fall back to the last saved copy, clearly labelled, if there is one.
        const cached = loadCache(browserStore())
        setState(cached ? { status: 'ready', data: cached.data, source: 'cache', savedAt: cached.savedAt } : { status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  // When the phone reconnects, refresh automatically if we were showing
  // an error or the saved offline copy.
  const needsRefresh = state.status === 'error' || (state.status === 'ready' && state.source === 'cache')
  useEffect(() => {
    if (!needsRefresh) return
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
  }, [needsRefresh, retry])

    const value = useMemo(() => ({ state, retry }), [state, retry])
  return <TransportDataContext.Provider value={value}>{children}</TransportDataContext.Provider>
}
