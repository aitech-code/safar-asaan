import { describe, expect, it } from 'vitest'
import { readSupabaseConfig } from './supabaseConfig'

const URL = 'https://abcdefgh.supabase.co'
// Builds a fake JWT with the given role (signature is irrelevant for this check).
const fakeJwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`

describe('readSupabaseConfig', () => {
  it('uses built-in sample data when nothing is configured', () => {
    expect(readSupabaseConfig({})).toEqual({ status: 'not_configured' })
  })

  it('accepts a publishable key', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc' })).toEqual({
      status: 'ok',
      url: URL,
      key: 'sb_publishable_abc',
    })
  })

  it('accepts a legacy anon key under the old variable name', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: `${URL}/`, VITE_SUPABASE_ANON_KEY: fakeJwt('anon') })).toMatchObject({
      status: 'ok',
      url: URL,
    })
  })

  it('REFUSES a new-style secret key', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_xyz' })).toEqual({
      status: 'invalid',
      reason: 'secret_key',
    })
  })

  it('REFUSES a legacy service_role key', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_ANON_KEY: fakeJwt('service_role') })).toEqual({
      status: 'invalid',
      reason: 'secret_key',
    })
  })

  it('rejects a missing or non-https URL', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_abc' }).status).toBe('invalid')
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: 'http://evil.example', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' }).status).toBe('invalid')
  })

  it('rejects a URL with no key', () => {
    expect(readSupabaseConfig({ VITE_SUPABASE_URL: URL }).status).toBe('invalid')
  })
})
