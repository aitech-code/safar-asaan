import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { submitReport, type InsertClient } from '../data/submitReport'
import { useTransportData } from '../data/useTransportData'
import { useLanguage } from '../i18n/useLanguage'
import type { TranslationKey } from '../i18n/translations'
import { routeName } from '../lib/display'
import {
  CONTACT_MAX,
  cooldownRemaining,
  MESSAGE_MAX,
  REPORT_TYPES,
  validateReport,
  type ReportError,
  type ReportInput,
} from '../lib/reportValidation'
import { publicDb } from '../lib/supabaseClient'

const LAST_SENT_KEY = 'safar-asaan:last-report-at'

function readLastSent(): number | null {
  try {
    const value = Number(window.localStorage.getItem(LAST_SENT_KEY))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function saveLastSent(time: number) {
  try {
    window.localStorage.setItem(LAST_SENT_KEY, String(time))
  } catch {
    // Storage blocked: cooldown simply won't persist.
  }
}

type Status = 'editing' | 'sending' | 'sent' | 'failed'

/** Current time; kept outside the component so renders stay pure. */
const nowMs = () => Date.now()

export function ReportPage() {
  const { t, language } = useLanguage()
  const data = useTransportData()
  const [params] = useSearchParams()

  const route = data.routes.find((candidate) => candidate.id === params.get('route'))
  const presetType = params.get('type')
  const initialType = presetType && (REPORT_TYPES as readonly string[]).includes(presetType) ? presetType : ''

  const [input, setInput] = useState<ReportInput>({ reportType: initialType, message: '', suggestedFare: '', contact: '' })
  const [honeypot, setHoneypot] = useState('') // hidden field that only bots fill in
  const [errors, setErrors] = useState<Partial<Record<keyof ReportInput, ReportError>>>({})
  const [status, setStatus] = useState<Status>('editing')
  const [waitSeconds, setWaitSeconds] = useState(() => cooldownRemaining(readLastSent(), nowMs()))

  // Count down the cooldown once per second while it is active.
  useEffect(() => {
    if (waitSeconds <= 0) return
    const timer = window.setTimeout(() => setWaitSeconds(cooldownRemaining(readLastSent(), nowMs())), 1000)
    return () => window.clearTimeout(timer)
  }, [waitSeconds])

  const update = (field: keyof ReportInput) => (value: string) => setInput((current) => ({ ...current, [field]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'sending' || !publicDb) return

    const remaining = cooldownRemaining(readLastSent(), nowMs())
    if (remaining > 0) {
      setWaitSeconds(remaining)
      return
    }

    const result = validateReport(input)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setErrors({})

    if (honeypot !== '') {
      setStatus('sent') // pretend success; do not store bot spam
      return
    }

    setStatus('sending')
    try {
      await submitReport(publicDb as unknown as InsertClient, result.report, { routeId: route?.id ?? null, language })
      const now = nowMs()
      saveLastSent(now)
      setWaitSeconds(cooldownRemaining(now, nowMs()))
      setStatus('sent')
    } catch (error) {
      console.error('Safar Asaan: report failed', error)
      setStatus('failed')
    }
  }

  function resetForm() {
    setInput({ reportType: '', message: '', suggestedFare: '', contact: '' })
    setStatus('editing')
  }

  const errorText = (field: keyof ReportInput) => {
    const code = errors[field]
    return code ? (
      <p id={`${field}-error`} className="mt-1 text-sm text-red-700">
        {t(`err_${code}` as TranslationKey)}
      </p>
    ) : null
  }

  const inputClass = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-brand-600 focus:outline-none'

  if (status === 'sent') {
    return (
      <section className="space-y-4">
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-900 ring-1 ring-emerald-200">
          {t('reportThanks')}
        </p>
        <div className="flex flex-wrap gap-4">
          <button type="button" onClick={resetForm} className="font-semibold text-brand-700 underline">
            {t('reportAnother')}
          </button>
          <Link to="/" className="font-semibold text-brand-700 underline">
            {t('backHome')}
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="report-heading" className="space-y-4">
      <h1 id="report-heading" className="text-xl font-bold">
        {t('reportTitle')}
      </h1>
      {route && <p className="text-slate-700">{t('reportAboutRoute', { route: `${route.code} · ${routeName(route, language)}` })}</p>}

      {!publicDb && (
        <p role="note" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-300">
          {t('reportDemoMode')}
        </p>
      )}

      <form noValidate onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <fieldset aria-describedby={errors.reportType ? 'reportType-error' : undefined}>
          <legend className="font-medium">{t('reportTypeLabel')}</legend>
          <div className="mt-2 space-y-2">
            {REPORT_TYPES.map((type) => (
              <label key={type} className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3">
                <input
                  type="radio"
                  name="reportType"
                  value={type}
                  checked={input.reportType === type}
                  onChange={(event) => update('reportType')(event.target.value)}
                  className="h-5 w-5 accent-brand-700"
                />
                <span>{t(`reportType_${type}` as TranslationKey)}</span>
              </label>
            ))}
          </div>
          {errorText('reportType')}
        </fieldset>

        <label className="block">
          <span className="font-medium">{t('reportMessageLabel')}</span>
          <textarea
            name="message"
            dir="auto"
            rows={4}
            maxLength={MESSAGE_MAX}
            value={input.message}
            onChange={(event) => update('message')(event.target.value)}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? 'message-error' : 'message-hint'}
            className={`${inputClass} py-2`}
          />
          <span id="message-hint" className="mt-1 block text-xs text-slate-500">
            {t('reportMessageHint')} ({input.message.trim().length}/{MESSAGE_MAX})
          </span>
          {errorText('message')}
        </label>

        {input.reportType === 'wrong_fare' && (
          <label className="block">
            <span className="font-medium">{t('reportFareLabel')}</span>
            <input
              name="suggestedFare"
              inputMode="numeric"
              dir="ltr"
              maxLength={6}
              value={input.suggestedFare}
              onChange={(event) => update('suggestedFare')(event.target.value)}
              aria-invalid={errors.suggestedFare ? true : undefined}
              aria-describedby={errors.suggestedFare ? 'suggestedFare-error' : undefined}
              className={`${inputClass} min-h-12 max-w-40`}
            />
            {errorText('suggestedFare')}
          </label>
        )}

        <label className="block">
          <span className="font-medium">{t('reportContactLabel')}</span>
          <input
            name="contact"
            dir="auto"
            autoComplete="off"
            maxLength={CONTACT_MAX}
            value={input.contact}
            onChange={(event) => update('contact')(event.target.value)}
            aria-describedby="contact-hint"
            className={`${inputClass} min-h-12`}
          />
          <span id="contact-hint" className="mt-1 block text-xs text-slate-500">
            {t('reportContactHint')}
          </span>
          {errorText('contact')}
        </label>

        {/* Honeypot: hidden from people and screen readers; bots tend to fill every field. */}
        <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        <p className="text-xs text-slate-600">{t('reportPrivacy')}</p>

        {waitSeconds > 0 && (
          <p role="status" className="text-sm text-amber-800">
            {t('reportCooldown', { seconds: waitSeconds })}
          </p>
        )}
        {status === 'failed' && (
          <p role="alert" className="text-sm text-red-700">
            {t('reportFailed')}
          </p>
        )}

        <button
          type="submit"
          disabled={!publicDb || status === 'sending' || waitSeconds > 0}
          className="min-h-12 w-full rounded-lg bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {status === 'sending' ? t('reportSending') : t('reportSubmit')}
        </button>
      </form>
    </section>
  )
}
