import type { Session } from '@supabase/supabase-js'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { checkIsAdmin } from './adminApi'
import { adminClient } from './adminClient'
import { ReportsPanel } from './ReportsPanel'
import { RoutesPanel } from './RoutesPanel'

/*
  Admin area (English only for now).
  Security does NOT depend on this screen: the database checks admin_users
  on every request. This page just provides the tools.
*/

type AdminState =
  | { status: 'checking' }
  | { status: 'signed_out' }
  | { status: 'not_admin'; email: string }
  | { status: 'admin'; session: Session }
  | { status: 'error'; message: string }

export default function AdminPage() {
  const [state, setState] = useState<AdminState>({ status: adminClient ? 'checking' : 'signed_out' })
  const [tab, setTab] = useState<'reports' | 'routes'>('reports')

  useEffect(() => {
    if (!adminClient) return
    const client = adminClient

    async function evaluate(session: Session | null) {
      if (!session) {
        setState({ status: 'signed_out' })
        return
      }
      try {
        const isAdmin = await checkIsAdmin(client)
        setState(isAdmin ? { status: 'admin', session } : { status: 'not_admin', email: session.user.email ?? '' })
      } catch (error) {
        setState({ status: 'error', message: error instanceof Error ? error.message : String(error) })
      }
    }

    client.auth.getSession().then(({ data }) => evaluate(data.session))
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      // Defer to avoid calling Supabase inside its own auth callback.
      window.setTimeout(() => evaluate(session), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function signOut() {
    await adminClient?.auth.signOut()
    setState({ status: 'signed_out' })
  }

  return (
    <div dir="ltr" lang="en" className="min-h-dvh bg-slate-50 font-sans text-slate-900">
      <header className="bg-slate-800 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-lg font-bold">Safar Asaan · Admin</p>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/" className="underline">
              Public site
            </Link>
            {(state.status === 'admin' || state.status === 'not_admin') && (
              <button type="button" onClick={signOut} className="min-h-10 rounded bg-white/10 px-3 hover:bg-white/20">
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {!adminClient && (
          <p role="alert" className="rounded-lg bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-300">
            The admin area needs a database connection. Add your Supabase URL and publishable key to <code>.env.local</code>{' '}
            and restart the app.
          </p>
        )}

        {state.status === 'checking' && <p role="status">Checking your login…</p>}

        {state.status === 'signed_out' && adminClient && <LoginForm />}

        {state.status === 'not_admin' && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800 ring-1 ring-red-200">
            You are signed in as {state.email}, but this account is not an administrator. Ask the project owner to add you.
          </p>
        )}

        {state.status === 'error' && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800 ring-1 ring-red-200">
            Could not check your access: {state.message}
          </p>
        )}

        {state.status === 'admin' && adminClient && (
          <>
            <p className="mb-4 text-sm text-slate-600">Signed in as {state.session.user.email}</p>
            <div role="tablist" aria-label="Admin sections" className="mb-4 flex gap-2">
              {(['reports', 'routes'] as const).map((name) => (
                <button
                  key={name}
                  role="tab"
                  type="button"
                  aria-selected={tab === name}
                  onClick={() => setTab(name)}
                  className={`min-h-11 rounded-lg px-4 font-semibold ${
                    tab === name ? 'bg-slate-800 text-white' : 'bg-white text-slate-800 ring-1 ring-slate-300'
                  }`}
                >
                  {name === 'reports' ? 'Correction reports' : 'Routes & fares'}
                </button>
              ))}
            </div>
            {tab === 'reports' ? <ReportsPanel client={adminClient} /> : <RoutesPanel client={adminClient} />}
          </>
        )}
      </main>
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminClient) return
    setBusy(true)
    setError(null)
    const { error: signInError } = await adminClient.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    // Same message for wrong email or wrong password: don't reveal which accounts exist.
    if (signInError) setError('Login failed. Check your email and password.')
  }

  const inputClass = 'mt-1 block w-full min-h-12 rounded-lg border border-slate-300 bg-white px-3'

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-bold">Administrator login</h1>
      <label className="block">
        <span className="font-medium">Email</span>
        <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>
      <label className="block">
        <span className="font-medium">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="min-h-12 w-full rounded-lg bg-slate-800 font-semibold text-white disabled:bg-slate-400">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="text-xs text-slate-500">Public sign-up is disabled. Admin accounts are created in Supabase by the project owner.</p>
    </form>
  )
}
