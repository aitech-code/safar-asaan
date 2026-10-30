import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/useLanguage'

export function NotFoundPage() {
  const { t } = useLanguage()
  return (
    <section className="text-center">
      <h1 className="mb-4 text-xl font-bold">{t('notFoundTitle')}</h1>
      <Link to="/" className="font-semibold text-brand-700 underline">
        {t('backHome')}
      </Link>
    </section>
  )
}
