import { useLanguage } from '../i18n/useLanguage'
import type { FareInfo } from '../lib/routeSearch'

/** Shows a fare ONLY when it is verified; otherwise a clear "not verified" message. */
export function FareDisplay({ fare }: { fare: FareInfo }) {
  const { t } = useLanguage()

  if (fare.status !== 'verified') {
    return (
      <p className="text-sm font-medium text-amber-800">
        <span aria-hidden="true">! </span>
        {t('fareNotVerified')}
      </p>
    )
  }

  return (
    <p className="text-sm">
      <span className="font-semibold">{t('fareLabel')}: </span>
      <span className="font-bold text-slate-900">{t('fareAmount', { amount: fare.amountPkr })}</span>
    </p>
  )
}
