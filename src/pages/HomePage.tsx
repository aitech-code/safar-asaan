import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTransportData } from '../data/useTransportData'
import { useLanguage } from '../i18n/useLanguage'
import { findStop, stopName } from '../lib/display'
import { lookupStop, MAX_QUERY_LENGTH, type StopLookup } from '../lib/textMatch'
import type { Stop } from '../types/transport'

type Field = 'from' | 'to'

/** Problems are stored as data and turned into text at display time, so they follow the language switch. */
type FieldProblem = Exclude<StopLookup, { status: 'found' }> & { query: string }

export function HomePage() {
  const { t, language } = useLanguage()
  const data = useTransportData()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // When coming back via "New search", pre-fill the previous stops.
  const [fromText, setFromText] = useState(() => {
    const stop = findStop(data, params.get('from'))
    return stop ? stopName(stop, language) : ''
  })
  const [toText, setToText] = useState(() => {
    const stop = findStop(data, params.get('to'))
    return stop ? stopName(stop, language) : ''
  })
  const [problems, setProblems] = useState<Partial<Record<Field, FieldProblem>>>({})
  const [sameStop, setSameStop] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const from = lookupStop(fromText, data.stops)
    const to = lookupStop(toText, data.stops)

    const next: Partial<Record<Field, FieldProblem>> = {}
    if (from.status !== 'found') next.from = { ...from, query: fromText.trim() }
    if (to.status !== 'found') next.to = { ...to, query: toText.trim() }
    setProblems(next)

    if (from.status === 'found' && to.status === 'found') {
      if (from.stop.id === to.stop.id) {
        setSameStop(true)
        return
      }
      setSameStop(false)
      navigate(`/results?from=${encodeURIComponent(from.stop.id)}&to=${encodeURIComponent(to.stop.id)}`)
    } else {
      setSameStop(false)
    }
  }

  function chooseStop(field: Field, stop: Stop) {
    const name = stopName(stop, language)
    if (field === 'from') setFromText(name)
    else setToText(name)
    setProblems((current) => ({ ...current, [field]: undefined }))
  }

  function swap() {
    setFromText(toText)
    setToText(fromText)
    setProblems({ from: problems.to, to: problems.from })
  }

  function problemMessage(field: Field, problem: FieldProblem): string {
    switch (problem.status) {
      case 'empty':
        return field === 'from' ? t('errEmptyFrom') : t('errEmptyTo')
      case 'too_long':
        return t('errTooLong')
      case 'not_found':
        return t('errNotFound', { query: problem.query })
      case 'ambiguous':
        return t('errAmbiguous', { query: problem.query })
    }
  }

  const inputClass =
    'mt-1 block w-full min-h-12 rounded-lg border bg-white px-3 text-base focus:border-brand-600 focus:outline-none'

  function renderField(field: Field, value: string, setValue: (v: string) => void) {
    const problem = problems[field]
    const errorId = `${field}-error`
    return (
      <div>
        <label className="block text-start">
          <span className="font-medium">{field === 'from' ? t('fromLabel') : t('toLabel')}</span>
          <input
            type="search"
            name={field}
            dir="auto"
            list="stop-suggestions"
            autoComplete="off"
            maxLength={MAX_QUERY_LENGTH}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={field === 'from' ? t('fromPlaceholder') : t('toPlaceholder')}
            aria-invalid={problem ? true : undefined}
            aria-describedby={problem ? errorId : undefined}
            className={`${inputClass} ${problem ? 'border-red-500' : 'border-slate-300'}`}
          />
        </label>
        {problem && (
          <div id={errorId} className="mt-1 text-sm text-red-700">
            <p>{problemMessage(field, problem)}</p>
            {problem.status === 'ambiguous' && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {problem.stops.map((stop) => (
                  <li key={stop.id}>
                    <button
                      type="button"
                      onClick={() => chooseStop(field, stop)}
                      className="min-h-10 rounded-full border border-brand-600 bg-white px-3 text-sm text-brand-800"
                    >
                      {stopName(stop, language)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }

  const examples = data.stops.slice(0, 3).map((stop) => stopName(stop, language)).join(language === 'ur' ? '، ' : ', ')

  return (
    <section aria-labelledby="search-heading">
      <p className="mb-4 text-slate-700">{t('tagline')}</p>

      <form
        noValidate
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
      >
        <h1 id="search-heading" className="text-lg font-bold text-slate-900">
          {t('searchHeading')}
        </h1>

        {renderField('from', fromText, setFromText)}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            aria-label={t('swapButton')}
            title={t('swapButton')}
            className="min-h-10 min-w-10 rounded-full border border-slate-300 bg-white text-lg text-brand-700"
          >
            <span aria-hidden="true">⇅</span>
          </button>
        </div>

        {renderField('to', toText, setToText)}

        {sameStop && (
          <p role="alert" className="text-sm text-red-700">
            {t('errSameStop')}
          </p>
        )}

        <button
          type="submit"
          className="min-h-12 w-full rounded-lg bg-brand-700 px-4 font-semibold text-white hover:bg-brand-800"
        >
          {t('searchButton')}
        </button>

        <p className="text-xs text-slate-500">{t('demoHint', { examples })}</p>
      </form>

      <datalist id="stop-suggestions">
        {data.stops.map((stop) => (
          <option key={stop.id} value={stopName(stop, language)} />
        ))}
      </datalist>
    </section>
  )
}
