import type { Route, RouteFare, RouteStop, TransportData } from '../types/transport'

export type FareInfo =
  | { status: 'verified'; amountPkr: number; verifiedAt: string | null }
  | { status: 'not_verified' }

export interface DirectRouteResult {
  route: Route
  /** Stops from boarding to destination, inclusive, in travel order. */
  rideStops: RouteStop[]
  /** Number of stops after boarding until getting off. */
  stopsTravelled: number
  fare: FareInfo
}

export interface SearchResults {
  verified: DirectRouteResult[]
  /** Unverified or outdated routes: shown separately, never as verified. */
  notVerified: DirectRouteResult[]
}

function inTravelOrder(stops: RouteStop[]): RouteStop[] {
  return [...stops].sort((a, b) => a.sequence - b.sequence)
}

/**
  Find the shortest valid ride on one route:
  board at an origin occurrence where boarding is allowed,
  get off at a LATER destination occurrence where alighting is allowed.
  Handles routes that pass the same stop twice (loops).
*/
export function findRide(route: Route, originId: string, destinationId: string): RouteStop[] | null {
  const ordered = inTravelOrder(route.stops)
  let best: [number, number] | null = null

  for (let i = 0; i < ordered.length; i++) {
    const board = ordered[i]
    if (board.stopId !== originId || !board.boardingAllowed) continue

    for (let j = i + 1; j < ordered.length; j++) {
      const alight = ordered[j]
      if (alight.stopId !== destinationId || !alight.alightingAllowed) continue
      if (!best || j - i < best[1] - best[0]) best = [i, j]
      break // the first valid stop after i is the shortest from this boarding point
    }
  }

  return best ? ordered.slice(best[0], best[1] + 1) : null
}

/**
  Only VERIFIED fares are ever shown. Preference:
  1. a verified fare for exactly this segment
  2. a verified flat fare for the whole route
  Anything else -> "Fare not verified". We never estimate or calculate a fare.
*/
export function findFare(fares: RouteFare[], routeId: string, fromId: string, toId: string): FareInfo {
  const verified = fares.filter((fare) => fare.routeId === routeId && fare.isVerified && fare.amountPkr > 0)

  const segment = verified.find((fare) => fare.fromStopId === fromId && fare.toStopId === toId)
  if (segment) return { status: 'verified', amountPkr: segment.amountPkr, verifiedAt: segment.verifiedAt }

  const flat = verified.find((fare) => fare.fromStopId === null && fare.toStopId === null)
  if (flat) return { status: 'verified', amountPkr: flat.amountPkr, verifiedAt: flat.verifiedAt }

  return { status: 'not_verified' }
}

export function findDirectRoutes(data: TransportData, originId: string, destinationId: string): SearchResults {
  const results: SearchResults = { verified: [], notVerified: [] }
  if (!originId || !destinationId || originId === destinationId) return results

  for (const route of data.routes) {
    const rideStops = findRide(route, originId, destinationId)
    if (!rideStops) continue

    const result: DirectRouteResult = {
      route,
      rideStops,
      stopsTravelled: rideStops.length - 1,
      fare: findFare(data.fares, route.id, originId, destinationId),
    }

    if (route.verificationStatus === 'verified') results.verified.push(result)
    else results.notVerified.push(result)
  }

  const byShortestRide = (a: DirectRouteResult, b: DirectRouteResult) =>
    a.stopsTravelled - b.stopsTravelled || a.route.code.localeCompare(b.route.code)
  results.verified.sort(byShortestRide)
  results.notVerified.sort(byShortestRide)
  return results
}

/** Data checks that the database will also enforce in Phase 3. */
export function findRouteDataProblems(route: Route): string[] {
  const problems: string[] = []
  const sequences = route.stops.map((stop) => stop.sequence)
  if (route.stops.length < 2) problems.push(`${route.code}: needs at least 2 stops`)
  if (new Set(sequences).size !== sequences.length) problems.push(`${route.code}: duplicate sequence numbers`)
  if (sequences.some((n) => !Number.isInteger(n) || n < 1)) problems.push(`${route.code}: sequence must be a positive whole number`)
  if (route.verificationStatus === 'verified' && !route.lastVerifiedAt) {
    problems.push(`${route.code}: verified route has no verification date`)
  }
  const ordered = inTravelOrder(route.stops)
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].stopId === ordered[i - 1].stopId) problems.push(`${route.code}: same stop listed twice in a row`)
  }
  return problems
}
