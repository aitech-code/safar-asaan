import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../lib/supabaseClient'

/*
  The full Supabase library (with login) is used ONLY here.
  This file is part of the admin chunk, which is downloaded only when
  someone opens /admin, so public visitors never pay for it.
*/
export const adminClient: SupabaseClient | null =
  supabaseConfig.status === 'ok'
    ? createClient(supabaseConfig.url, supabaseConfig.key, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: 'safar-asaan-admin-auth' },
      })
    : null
