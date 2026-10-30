import { createContext } from 'react'
import type { TransportData } from '../types/transport'

export type TransportDataState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'config_error' }
  | { status: 'ready'; data: TransportData; source: 'database' | 'sample' }
  /** Offline: showing the last saved copy (savedAt = ISO time it was downloaded). */
  | { status: 'ready'; data: TransportData; source: 'cache'; savedAt: string }

export interface TransportDataContextValue {
  state: TransportDataState
  retry: () => void
}

export const TransportDataContext = createContext<TransportDataContextValue | null>(null)
