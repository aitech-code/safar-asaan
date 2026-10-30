import type { CleanReport } from '../lib/reportValidation'

/** Minimal client shape (the real one is postgrest-js); keeps this testable. */
export interface InsertClient {
  from(table: string): {
    insert(row: Record<string, unknown>): PromiseLike<{ error: { message: string } | null }>
  }
}

export interface ReportContext {
  routeId: string | null
  language: 'en' | 'ur'
}

/**
  Sends a report. The public can INSERT but cannot read reports back,
  so we do not ask the database to return the new row.
*/
export async function submitReport(client: InsertClient, report: CleanReport, context: ReportContext): Promise<void> {
  const { error } = await client.from('route_reports').insert({
    ...report,
    route_id: context.routeId,
    language: context.language,
  })
  if (error) throw new Error(error.message)
}
