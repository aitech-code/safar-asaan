/*
  Shapes of the transport data. These mirror the database tables we
  will create in Phase 3 (routes, stops, route_stops, route_fares),
  so swapping sample data for Supabase later is a small change.
*/

export type VehicleType = 'suzuki_van' | 'wagon' | 'minibus' | 'chingchi'

export type VerificationStatus = 'verified' | 'unverified' | 'outdated'

export interface Stop {
  id: string
  nameEn: string
  nameUr: string
  /** Other names locals use, in either language. */
  aliases: string[]
}

/** One stop's position on one route. */
export interface RouteStop {
  stopId: string
  /** 1, 2, 3… in travel order. Unique within a route. */
  sequence: number
  boardingAllowed: boolean
  alightingAllowed: boolean
}

export interface Route {
  id: string
  code: string
  nameEn: string
  nameUr: string
  vehicleType: VehicleType
  /** Each direction of travel is a separate route with its own stop order. */
  directionEn: string
  directionUr: string
  verificationStatus: VerificationStatus
  /** ISO date (YYYY-MM-DD) or null if never verified. */
  lastVerifiedAt: string | null
  sourceNotes: string
  isFictional: boolean
  stops: RouteStop[]
}

export interface RouteFare {
  routeId: string
  /** null + null = flat fare for any trip on this route. */
  fromStopId: string | null
  toStopId: string | null
  amountPkr: number
  isVerified: boolean
  verifiedAt: string | null
}

export interface TransportData {
  stops: Stop[]
  routes: Route[]
  fares: RouteFare[]
}
