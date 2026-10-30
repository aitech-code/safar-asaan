/*
  Reads the Supabase settings from .env.local and checks them.

  Safety check: a SECRET key (sb_secret_… or a JWT with role "service_role")
  must never be shipped to browsers, because it bypasses all security rules.
  If someone pastes one by mistake, we refuse to use it.
*/

export type SupabaseConfig =
  | { status: 'not_configured' }
  | { status: 'invalid'; reason: 'bad_url' | 'secret_key' }
  | { status: 'ok'; url: string; key: string }

function jwtRole(key: string): string | null {
  const parts = key.split('.')
  if (parts.length !== 3) return null
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    const payload: unknown = JSON.parse(json)
    if (payload && typeof payload === 'object' && 'role' in payload) {
      return String((payload as { role: unknown }).role)
    }
  } catch {
    // not a JWT
  }
  return null
}

export function readSupabaseConfig(env: Record<string, string | undefined>): SupabaseConfig {
  const url = (env.VITE_SUPABASE_URL ?? '').trim()
  // Accept the old variable name too.
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY ?? '').trim()

  if (!url && !key) return { status: 'not_configured' }

  if (key.startsWith('sb_secret_') || jwtRole(key) === 'service_role') {
    return { status: 'invalid', reason: 'secret_key' }
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return { status: 'invalid', reason: 'bad_url' }
    }
  } catch {
    return { status: 'invalid', reason: 'bad_url' }
  }
  if (!key) return { status: 'invalid', reason: 'bad_url' }

  return { status: 'ok', url: url.replace(/\/+$/, ''), key }
}
