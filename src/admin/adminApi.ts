import type { SupabaseClient } from '@supabase/supabase-js'

/*
  Everything the admin dashboard reads or writes.
  These calls run with the admin's login session. The database's RLS
  policies (Phase 3) allow them ONLY if the user is in admin_users,
  so even if someone opens this page without being an admin, the
  database refuses every change.
*/

export const REPORT_STATUSES = ['new', 'reviewing', 'resolved', 'rejected'] as const
export type ReportStatus = (typeof REPORT_STATUSES)[number]
export const VERIFICATION_STATUSES = ['unverified', 'verified', 'outdated'] as const
export type AdminVerificationStatus = (typeof VERIFICATION_STATUSES)[number]

export interface AdminReport {
  id: string
  created_at: string
  report_type: string
  message: string
  suggested_fare_pkr: number | null
  contact: string | null
  language: string
  status: ReportStatus
  admin_notes: string | null
  route_id: string | null
  routes: { code: string; name_en: string } | null
}

export interface AdminFare {
  id: string
  route_id: string
  from_stop_id: string | null
  to_stop_id: string | null
  amount_pkr: number
  is_verified: boolean
  verified_at: string | null
}

export interface AdminRoute {
  id: string
  code: string
  name_en: string
  name_ur: string
  vehicle_type: string
  verification_status: AdminVerificationStatus
  last_verified_at: string | null
  is_published: boolean
  is_fictional: boolean
  route_fares: AdminFare[]
}

/**
  RLS does not raise an error when it blocks an UPDATE or DELETE: it just
  changes 0 rows. So every change asks for the changed ids back and fails
  loudly if nothing was changed.
*/
function expectChanged(result: { data: unknown[] | null; error: { message: string } | null }, what: string): void {
  if (result.error) throw new Error(result.error.message)
  if (!result.data || result.data.length === 0) {
    throw new Error(`Nothing was changed (${what}). You may not have permission, or the record no longer exists.`)
  }
}

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  if (result.data === null) throw new Error('No data returned')
  return result.data
}

/** Asks the database whether the logged-in user is an admin. */
export async function checkIsAdmin(client: SupabaseClient): Promise<boolean> {
  const { data, error } = await client.rpc('is_admin')
  if (error) throw new Error(error.message)
  return data === true
}

export async function fetchReports(client: SupabaseClient, status: ReportStatus | 'all'): Promise<AdminReport[]> {
  let query = client
    .from('route_reports')
    .select('id, created_at, report_type, message, suggested_fare_pkr, contact, language, status, admin_notes, route_id, routes (code, name_en)')
    .order('created_at', { ascending: false })
    .limit(200)
  if (status !== 'all') query = query.eq('status', status)
  return check(await query) as unknown as AdminReport[]
}

export async function updateReport(
  client: SupabaseClient,
  id: string,
  patch: { status: ReportStatus; admin_notes: string | null },
): Promise<void> {
  const notes = patch.admin_notes?.trim() ? patch.admin_notes.trim().slice(0, 2000) : null
  expectChanged(
    await client.from('route_reports').update({ status: patch.status, admin_notes: notes }).eq('id', id).select('id'),
    'report',
  )
}

export async function fetchAdminRoutes(client: SupabaseClient): Promise<AdminRoute[]> {
  const result = await client
    .from('routes')
    .select(
      'id, code, name_en, name_ur, vehicle_type, verification_status, last_verified_at, is_published, is_fictional, ' +
        'route_fares (id, route_id, from_stop_id, to_stop_id, amount_pkr, is_verified, verified_at)',
    )
    .order('code')
  return check(result) as unknown as AdminRoute[]
}

export function todayIso(now = new Date()): string {
  // Local date (Pakistan time on the admin's phone), not UTC.
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

export async function setRoutePublished(client: SupabaseClient, id: string, published: boolean): Promise<void> {
  expectChanged(await client.from('routes').update({ is_published: published }).eq('id', id).select('id'), 'route')
}

export async function setRouteVerification(
  client: SupabaseClient,
  id: string,
  status: AdminVerificationStatus,
  verifiedOn: string | null,
): Promise<void> {
  if (status === 'verified' && (!verifiedOn || !isValidIsoDate(verifiedOn))) {
    throw new Error('A verified route needs a valid verification date.')
  }
  const patch =
    status === 'verified' ? { verification_status: status, last_verified_at: verifiedOn } : { verification_status: status }
  expectChanged(await client.from('routes').update(patch).eq('id', id).select('id'), 'route')
}

/** Create or update the route's FLAT fare (segment fares are managed later). */
export async function saveFlatFare(
  client: SupabaseClient,
  routeId: string,
  existingFareId: string | null,
  fare: { amountPkr: number; isVerified: boolean; verifiedOn: string | null },
): Promise<void> {
  if (!Number.isInteger(fare.amountPkr) || fare.amountPkr < 1 || fare.amountPkr > 100000) {
    throw new Error('Fare must be a whole number between 1 and 100000.')
  }
  if (fare.isVerified && (!fare.verifiedOn || !isValidIsoDate(fare.verifiedOn))) {
    throw new Error('A verified fare needs a valid verification date.')
  }
  const row = {
    amount_pkr: fare.amountPkr,
    is_verified: fare.isVerified,
    verified_at: fare.isVerified ? fare.verifiedOn : null,
  }
  expectChanged(
    existingFareId
      ? await client.from('route_fares').update(row).eq('id', existingFareId).select('id')
      : await client.from('route_fares').insert({ ...row, route_id: routeId }).select('id'),
    'fare',
  )
}

export async function deleteFare(client: SupabaseClient, fareId: string): Promise<void> {
  expectChanged(await client.from('route_fares').delete().eq('id', fareId).select('id'), 'fare')
}
