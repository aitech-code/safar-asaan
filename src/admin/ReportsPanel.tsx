import type { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import { fetchReports, REPORT_STATUSES, updateReport, type AdminReport, type ReportStatus } from './adminApi'

const TYPE_LABELS: Record<string, string> = {
  wrong_route: 'Route is wrong',
  wrong_stop: 'Stop wrong / missing',
  wrong_fare: 'Fare is wrong',
  missing_route: 'Route missing',
  other: 'Other',
}

export function ReportsPanel({ client }: { client: SupabaseClient }) {
  const [filter, setFilter] = useState<ReportStatus | 'all'>('new')
  const [version, setVersion] = useState(0)
  // Remember which filter/version a result belongs to, so "loading" is derived, not stored.
  const [result, setResult] = useState<{ key: string; reports?: AdminReport[]; error?: string } | null>(null)
  const key = `${filter}:${version}`

  useEffect(() => {
    let cancelled = false
    fetchReports(client, filter)
      .then((reports) => !cancelled && setResult({ key, reports }))
      .catch((e: unknown) => !cancelled && setResult({ key, error: e instanceof Error ? e.message : String(e) }))
    return () => {
      cancelled = true
    }
  }, [client, filter, key])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const current = result?.key === key ? result : null
  const reports = current?.reports ?? null
  const error = current?.error ?? null

  return (
    <section aria-labelledby="reports-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reports-heading" className="text-lg font-semibold">
          Correction reports
        </h2>
        <label className="text-sm">
          Show{' '}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as ReportStatus | 'all')}
            className="ms-1 min-h-10 rounded border border-slate-300 bg-white px-2"
          >
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="all">all</option>
          </select>
        </label>
      </div>

      {error && <p role="alert" className="text-red-700">Could not load reports: {error}</p>}
      {!reports && !error && <p role="status">Loading reports…</p>}
      {reports && reports.length === 0 && <p className="text-slate-600">No reports with status “{filter}”.</p>}

      <ul className="space-y-3">
        {reports?.map((report) => <ReportCard key={report.id} client={client} report={report} onSaved={reload} />)}
      </ul>
    </section>
  )
}

function ReportCard({ client, report, onSaved }: { client: SupabaseClient; report: AdminReport; onSaved: () => void }) {
  const [status, setStatus] = useState<ReportStatus>(report.status)
  const [notes, setNotes] = useState(report.admin_notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await updateReport(client, report.id, { status, admin_notes: notes })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className="space-y-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold">{TYPE_LABELS[report.report_type] ?? report.report_type}</span>
        {report.routes && (
          <span className="rounded bg-teal-50 px-2 py-0.5 text-teal-900">
            {report.routes.code} · {report.routes.name_en}
          </span>
        )}
        <span className="text-slate-500">{new Date(report.created_at).toLocaleString('en-GB')}</span>
        <span className="text-slate-500">({report.language === 'ur' ? 'Urdu' : 'English'})</span>
      </div>
      <p dir="auto" className="whitespace-pre-wrap">
        {report.message}
      </p>
      {report.suggested_fare_pkr !== null && <p className="text-sm">Suggested fare: Rs {report.suggested_fare_pkr}</p>}
      {report.contact && (
        <p className="text-sm">
          Contact: <span dir="auto">{report.contact}</span>
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-2">
        <label className="text-sm">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReportStatus)}
            className="ms-1 min-h-10 rounded border border-slate-300 bg-white px-2"
          >
            {REPORT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-48 flex-1 text-sm">
          Admin notes
          <input
            value={notes}
            maxLength={2000}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block min-h-10 w-full rounded border border-slate-300 px-2"
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="min-h-10 rounded bg-slate-800 px-4 font-semibold text-white disabled:bg-slate-400"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </li>
  )
}
