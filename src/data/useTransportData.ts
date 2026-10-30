import { useContext } from 'react'
import type { TransportData } from '../types/transport'
import { TransportDataContext, type TransportDataContextValue } from './transportDataContext'

export function useTransportDataState(): TransportDataContextValue {
  const context = useContext(TransportDataContext)
  if (!context) throw new Error('useTransportDataState must be used inside <TransportDataProvider>')
  return context
}

/**
  Data for the screens. Pages are only shown once data is ready
  (see DataGate), so screens never have to handle "loading".
*/
export function useTransportData(): TransportData {
  const { state } = useTransportDataState()
  if (state.status !== 'ready') throw new Error('useTransportData used before data was ready')
  return state.data
}
