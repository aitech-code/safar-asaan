import { describe, expect, it } from 'vitest'
import { findDirectRoutes } from '../lib/routeSearch'
import { loadTransportData, mapFare, mapRoute, mapTransportData, type QueryClient } from './supabaseData'

// Rows shaped exactly like Supabase returns them.
const stopRows = [
  { id: 's1', name_en: 'Stop One (demo)', name_ur: 'اسٹاپ ایک (نمونہ)', aliases: ['First'] },
  { id: 's2', name_en: 'Stop Two (demo)', name_ur: 'اسٹاپ دو (نمونہ)', aliases: [] },
  { id: 's3', name_en: 'Stop Three (demo)', name_ur: 'اسٹاپ تین (نمونہ)', aliases: null },
]

const routeRow = {
  id: 'r1',
  code: 'T1',
  name_en: 'Test Route (demo)',
  name_ur: 'ٹیسٹ راستہ (نمونہ)',
  vehicle_type: 'wagon',
  direction_en: 'Towards Stop Three',
  direction_ur: 'اسٹاپ تین کی طرف',
  verification_status: 'verified',
  last_verified_at: '2026-10-01',
  source_notes: 'Test',
  is_published: true,
  is_fictional: true,
  // deliberately out of order: the app must sort by stop_sequence
  route_stops: [
    { stop_id: 's3', stop_sequence: 3, boarding_allowed: true, alighting_allowed: true },
    { stop_id: 's1', stop_sequence: 1, boarding_allowed: true, alighting_allowed: true },
    { stop_id: 's2', stop_sequence: 2, boarding_allowed: true, alighting_allowed: true },
  ],
}

const fareRows = [{ route_id: 'r1', from_stop_id: null, to_stop_id: null, amount_pkr: 40, is_verified: true, verified_at: '2026-10-01' }]

describe('mapping database rows', () => {
  it('sorts route stops by sequence', () => {
    expect(mapRoute(routeRow)?.stops.map((s) => s.stopId)).toEqual(['s1', 's2', 's3'])
  })

  it('never treats a "verified" route without a date as verified', () => {
    expect(mapRoute({ ...routeRow, last_verified_at: null })?.verificationStatus).toBe('unverified')
  })

  it('hides unpublished routes even if the database returns them (admin session)', () => {
    expect(mapRoute({ ...routeRow, is_published: false })).toBeNull()
  })

  it('skips routes with an unknown vehicle type or too few stops', () => {
    expect(mapRoute({ ...routeRow, vehicle_type: 'rocket' })).toBeNull()
    expect(mapRoute({ ...routeRow, route_stops: [routeRow.route_stops[0]] })).toBeNull()
  })

  it('never treats a fare without a verification date as verified', () => {
    expect(mapFare({ ...fareRows[0], verified_at: null })?.isVerified).toBe(false)
  })

  it('rejects invalid fares', () => {
    expect(mapFare({ ...fareRows[0], amount_pkr: 0 })).toBeNull()
    expect(mapFare({ ...fareRows[0], amount_pkr: '40' })).toBeNull()
    expect(mapFare({ ...fareRows[0], from_stop_id: 's1' })).toBeNull()
  })

  it('drops routes that point to stops it could not load', () => {
    const data = mapTransportData(stopRows.slice(0, 2), [routeRow], fareRows)
    expect(data.routes).toEqual([])
    expect(data.fares).toEqual([])
  })

  it('produces data the search can use', () => {
    const data = mapTransportData(stopRows, [routeRow], fareRows)
    const results = findDirectRoutes(data, 's1', 's3')
    expect(results.verified.map((r) => r.route.code)).toEqual(['T1'])
    expect(results.verified[0].fare).toMatchObject({ status: 'verified', amountPkr: 40 })
  })
})

describe('loadTransportData', () => {
  const fakeClient = (overrides: Record<string, { data: unknown[] | null; error: { message: string } | null }>): QueryClient => ({
    from: (table: string) => ({
      select: () =>
        Promise.resolve(
          overrides[table] ?? {
            data: { stops: stopRows, routes: [routeRow], route_fares: fareRows }[table] ?? [],
            error: null,
          },
        ),
    }),
  })

  it('loads and maps all three tables', async () => {
    const data = await loadTransportData(fakeClient({}))
    expect(data.stops).toHaveLength(3)
    expect(data.routes).toHaveLength(1)
    expect(data.fares).toHaveLength(1)
  })

  it('throws when the database returns an error', async () => {
    await expect(loadTransportData(fakeClient({ routes: { data: null, error: { message: 'network down' } } }))).rejects.toThrow(
      'network down',
    )
  })

  it('copes with empty tables', async () => {
    const empty = { data: [], error: null }
    const data = await loadTransportData(fakeClient({ stops: empty, routes: empty, route_fares: empty }))
    expect(data).toEqual({ stops: [], routes: [], fares: [] })
  })
})
