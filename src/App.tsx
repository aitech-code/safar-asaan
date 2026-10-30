import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TransportDataProvider } from './data/TransportDataProvider'
import { LanguageProvider } from './i18n/LanguageContext'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ReportPage } from './pages/ReportPage'
import { ResultsPage } from './pages/ResultsPage'
import { RouteDetailsPage } from './pages/RouteDetailsPage'

// Admin code (including the login library) is downloaded only when /admin is opened.
const AdminPage = lazy(() => import('./admin/AdminPage'))

/*
  Page map:
    /                         search form
    /results?from=&to=        direct-route results
    /route/:routeId?from=&to= route details with ordered stops
    /report?route=&type=      correction report form
    /admin                    protected admin dashboard
*/
export default function App() {
  return (
    <LanguageProvider>
      <TransportDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="route/:routeId" element={<RouteDetailsPage />} />
              <Route path="report" element={<ReportPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route
              path="admin"
              element={
                <Suspense fallback={<p className="p-6">Loading admin…</p>}>
                  <AdminPage />
                </Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </TransportDataProvider>
    </LanguageProvider>
  )
}
