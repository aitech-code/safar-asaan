import { useLanguage } from '../i18n/useLanguage'
import { formatDate } from '../lib/display'
import type { Route } from '../types/transport'

/** Status is shown with a word AND a symbol, never by colour alone. */
export function VerificationBadge({ route, showDate = false }: { route: Route; showDate?: boolean }) {
  const { t, language } = useLanguage()

  const style = {
    verified: { label: t('badgeVerified'), icon: '✓', className: 'bg-emerald-100 text-emerald-900 ring-emerald-300' },
    unverified: { label: t('badgeUnverified'), icon: '!', className: 'bg-amber-100 text-amber-900 ring-amber-300' },
    outdated: { label: t('badgeOutdated'), icon: '!', className: 'bg-orange-100 text-orange-900 ring-orange-300' },
  }[route.verificationStatus]

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${style.className}`}>
        <span aria-hidden="true">{style.icon}</span>
        {style.label}
      </span>
      {route.isFictional && (
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">{t('fictionalTag')}</span>
      )}
      {showDate && (
        <span className="text-xs text-slate-600">
          {route.lastVerifiedAt
            ? t('lastVerified', { date: formatDate(route.lastVerifiedAt, language) })
            : t('neverVerified')}
        </span>
      )}
    </span>
  )
}
