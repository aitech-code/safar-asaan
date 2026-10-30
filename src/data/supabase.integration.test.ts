/*
  INTEGRATION TEST against a real Supabase (or compatible) database that
  contains the migration + fictional seed.

  Skipped unless both variables are set, e.g. in PowerShell:
    $env:TEST_SUPABASE_URL="https://xxxx.supabase.co"
    $env:TEST_SUPABASE_KEY="sb_publishable_..."
    npx vitest run src/data/supabase.integration.test.ts

  Uses only the PUBLIC key, exactly like the app.
*/
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { findDirectRoutes } from '../lib/routeSearch'
import { loadTransportData, type QueryClient } from './supabaseData'

// Read environment variables without needing Node type definitions in the app build.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {}
const url = env.TEST_SUPABASE_URL
const key = env.TEST_SUPABASE_KEY
const R1 = '00000000-0000-4000-b000-000000000001'

describe.skipIf(!url || !key)('Supabase integration (public key)', () => {
  const client = createClient(url ?? 'http://unused', key ?? 'unused', { auth: { persistSession: false } })

  it('loads published fictional routes and hides the draft', async () => {
    const data = await loadTransportData(client as unknown as QueryClient)
    const codes = data.routes.filter((r) => r.isFictional).map((r) => r.code).sort()
    expect(codes).toEqual(['R1', 'R2', 'R3', 'R4', 'R5'])
  })

  it('receives only verified fares', async () => {
    const data = await loadTransportData(client as unknown as QueryClient)
    expect(data.fares.every((fare) => fare.isVerified)).toBe(true)
    expect(data.fares.some((fare) => fare.amountPkr === 60)).toBe(false)
  })

  it('search works on database data (loop route R4 included)', async () => {
    const data = await loadTransportData(client as unknown as QueryClient)
    const lalPul = '00000000-0000-4000-a000-000000000003'
    const chashma = '00000000-0000-4000-a000-000000000009'
    const results = findDirectRoutes(data, chashma, lalPul)
    expect(results.verified.map((r) => r.route.code)).toEqual(['R4'])
    expect(results.verified[0].rideStops.map((s) => s.sequence)).toEqual([4, 5])
  })

  it('public key cannot change routes', async () => {
    const { error } = await client.from('routes').update({ is_published: false }).eq('id', R1)
    expect(error).not.toBeNull()
  })

  it('public key cannot read correction reports', async () => {
    const { error } = await client.from('route_reports').select('id')
    expect(error).not.toBeNull()
  })

  it('public key CAN submit a correction report (without reading it back)', async () => {
    const { error } = await client
      .from('route_reports')
      .insert({ route_id: R1, report_type: 'other', message: 'Integration test report (fictional data).', language: 'en' })
    expect(error).toBeNull()
  })
})
