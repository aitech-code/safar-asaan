import type { Language } from '../i18n/translations'
import type { Route, Stop, TransportData } from '../types/transport'

export function stopName(stop: Stop | undefined, language: Language): string {
  if (!stop) return '?'
  return language === 'ur' ? stop.nameUr : stop.nameEn
}

export function routeName(route: Route, language: Language): string {
  return language === 'ur' ? route.nameUr : route.nameEn
}

export function routeDirection(route: Route, language: Language): string {
  return language === 'ur' ? route.directionUr : route.directionEn
}

export function findStop(data: TransportData, id: string | null): Stop | undefined {
  if (!id) return undefined
  return data.stops.find((stop) => stop.id === id)
}

/** "2026-10-01" -> "1 Oct 2026" (English) or the Urdu equivalent. */
export function formatDate(isoDate: string, language: Language): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** "2026-10-30T09:33:07Z" -> "30 Oct 2026, 2:33 pm" in the phone's own time zone. */
export function formatDateTime(isoTimestamp: string, language: Language): string {
  const date = new Date(isoTimestamp)
  if (Number.isNaN(date.getTime())) return isoTimestamp
  return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
