import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/auth/RequireAuth'
import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PipelinePage from './pages/PipelinePage'
import DealDetailPage from './pages/DealDetailPage'
import ContactsPage from './pages/ContactsPage'
import ContactProfilePage from './pages/ContactProfilePage'
import CompaniesPage from './pages/CompaniesPage'
import CompanyProfilePage from './pages/CompanyProfilePage'
import ActivitiesPage from './pages/ActivitiesPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected — all share the Layout shell */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactProfilePage />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/companies/:id" element={<CompanyProfilePage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
