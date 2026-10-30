import { useLanguage } from '../i18n/useLanguage'

/**
  Always visible while the app uses sample data.
  Remove only when every route shown comes from verified records.
*/
export function DemoDataBanner() {
  const { t } = useLanguage()
  return (
    <div role="note" className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-900">
      <p className="mx-auto max-w-xl">
        <span aria-hidden="true">⚠ </span>
        {t('demoBanner')}
      </p>
    </div>
  )
}
