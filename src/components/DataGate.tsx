import type { ReactNode } from 'react'
import { useTransportDataState } from '../data/useTransportData'
import { useLanguage } from '../i18n/useLanguage'
import { formatDateTime } from '../lib/display'

/** Shows loading / error messages until route data is available. */
export function DataGate({ children }: { children: ReactNode }) {
  const { state, retry } = useTransportDataState()
  const { t, language } = useLanguage()

  if (state.status === 'loading') {
    return (
      <p role="status" aria-live="polite" className="py-10 text-center text-slate-600">
        <span aria-hidden="true" className="me-2 inline-block animate-spin">⟳</span>
        {t('loadingRoutes')}
      </p>
    )
  }

  if (state.status === 'error') {
    return (
      <div role="alert" className="space-y-3 rounded-xl bg-white p-4 text-center ring-1 ring-red-200">
        <p className="text-red-800">{t('loadError')}</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-lg bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  if (state.status === 'config_error') {
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800 ring-1 ring-red-200">
        {t('configError')}
      </p>
    )
  }

  if (state.source === 'cache') {
    return (
      <>
        <div role="status" className="mb-4 space-y-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-300">
          <p>{t('offlineNotice', { date: formatDateTime(state.savedAt, language) })}</p>
          <button type="button" onClick={retry} className="min-h-10 font-semibold text-brand-800 underline">
            {t('retry')}
          </button>
        </div>
        {children}
      </>
    )
  }

  return <>{children}</>
}
