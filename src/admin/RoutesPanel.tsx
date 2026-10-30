import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import {
  deleteFare,
  fetchAdminRoutes,
  saveFlatFare,
  setRoutePublished,
  setRouteVerification,
  todayIso,
  VERIFICATION_STATUSES,
  type AdminRoute,
  type AdminVerificationStatus,
} from './adminApi'

export function RoutesPanel({ client }: { client: SupabaseClient }) {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<{ version: number; routes?: AdminRoute[]; error?: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchAdminRoutes(client)
      .then((routes) => !cancelled && setResult({ version, routes }))
      .catch((e: unknown) => !cancelled && setResult({ version, error: e instanceof Error ? e.message : String(e) }))
    return () => {
      cancelled = true
    }
  }, [client, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  // Keep showing the previous list while a reload is in progress.
  const routes = result?.routes ?? null
  const error = result?.error ?? null

  return (
    <section aria-labelledby="routes-heading" className="space-y-4">
      <h2 id="routes-heading" className="text-lg font-semibold">
        Routes &amp; fares
      </h2>
      <p className="text-sm text-slate-600">
        Changes appear on the public site the next time the page is opened. Adding new routes and editing stop order is done in
        Supabase for now (see docs/PHASE5_ADMIN.md).
      </p>
      {error && <p role="alert" className="text-red-700">Could not load routes: {error}</p>}
      {!routes && !error && <p role="status">Loading routes…</p>}
      <ul className="space-y-3">
        {routes?.map((route) => <RouteCard key={route.id} client={client} route={route} onSaved={reload} />)}
      </ul>
    </section>
  )
}

function RouteCard({ client, route, onSaved }: { client: SupabaseClient; route: AdminRoute; onSaved: () => void }) {
  const flatFare = route.route_fares.find((fare) => fare.from_stop_id === null) ?? null
  const segmentFares = route.route_fares.filter((fare) => fare.from_stop_id !== null)

  const [verification, setVerification] = useState<AdminVerificationStatus>(route.verification_status)
  const [verifiedOn, setVerifiedOn] = useState(route.last_verified_at ?? todayIso())
  const [fareAmount, setFareAmount] = useState(flatFare ? String(flatFare.amount_pkr) : '')
  const [fareVerified, setFareVerified] = useState(flatFare?.is_verified ?? false)
  const [fareDate, setFareDate] = useState(flatFare?.verified_at ?? todayIso())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      setMessage({ kind: 'ok', text: success })
      onSaved()
    } catch (e) {
      setMessage({ kind: 'error', text: e instanceof Error ? e.message : String(e) })
    } finally {
      setBusy(false)
    }
  }

  const fieldClass = 'min-h-10 rounded border border-slate-300 bg-white px-2'

  return (
    <li className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-teal-50 px-2 font-bold text-teal-900">{route.code}</span>
        <span className="font-semibold">{route.name_en}</span>
        <span className={`rounded px-2 text-xs font-semibold ${route.is_published ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-700'}`}>
          {route.is_published ? 'Published' : 'Draft (hidden)'}
        </span>
        {route.is_fictional && <span className="rounded bg-amber-100 px-2 text-xs font-semibold text-amber-900">Fictional</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => setRoutePublished(client, route.id, !route.is_published), route.is_published ? 'Route hidden.' : 'Route published.')}
          className="min-h-10 rounded border border-slate-800 px-3 font-semibold disabled:opacity-50"
        >
          {route.is_published ? 'Unpublish (hide)' : 'Publish'}
        </button>
      </div>

      <fieldset className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
        <legend className="mb-1 text-sm font-semibold">Verification</legend>
        <select
          aria-label={`Verification status for ${route.code}`}
          value={verification}
          onChange={(e) => setVerification(e.target.value as AdminVerificationStatus)}
          className={fieldClass}
        >
          {VERIFICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {verification === 'verified' && (
          <label className="text-sm">
            Verified on{' '}
            <input type="date" value={verifiedOn} max={todayIso()} onChange={(e) => setVerifiedOn(e.target.value)} className={fieldClass} />
          </label>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => setRouteVerification(client, route.id, verification, verifiedOn), 'Verification saved.')}
          className="min-h-10 rounded bg-slate-800 px-3 font-semibold text-white disabled:bg-slate-400"
        >
          Save verification
        </button>
      </fieldset>

      <fieldset className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
        <legend className="mb-1 text-sm font-semibold">Flat fare (any trip on this route)</legend>
        <label className="text-sm">
          Rs{' '}
          <input
            inputMode="numeric"
            aria-label={`Flat fare for ${route.code}`}
            value={fareAmount}
            onChange={(e) => setFareAmount(e.target.value.replace(/[^\d]/g, ''))}
            className={`${fieldClass} w-24`}
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 text-sm">
          <input type="checkbox" checked={fareVerified} onChange={(e) => setFareVerified(e.target.checked)} className="h-5 w-5" />
          Verified
        </label>
        {fareVerified && (
          <label className="text-sm">
            on{' '}
            <input type="date" value={fareDate} max={todayIso()} onChange={(e) => setFareDate(e.target.value)} className={fieldClass} />
          </label>
        )}
        <button
          type="button"
          disabled={busy || fareAmount === ''}
          onClick={() =>
            run(
              () => saveFlatFare(client, route.id, flatFare?.id ?? null, { amountPkr: Number(fareAmount), isVerified: fareVerified, verifiedOn: fareDate }),
              'Fare saved.',
            )
          }
          className="min-h-10 rounded bg-slate-800 px-3 font-semibold text-white disabled:bg-slate-400"
        >
          Save fare
        </button>
        {flatFare && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => deleteFare(client, flatFare.id), 'Fare removed.')}
            className="min-h-10 rounded border border-red-700 px-3 font-semibold text-red-700 disabled:opacity-50"
          >
            Remove fare
          </button>
        )}
      </fieldset>

      {segmentFares.length > 0 && (
        <p className="text-sm text-slate-600">
          Segment fares: {segmentFares.map((f) => `Rs ${f.amount_pkr}${f.is_verified ? ' (verified)' : ' (unverified)'}`).join(', ')} (edit in
          Supabase for now)
        </p>
      )}

      {message && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`text-sm ${message.kind === 'error' ? 'text-red-700' : 'text-emerald-800'}`}>
          {message.text}
        </p>
      )}
    </li>
  )
}
