import type { Route, RouteFare, Stop, TransportData, VehicleType, VerificationStatus } from '../types/transport'

/*
  Loads routes from Supabase and converts database rows (snake_case)
  into the app's shapes (camelCase).

  Security note: we do not filter for "published" or "verified fare" here.
  The database's Row Level Security already returns only what the public
  may see. We still validate every row so a bad record cannot crash the app.
*/

/** The small part of the Supabase client we use (makes testing easy). */
export interface QueryClient {
  from(table: string): {
    select(columns: string): PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>
  }
}

const VEHICLES: VehicleType[] = ['suzuki_van', 'wagon', 'minibus', 'chingchi']
const STATUSES: VerificationStatus[] = ['verified', 'unverified', 'outdated']

type Row = Record<string, unknown>

const isRow = (value: unknown): value is Row => typeof value === 'object' && value !== null
const str = (value: unknown): string | null => (typeof value === 'string' ? value : null)
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback)
const dateOnly = (value: unknown): string | null => {
  const text = str(value)
  return text && /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null
}

export function mapStop(row: unknown): Stop | null {
  if (!isRow(row)) return null
  const id = str(row.id)
  const nameEn = str(row.name_en)
  const nameUr = str(row.name_ur)
  if (!id || !nameEn || !nameUr) return null
  const aliases = Array.isArray(row.aliases) ? row.aliases.filter((a): a is string => typeof a === 'string') : []
  return { id, nameEn, nameUr, aliases }
}

export function mapRoute(row: unknown): Route | null {
  if (!isRow(row)) return null
  const id = str(row.id)
  const code = str(row.code)
  const nameEn = str(row.name_en)
  const nameUr = str(row.name_ur)
  const vehicleType = str(row.vehicle_type) as VehicleType | null
  const status = str(row.verification_status) as VerificationStatus | null
  if (!id || !code || !nameEn || !nameUr) return null
  // Admins can read drafts through RLS; the public screens must still hide them.
  if (row.is_published !== true) return null
  if (!vehicleType || !VEHICLES.includes(vehicleType)) return null
  if (!status || !STATUSES.includes(status)) return null

  const lastVerifiedAt = dateOnly(row.last_verified_at)
  const rawStops = Array.isArray(row.route_stops) ? row.route_stops : []
  const stops = rawStops
    .filter(isRow)
    .map((s) => ({
      stopId: str(s.stop_id) ?? '',
      sequence: typeof s.stop_sequence === 'number' ? s.stop_sequence : NaN,
      boardingAllowed: bool(s.boarding_allowed, true),
      alightingAllowed: bool(s.alighting_allowed, true),
    }))
    .filter((s) => s.stopId && Number.isInteger(s.sequence))
    .sort((a, b) => a.sequence - b.sequence)

  if (stops.length < 2) return null

  return {
    id,
    code,
    nameEn,
    nameUr,
    vehicleType,
    directionEn: str(row.direction_en) ?? '',
    directionUr: str(row.direction_ur) ?? '',
    // Never present a route as verified without a date.
    verificationStatus: status === 'verified' && !lastVerifiedAt ? 'unverified' : status,
    lastVerifiedAt,
    sourceNotes: str(row.source_notes) ?? '',
    isFictional: bool(row.is_fictional, false),
    stops,
  }
}

export function mapFare(row: unknown): RouteFare | null {
  if (!isRow(row)) return null
  const routeId = str(row.route_id)
  const amount = row.amount_pkr
  if (!routeId || typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) return null
  const fromStopId = str(row.from_stop_id)
  const toStopId = str(row.to_stop_id)
  if ((fromStopId === null) !== (toStopId === null)) return null
  const verifiedAt = dateOnly(row.verified_at)
  return {
    routeId,
    fromStopId,
    toStopId,
    amountPkr: amount,
    // A fare counts as verified only with a verification date.
    isVerified: bool(row.is_verified, false) && verifiedAt !== null,
    verifiedAt,
  }
}

export function mapTransportData(stopRows: unknown[], routeRows: unknown[], fareRows: unknown[]): TransportData {
  const stops = stopRows.map(mapStop).filter((s): s is Stop => s !== null)
  const stopIds = new Set(stops.map((s) => s.id))
  // Drop routes that reference stops we could not load.
  const routes = routeRows
    .map(mapRoute)
    .filter((r): r is Route => r !== null && r.stops.every((s) => stopIds.has(s.stopId)))
  const routeIds = new Set(routes.map((r) => r.id))
  const fares = fareRows.map(mapFare).filter((f): f is RouteFare => f !== null && routeIds.has(f.routeId))
  return { stops, routes, fares }
}

export async function loadTransportData(client: QueryClient): Promise<TransportData> {
  const [stops, routes, fares] = await Promise.all([
    client.from('stops').select('id, name_en, name_ur, aliases'),
    client
      .from('routes')
      .select(
        'id, code, name_en, name_ur, vehicle_type, direction_en, direction_ur, verification_status, ' +
          'last_verified_at, source_notes, is_published, is_fictional, ' +
          'route_stops (stop_id, stop_sequence, boarding_allowed, alighting_allowed)',
      ),
    client.from('route_fares').select('route_id, from_stop_id, to_stop_id, amount_pkr, is_verified, verified_at'),
  ])

  const error = stops.error ?? routes.error ?? fares.error
  if (error) throw new Error(error.message)

  return mapTransportData(stops.data ?? [], routes.data ?? [], fares.data ?? [])
}
