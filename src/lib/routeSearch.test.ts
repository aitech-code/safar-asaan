import { describe, expect, it } from 'vitest'
import { sampleData } from '../data/sampleData'
import type { Route, TransportData } from '../types/transport'
import { findDirectRoutes, findFare, findRide, findRouteDataProblems } from './routeSearch'

const codes = (results: { route: Route }[]) => results.map((result) => result.route.code)

describe('direct-route search: stop order', () => {
  it('finds a route when origin comes before destination', () => {
    const results = findDirectRoutes(sampleData, 'stop-sitara', 'stop-noor')
    expect(codes(results.verified)).toEqual(['R1'])
  })

  it('uses the opposite-direction route for the reverse trip', () => {
    const results = findDirectRoutes(sampleData, 'stop-noor', 'stop-sitara')
    expect(codes(results.verified)).toEqual(['R2'])
  })

  it('never returns a route travelled backwards', () => {
    const r1 = sampleData.routes.find((route) => route.code === 'R1')!
    expect(findRide(r1, 'stop-noor', 'stop-sitara')).toBeNull()
  })

  it('lists ride stops in travel order, boarding to destination', () => {
    const [result] = findDirectRoutes(sampleData, 'stop-anaar', 'stop-noor').verified
    expect(result.rideStops.map((stop) => stop.stopId)).toEqual(['stop-anaar', 'stop-lalpul', 'stop-noor'])
    expect(result.stopsTravelled).toBe(2)
  })
})

describe('direct-route search: boarding and alighting rules', () => {
  it('does not let passengers get off where alighting is not allowed', () => {
    // R5 starts at Noor Market, but alighting there is not allowed.
    const results = findDirectRoutes(sampleData, 'stop-overpass', 'stop-noor')
    expect(results.verified).toEqual([])
    expect(results.notVerified).toEqual([])
  })

  it('does not let passengers board where boarding is not allowed', () => {
    const results = findDirectRoutes(sampleData, 'stop-overpass', 'stop-gulshan')
    expect(codes(results.verified)).not.toContain('R5')
  })

  it('allows drop-off at a drop-off-only stop', () => {
    const results = findDirectRoutes(sampleData, 'stop-noor', 'stop-overpass')
    expect(codes(results.verified)).toEqual(['R5'])
  })
})

describe('direct-route search: duplicate stops (loop route)', () => {
  const r4 = sampleData.routes.find((route) => route.code === 'R4')!

  it('boards at the first visit and rides forward', () => {
    expect(findRide(r4, 'stop-lalpul', 'stop-chashma')?.map((s) => s.sequence)).toEqual([2, 3, 4])
  })

  it('uses the second visit when the destination is Lal Pul after Chashma Road', () => {
    expect(findRide(r4, 'stop-chashma', 'stop-lalpul')?.map((s) => s.sequence)).toEqual([4, 5])
  })

  it('picks the shortest ride when a stop appears twice', () => {
    expect(findRide(r4, 'stop-sabz', 'stop-lalpul')?.map((s) => s.sequence)).toEqual([1, 2])
  })
})

describe('verification', () => {
  it('keeps unverified routes out of the verified list', () => {
    const results = findDirectRoutes(sampleData, 'stop-sitara', 'stop-pahari')
    expect(results.verified).toEqual([])
    expect(codes(results.notVerified)).toEqual(['R3'])
  })

  it('treats outdated routes as not verified', () => {
    const data: TransportData = {
      ...sampleData,
      routes: sampleData.routes.map((route) =>
        route.code === 'R1' ? { ...route, verificationStatus: 'outdated' } : route,
      ),
    }
    const results = findDirectRoutes(data, 'stop-sitara', 'stop-noor')
    expect(codes(results.verified)).toEqual([])
    expect(codes(results.notVerified)).toContain('R1')
  })
})

describe('fares', () => {
  it('shows a verified flat fare', () => {
    expect(findFare(sampleData.fares, 'route-r1', 'stop-sitara', 'stop-noor')).toMatchObject({
      status: 'verified',
      amountPkr: 50,
    })
  })

  it('says "not verified" when no fare exists', () => {
    expect(findFare(sampleData.fares, 'route-r2', 'stop-sabz', 'stop-sitara')).toEqual({ status: 'not_verified' })
  })

  it('never shows an unverified fare amount', () => {
    expect(findFare(sampleData.fares, 'route-r3', 'stop-sitara', 'stop-pahari')).toEqual({ status: 'not_verified' })
  })

  it('uses a segment fare only for that exact segment', () => {
    expect(findFare(sampleData.fares, 'route-r4', 'stop-sabz', 'stop-chashma')).toMatchObject({ amountPkr: 40 })
    expect(findFare(sampleData.fares, 'route-r4', 'stop-sabz', 'stop-gulshan')).toEqual({ status: 'not_verified' })
  })
})

describe('empty and invalid searches', () => {
  it('returns nothing when origin and destination are the same', () => {
    expect(findDirectRoutes(sampleData, 'stop-noor', 'stop-noor')).toEqual({ verified: [], notVerified: [] })
  })

  it('returns nothing for unknown stop ids', () => {
    expect(findDirectRoutes(sampleData, 'nope', 'stop-noor')).toEqual({ verified: [], notVerified: [] })
  })

  it('returns nothing when no route connects two real stops', () => {
    expect(findDirectRoutes(sampleData, 'stop-pahari', 'stop-chashma')).toEqual({ verified: [], notVerified: [] })
  })
})

describe('sample data quality', () => {
  it('has no structural problems', () => {
    expect(sampleData.routes.flatMap(findRouteDataProblems)).toEqual([])
  })

  it('is all marked fictional', () => {
    expect(sampleData.routes.every((route) => route.isFictional)).toBe(true)
    for (const stop of sampleData.stops) {
      expect(stop.nameEn).toContain('(demo)')
      expect(stop.nameUr).toContain('(نمونہ)')
    }
  })

  it('detects duplicate sequence numbers', () => {
    const broken: Route = {
      ...sampleData.routes[0],
      stops: [
        { stopId: 'a', sequence: 1, boardingAllowed: true, alightingAllowed: true },
        { stopId: 'b', sequence: 1, boardingAllowed: true, alightingAllowed: true },
      ],
    }
    expect(findRouteDataProblems(broken)).toContain('R1: duplicate sequence numbers')
  })
})
