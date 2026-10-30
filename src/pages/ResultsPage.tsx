import { Link, useSearchParams } from 'react-router-dom'
import { FareDisplay } from '../components/FareDisplay'
import { VerificationBadge } from '../components/VerificationBadge'
import { useTransportData } from '../data/useTransportData'
import { useLanguage } from '../i18n/useLanguage'
import { findStop, routeDirection, routeName, stopName } from '../lib/display'
import { findDirectRoutes, type DirectRouteResult } from '../lib/routeSearch'

export function ResultsPage() {
  const { t, language } = useLanguage()
  const data = useTransportData()
  const [params] = useSearchParams()

  const fromId = params.get('from')
  const toId = params.get('to')
  const origin = findStop(data, fromId)
  const destination = findStop(data, toId)
  const searchQuery = `from=${encodeURIComponent(fromId ?? '')}&to=${encodeURIComponent(toId ?? '')}`

  const newSearchLink = (
    <Link to={`/?${searchQuery}`} className="font-semibold text-brand-700 underline">
      {t('newSearch')}
    </Link>
  )

  // Hand-typed or broken links: don't crash, explain.
  if (!origin || !destination || origin.id === destination.id) {
    return (
      <section className="space-y-4">
        <p role="alert">{t('invalidSearch')}</p>
        <Link to="/" className="font-semibold text-brand-700 underline">
          {t('newSearch')}
        </Link>
      </section>
    )
  }

  const results = findDirectRoutes(data, origin.id, destination.id)

  function renderCard(result: DirectRouteResult) {
    const { route } = result
    return (
      <li key={route.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-bold">
            <span className="me-2 rounded bg-brand-100 px-1.5 text-brand-800">{route.code}</span>
            {routeName(route, language)}
          </h3>
        </div>
        <VerificationBadge route={route} />
        <dl className="mt-3 space-y-1 text-sm text-slate-700">
          <div>
            <dt className="inline font-semibold">{t(`vehicle_${route.vehicleType}`)}</dt>
            <dd className="inline"> · {result.stopsTravelled === 1 ? t('stopsTravelledOne') : t('stopsTravelledMany', { count: result.stopsTravelled })}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">{t('directionLabel')}: </dt>
            <dd className="inline">{routeDirection(route, language)}</dd>
          </div>
        </dl>
        <div className="mt-2">
          <FareDisplay fare={result.fare} />
        </div>
        <Link
          to={`/route/${encodeURIComponent(route.id)}?${searchQuery}`}
          className="mt-3 flex min-h-11 items-center justify-center rounded-lg border border-brand-700 font-semibold text-brand-800 hover:bg-brand-50"
        >
          {t('viewDetails')}
        </Link>
      </li>
    )
  }

  return (
    <section className="space-y-6" aria-labelledby="results-heading">
      <div className="space-y-2">
        <h1 id="results-heading" className="text-xl font-bold">
          {t('resultsTitle', { from: stopName(origin, language), to: stopName(destination, language) })}
        </h1>
        {newSearchLink}
      </div>

      <section aria-labelledby="verified-heading" className="space-y-3">
        <h2 id="verified-heading" className="text-lg font-semibold">
          {t('verifiedRoutesHeading')}
        </h2>
        {results.verified.length > 0 ? (
          <ul className="space-y-3">{results.verified.map(renderCard)}</ul>
        ) : (
          <div role="status" className="space-y-2 rounded-lg bg-slate-100 p-4 text-slate-800">
            <p>{t('noVerifiedRoute')}</p>
            <Link to="/report?type=missing_route" className="inline-block font-semibold text-brand-700 underline">
              {t('reportMissingLink')}
            </Link>
          </div>
        )}
      </section>

      {results.notVerified.length > 0 && (
        <section aria-labelledby="unverified-heading" className="space-y-3">
          <h2 id="unverified-heading" className="text-lg font-semibold">
            {t('notVerifiedHeading')}
          </h2>
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {t('notVerifiedWarning')}
          </p>
          <ul className="space-y-3">{results.notVerified.map(renderCard)}</ul>
        </section>
      )}
    </section>
  )
}
