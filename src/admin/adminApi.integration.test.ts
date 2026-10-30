/*
  ADMIN INTEGRATION TEST: real login + real database permissions.

  Skipped unless these are set (PowerShell example):
    $env:TEST_SUPABASE_URL="https://xxxx.supabase.co"
    $env:TEST_SUPABASE_KEY="sb_publishable_..."
    $env:TEST_ADMIN_EMAIL="you@example.com";   $env:TEST_ADMIN_PASSWORD="..."
    # optional: a second account that is NOT an admin
    $env:TEST_USER_EMAIL="...";                $env:TEST_USER_PASSWORD="..."
    npx vitest run src/admin

  It temporarily changes the FICTIONAL demo routes (R2, R6) and puts them
  back at the end. Never run it against real (non-fictional) data.
*/
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  checkIsAdmin,
  deleteFare,
  fetchAdminRoutes,
  fetchReports,
  saveFlatFare,
  setRoutePublished,
  setRouteVerification,
  updateReport,
} from './adminApi'

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
const url = env.TEST_SUPABASE_URL ?? ''
const key = env.TEST_SUPABASE_KEY ?? ''
const R2 = '00000000-0000-4000-b000-000000000002'
const R6 = '00000000-0000-4000-b000-000000000006'

// Each test client gets its own storage name: Supabase syncs logins between
// clients that share one, which would let the "public" client see admin data.
let clientCount = 0
const newClient = () =>
  createClient(url || 'http://unused.invalid', key || 'unused', {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: `safar-asaan-test-${++clientCount}` },
  })

describe.skipIf(!url || !key || !env.TEST_ADMIN_EMAIL)('Admin dashboard data (signed in as admin)', () => {
  const admin = newClient()
  const anon = newClient()
  let createdFareId: string | null = null

  beforeAll(async () => {
    const { error } = await admin.auth.signInWithPassword({ email: env.TEST_ADMIN_EMAIL!, password: env.TEST_ADMIN_PASSWORD! })
    if (error) throw new Error(`Admin login failed: ${error.message}`)
  })

  afterAll(async () => {
    // Put the fictional demo data back exactly as the seed had it.
    await admin.from('routes').update({ is_published: false }).eq('id', R6)
    if (createdFareId) await admin.from('route_fares').delete().eq('id', createdFareId)
    await admin.auth.signOut()
  })

  it('recognises the admin', async () => {
    expect(await checkIsAdmin(admin)).toBe(true)
  })

  it('sees draft routes the public cannot see', async () => {
    const codes = (await fetchAdminRoutes(admin)).map((r) => r.code)
    expect(codes).toContain('R6')
    const { data } = await anon.from('routes').select('code').eq('id', R6)
    expect(data).toEqual([])
  })

  it('reads and updates correction reports', async () => {
    await anon.from('route_reports').insert({ report_type: 'other', message: 'Admin integration test report.', language: 'en' })
    const reports = await fetchReports(admin, 'new')
    const mine = reports.find((r) => r.message === 'Admin integration test report.')
    expect(mine).toBeDefined()
    await updateReport(admin, mine!.id, { status: 'resolved', admin_notes: 'Checked by integration test' })
    const resolved = await fetchReports(admin, 'resolved')
    expect(resolved.some((r) => r.id === mine!.id && r.admin_notes === 'Checked by integration test')).toBe(true)
  })

  it('publishes a draft so the public can see it', async () => {
    await setRoutePublished(admin, R6, true)
    const { data } = await anon.from('routes').select('code').eq('id', R6)
    expect(data).toEqual([{ code: 'R6' }])
  })

  it('refuses "verified" without a valid date (before contacting the database)', async () => {
    await expect(setRouteVerification(admin, R6, 'verified', null)).rejects.toThrow('verification date')
    await expect(setRouteVerification(admin, R6, 'verified', '2026-02-30')).rejects.toThrow('verification date')
  })

  it('adds a verified fare that the public then receives', async () => {
    await saveFlatFare(admin, R2, null, { amountPkr: 45, isVerified: true, verifiedOn: '2026-10-29' })
    const fare = (await fetchAdminRoutes(admin)).find((r) => r.id === R2)!.route_fares.find((f) => f.from_stop_id === null)!
    createdFareId = fare.id
    expect(fare).toMatchObject({ amount_pkr: 45, is_verified: true })
    const { data } = await anon.from('route_fares').select('amount_pkr').eq('route_id', R2)
    expect(data).toEqual([{ amount_pkr: 45 }])
  })

  it('un-verifying a fare hides it from the public', async () => {
    await saveFlatFare(admin, R2, createdFareId, { amountPkr: 45, isVerified: false, verifiedOn: null })
    const { data } = await anon.from('route_fares').select('amount_pkr').eq('route_id', R2)
    expect(data).toEqual([])
  })

  it('rejects an invalid fare amount', async () => {
    await expect(saveFlatFare(admin, R2, createdFareId, { amountPkr: 0, isVerified: false, verifiedOn: null })).rejects.toThrow()
  })

  it('removes the fare', async () => {
    await deleteFare(admin, createdFareId!)
    createdFareId = null
  })
})

describe.skipIf(!url || !key || !env.TEST_USER_EMAIL)('Admin tools signed in as a NON-admin', () => {
  const user: SupabaseClient = newClient()

  beforeAll(async () => {
    const { error } = await user.auth.signInWithPassword({ email: env.TEST_USER_EMAIL!, password: env.TEST_USER_PASSWORD! })
    if (error) throw new Error(`User login failed: ${error.message}`)
  })
  afterAll(async () => {
    await user.auth.signOut()
  })

  it('is not recognised as admin', async () => {
    expect(await checkIsAdmin(user)).toBe(false)
  })

  it('cannot publish, verify, or change fares, and the tools say so', async () => {
    await expect(setRoutePublished(user, R6, true)).rejects.toThrow('Nothing was changed')
    await expect(setRouteVerification(user, R2, 'outdated', null)).rejects.toThrow('Nothing was changed')
    await expect(saveFlatFare(user, R2, null, { amountPkr: 10, isVerified: false, verifiedOn: null })).rejects.toThrow()
  })

  it('cannot read correction reports', async () => {
    expect(await fetchReports(user, 'all')).toEqual([])
  })
})
