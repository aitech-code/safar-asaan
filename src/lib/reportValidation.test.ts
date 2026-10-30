import { describe, expect, it } from 'vitest'
import { cooldownRemaining, validateReport } from './reportValidation'

const valid = { reportType: 'wrong_fare', message: 'The fare is now Rs 60.', suggestedFare: '60', contact: '' }

describe('validateReport', () => {
  it('accepts a valid report and cleans it', () => {
    expect(validateReport({ ...valid, message: '  The fare is now Rs 60.  ', contact: '  ' })).toEqual({
      ok: true,
      report: { report_type: 'wrong_fare', message: 'The fare is now Rs 60.', suggested_fare_pkr: 60, contact: null },
    })
  })

  it('requires a known report type', () => {
    expect(validateReport({ ...valid, reportType: '' })).toMatchObject({ ok: false, errors: { reportType: 'typeRequired' } })
    expect(validateReport({ ...valid, reportType: 'spam' })).toMatchObject({ ok: false })
  })

  it('rejects too-short and too-long messages', () => {
    expect(validateReport({ ...valid, message: ' hi ' })).toMatchObject({ errors: { message: 'messageTooShort' } })
    expect(validateReport({ ...valid, message: 'x'.repeat(1001) })).toMatchObject({ errors: { message: 'messageTooLong' } })
  })

  it('accepts an Urdu message', () => {
    expect(validateReport({ ...valid, message: 'کرایہ اب ساٹھ روپے ہے' }).ok).toBe(true)
  })

  it('validates the suggested fare', () => {
    for (const bad of ['0', '-5', '12.5', 'abc', '100001', '1e3']) {
      expect(validateReport({ ...valid, suggestedFare: bad }), bad).toMatchObject({ errors: { suggestedFare: 'fareInvalid' } })
    }
    expect(validateReport({ ...valid, suggestedFare: '' })).toMatchObject({ ok: true, report: { suggested_fare_pkr: null } })
  })

  it('accepts Urdu digits for the fare', () => {
    expect(validateReport({ ...valid, suggestedFare: '۶۰' })).toMatchObject({ ok: true, report: { suggested_fare_pkr: 60 } })
  })

  it('limits contact length', () => {
    expect(validateReport({ ...valid, contact: 'x'.repeat(121) })).toMatchObject({ errors: { contact: 'contactTooLong' } })
  })
})

describe('cooldownRemaining', () => {
  it('allows the first report', () => {
    expect(cooldownRemaining(null, 1000)).toBe(0)
  })
  it('blocks for 60 seconds after a report', () => {
    expect(cooldownRemaining(0, 10_000)).toBe(50)
    expect(cooldownRemaining(0, 60_000)).toBe(0)
  })
  it('ignores a timestamp from the future (wrong phone clock)', () => {
    expect(cooldownRemaining(99_999, 1_000)).toBe(0)
  })
})
