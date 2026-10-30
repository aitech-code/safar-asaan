import { PostgrestClient } from '@supabase/postgrest-js'
import { readSupabaseConfig } from './supabaseConfig'

export const supabaseConfig = readSupabaseConfig(import.meta.env)

/*
  Public visitors only READ routes and SUBMIT reports, so they get the small
  table-query library (postgrest-js, a part of Supabase) instead of the full
  Supabase library. That keeps the download small on slow connections.
  The full library (with login) will be loaded only on the admin pages.

  Headers follow Supabase's own rules: new publishable keys go only in the
  `apikey` header; legacy JWT anon keys are also sent as a Bearer token.
*/
function publicHeaders(key: string): Record<string, string> {
  const isNewKey = key.startsWith('sb_publishable_')
  return isNewKey ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }
}

export const publicDb =
  supabaseConfig.status === 'ok'
    ? new PostgrestClient(`${supabaseConfig.url}/rest/v1`, { headers: publicHeaders(supabaseConfig.key) })
    : null

if (supabaseConfig.status === 'invalid') {
  console.error(
    supabaseConfig.reason === 'secret_key'
      ? 'Safar Asaan: a SECRET Supabase key was found in .env.local. It was NOT used. Replace it with the publishable key.'
      : 'Safar Asaan: VITE_SUPABASE_URL / key in .env.local are not valid.',
  )
}
