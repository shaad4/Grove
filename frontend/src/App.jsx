import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, GuestRoute, SetupRoute } from './routes/ProtectedRoute'
import TenantRoute from './routes/TenantRoute'
import ErrorBoundary from './ErrorBoundary'
import { useAuth } from './context/AuthContext'

// Auth pages
import LandingPage        from './pages/LandingPage'
import SignupPage         from './pages/SignupPage'
import VerifyEmailPage    from './pages/VerifyEmailPage'
import WorkspaceSetupPage from './pages/WorkspaceSetupPage'
import LoginPage          from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'

// Client pages
import AcceptInvitePage  from './pages/client/AcceptInvitePage'
import ClientLoginPage   from './pages/client/ClientLoginPage'
import ClientDashboard   from './pages/client/ClientDashboard'

// Provider pages
import ProviderDashboard from './pages/provider/ProviderDashboard'
import TenantGuard from './routes/TenantGuard'
import WorkspaceNotFoundPage from './pages/WorkspaceNotFoundPage'

// Role-based dashboard switcher
function RoleDashboard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role === 'client')   return <ClientDashboard />
  if (user?.role === 'provider') return <ProviderDashboard />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TenantGuard>
            <Routes>

              {/* PUBLIC LANDING */}
              <Route path="/" element={<LandingPage />} />

              {/* PUBLIC — no auth needed, lives on provider subdomain */}
              <Route path="/accept-invite"  element={<AcceptInvitePage />} />
              <Route path="/client-login"   element={<ClientLoginPage />} />

              {/* GUEST ROUTES — unauthenticated only */}
              <Route element={<GuestRoute />}>
                <Route path="/signup"          element={<SignupPage />} />
                <Route path="/login"           element={<LoginPage />} />
                <Route path="/verify-email"    element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password"  element={<ResetPasswordPage />} />
              </Route>

              {/* SETUP ROUTE — provider authenticated but no workspace yet */}
              <Route element={<SetupRoute />}>
                <Route path="/setup-workspace" element={<WorkspaceSetupPage />} />
              </Route>

              {/* PROTECTED TENANT ROUTES — authenticated + workspace required */}
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/dashboard"
                  element={
                    <TenantRoute>
                      <RoleDashboard />
                    </TenantRoute>
                  }
                />
              </Route>

              <Route path='/workspace-not-found' element={<WorkspaceNotFoundPage />} />

              {/* 404 FALLBACK */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </TenantGuard>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}