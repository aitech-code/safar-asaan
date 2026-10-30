import { Link, Outlet } from 'react-router-dom'
import { useLanguage } from '../i18n/useLanguage'
import { formatDateTime } from '../lib/display'
import { useTransportDataState } from '../data/useTransportData'
import { DataGate } from './DataGate'
import { DemoDataBanner } from './DemoDataBanner'
import { LanguageSwitcher } from './LanguageSwitcher'

/** Shared frame for every page: header, sample-data warning, content, footer. */
export function Layout() {
  const { t, language } = useLanguage()
  const { state } = useTransportDataState()

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2"
      >
        {t('skipToContent')}
      </a>

      <header className="bg-brand-700 text-white">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <img src="/favicon.svg" alt="" width={32} height={32} />
            <span>{t('appName')}</span>
          </Link>
          <LanguageSwitcher />
        </div>
        {/* Inside <header> so screen readers find it in the page's top section. */}
        <DemoDataBanner />
      </header>

      <main id="main" className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <DataGate>
          <Outlet />
        </DataGate>
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 text-center text-sm text-slate-600">
        <p className="mx-auto max-w-xl">{t('safetyNote')}</p>
        {state.status === 'ready' && (
          <p className="mt-1 text-xs text-slate-600">
            {state.source === 'database'
              ? t('dataSourceDatabase')
              : state.source === 'cache'
                ? t('dataSourceCache', { date: formatDateTime(state.savedAt, language) })
                : t('dataSourceSample')}
          </p>
        )}
      </footer>
    </div>
  )
}
