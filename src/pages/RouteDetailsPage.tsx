import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FareDisplay } from '../components/FareDisplay'
import { VerificationBadge } from '../components/VerificationBadge'
import { useTransportData } from '../data/useTransportData'
import { useLanguage } from '../i18n/useLanguage'
import { findStop, routeDirection, routeName, stopName } from '../lib/display'
import { findFare, findRide } from '../lib/routeSearch'
import type { RouteStop } from '../types/transport'

export function RouteDetailsPage() {
  const { t, language } = useLanguage()
  const data = useTransportData()
  const { routeId } = useParams()
  const [params] = useSearchParams()

  const route = data.routes.find((candidate) => candidate.id === routeId)
  const origin = findStop(data, params.get('from'))
  const destination = findStop(data, params.get('to'))

  if (!route) {
    return (
      <section className="space-y-4">
        <p role="alert">{t('routeNotFound')}</p>
        <Link to="/" className="font-semibold text-brand-700 underline">
          {t('backHome')}
        </Link>
      </section>
    )
  }

  // Only show trip-specific directions if this route really serves the trip.
  const ride = origin && destination ? findRide(route, origin.id, destination.id) : null
  const fare = ride && origin && destination ? findFare(data.fares, route.id, origin.id, destination.id) : null
  const fullRoute = [...route.stops].sort((a, b) => a.sequence - b.sequence)
  const vehicle = t(`vehicle_${route.vehicleType}`)
  const vehicleInSentence = t(`vehicleInSentence_${route.vehicleType}`)
  const backLink = ride ? `/results?${params.toString()}` : '/'

  function stopNote(stop: RouteStop): string | null {
    if (!stop.boardingAllowed && stop.alightingAllowed) return t('noBoarding')
    if (stop.boardingAllowed && !stop.alightingAllowed) return t('noAlighting')
    return null
  }

  function renderStopList(stops: RouteStop[], highlightTrip: boolean) {
    return (
      <ol className="relative space-y-0 border-s-4 border-brand-100 ps-4">
        {stops.map((routeStop, index) => {
          const isBoard = highlightTrip && index === 0
          const isAlight = highlightTrip && index === stops.length - 1
          const note = stopNote(routeStop)
          return (
            <li key={`${routeStop.stopId}-${routeStop.sequence}`} className="relative py-2">
              <span
                aria-hidden="true"
                className={`absolute -start-[1.6rem] top-3.5 h-4 w-4 rounded-full border-2 ${
                  isBoard || isAlight ? 'border-brand-700 bg-brand-700' : 'border-brand-600 bg-white'
                }`}
              />
              <span className="me-2 text-sm text-slate-500">{routeStop.sequence}.</span>
              <span className={isBoard || isAlight ? 'font-bold' : ''}>
                {stopName(findStop(data, routeStop.stopId), language)}
              </span>
              {(isBoard || isAlight) && (
                <span className="ms-2 rounded bg-brand-700 px-1.5 py-0.5 text-xs font-semibold text-white">
                  {isBoard ? t('boardHere') : t('getOffHere')}
                </span>
              )}
              {note && <span className="ms-2 text-xs text-slate-600">({note})</span>}
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <Link to={backLink} className="text-sm font-semibold text-brand-700 underline">
          {ride ? t('backToResults') : t('backHome')}
        </Link>
        <h1 className="text-xl font-bold">
          <span className="me-2 rounded bg-brand-100 px-1.5 text-brand-800">{route.code}</span>
          {routeName(route, language)}
        </h1>
        <VerificationBadge route={route} showDate />
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{vehicle}</span> · {t('directionLabel')}: {routeDirection(route, language)}
        </p>
        {fare && <FareDisplay fare={fare} />}
      </header>

      {ride && origin && destination && (
        <section aria-labelledby="directions-heading" className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 id="directions-heading" className="mb-2 text-lg font-semibold">
            {t('directionsHeading')}
          </h2>
          <ol className="list-decimal space-y-1 ps-5">
            <li>{t('directionsBoard', { vehicle: vehicleInSentence, stop: stopName(origin, language) })}</li>
            <li>{t('directionsCheck', { direction: routeDirection(route, language) })}</li>
            <li>{ride.length - 1 === 1 ? t('directionsRideOne') : t('directionsRideMany', { count: ride.length - 1 })}</li>
            <li>{t('directionsAlight', { stop: stopName(destination, language) })}</li>
          </ol>
        </section>
      )}

      {ride && (
        <section aria-labelledby="trip-stops-heading">
          <h2 id="trip-stops-heading" className="mb-2 text-lg font-semibold">
            {t('tripStopsHeading')}
          </h2>
          {renderStopList(ride, true)}
        </section>
      )}

      <section aria-labelledby="full-route-heading">
        <h2 id="full-route-heading" className="mb-2 text-lg font-semibold">
          {t('fullRouteHeading')}
        </h2>
        {renderStopList(fullRoute, false)}
      </section>

      <p className="text-sm text-slate-600">
        <span className="font-semibold">{t('sourceNotesLabel')}: </span>
        <span dir="auto">{route.sourceNotes}</span>
      </p>

      <Link
        to={`/report?route=${encodeURIComponent(route.id)}`}
        className="flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50"
      >
        <span aria-hidden="true" className="me-2">⚑</span>
        {t('reportLink')}
      </Link>
    </article>
  )
}
