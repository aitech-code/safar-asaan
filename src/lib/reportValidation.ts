/*
  Checks a correction report BEFORE it is sent.
  The database enforces the same limits (Phase 3), so even a modified
  app cannot store invalid reports. These checks give friendly messages.
*/

export const REPORT_TYPES = ['wrong_route', 'wrong_stop', 'wrong_fare', 'missing_route', 'other'] as const
export type ReportType = (typeof REPORT_TYPES)[number]

export const MESSAGE_MIN = 5
export const MESSAGE_MAX = 1000
export const CONTACT_MAX = 120
export const FARE_MAX = 100000
export const REPORT_COOLDOWN_MS = 60_000

export interface ReportInput {
  reportType: string
  message: string
  suggestedFare: string
  contact: string
}

export type ReportError =
  | 'typeRequired'
  | 'messageTooShort'
  | 'messageTooLong'
  | 'fareInvalid'
  | 'contactTooLong'

export interface CleanReport {
  report_type: ReportType
  message: string
  suggested_fare_pkr: number | null
  contact: string | null
}

export function validateReport(input: ReportInput):
  | { ok: true; report: CleanReport }
  | { ok: false; errors: Partial<Record<keyof ReportInput, ReportError>> } {
  const errors: Partial<Record<keyof ReportInput, ReportError>> = {}

  const type = input.reportType as ReportType
  if (!REPORT_TYPES.includes(type)) errors.reportType = 'typeRequired'

  const message = input.message.trim().replace(/\s+\n/g, '\n')
  if (message.length < MESSAGE_MIN) errors.message = 'messageTooShort'
  else if (message.length > MESSAGE_MAX) errors.message = 'messageTooLong'

  let fare: number | null = null
  const fareText = input.suggestedFare.trim()
  if (fareText !== '') {
    // Accept Urdu/Arabic-Indic digits too (۰-۹ / ٠-٩).
    const western = fareText
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    if (!/^\d{1,6}$/.test(western) || Number(western) < 1 || Number(western) > FARE_MAX) {
      errors.suggestedFare = 'fareInvalid'
    } else {
      fare = Number(western)
    }
  }

  const contact = input.contact.trim()
  if (contact.length > CONTACT_MAX) errors.contact = 'contactTooLong'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    report: { report_type: type, message, suggested_fare_pkr: fare, contact: contact === '' ? null : contact },
  }
}

/** Seconds the user must still wait before sending another report (0 = can send). */
export function cooldownRemaining(lastSentAt: number | null, now: number): number {
  if (lastSentAt === null || !Number.isFinite(lastSentAt) || lastSentAt > now) return 0
  const remaining = REPORT_COOLDOWN_MS - (now - lastSentAt)
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}
