import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, GuestRoute, SetupRoute } from './routes/ProtectedRoute'
import TenantRoute from './routes/TenantRoute'
import TenantGuard from './routes/TenantGuard'
import ErrorBoundary from './ErrorBoundary'
import { useAuth } from './context/AuthContext'

// Auth pages
import LandingPage        from './pages/LandingPage'
import SignupPage         from './pages/SignupPage'
import VerifyEmailPage    from './pages/VerifyEmailPage'
import WorkspaceSetupPage from './pages/WorkspaceSetupPage'
import LoginPage          from './pages/LoginPage'
import PortalsPage        from './pages/PortalsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import WorkspaceNotFoundPage from './pages/WorkspaceNotFoundPage'

// Client pages
import AcceptInvitePage from './pages/client/AcceptInvitePage'
import ClientLoginPage  from './pages/client/ClientLoginPage'
import ClientDashboard  from './pages/client/ClientDashboard'

// Provider pages
import ProviderDashboard from './pages/provider/ProviderDashboard'

function RoleDashboard() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user?.role === 'provider') return <ProviderDashboard />
  if (user?.role === 'client')   return <ClientDashboard />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <TenantGuard>
            <Routes>

              {/* Public  */}
              <Route path="/" element={<LandingPage />} />

              {/* Pre-auth pages no session needed */}
              <Route path="/accept-invite" element={<AcceptInvitePage />} />
              <Route path="/client-login"  element={<ClientLoginPage />} />

              {/* Guest only (redirect away if already logged in) */}
              <Route element={<GuestRoute />}>
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>

              {/* Portal picker (root domain, authenticated) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/portals" element={<PortalsPage />} />
              </Route>

              {/* Setup (authenticated but no portal yet) */}
              <Route element={<SetupRoute />}>
                <Route path="/setup-workspace" element={<WorkspaceSetupPage />} />
              </Route>

              {/* Protected tenant routes (subdomain required)*/}
              <Route element={<ProtectedRoute />}>
                {/* Provider dashboard */}
                <Route
                  path="/dashboard"
                  element={<TenantRoute><RoleDashboard /></TenantRoute>}
                />
                {/* Client portal separate path from /dashboard */}
                <Route
                  path="/portal"
                  element={<TenantRoute><RoleDashboard /></TenantRoute>}
                />
              </Route>

              {/*  Misc  */}
              <Route path="/workspace-not-found" element={<WorkspaceNotFoundPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </TenantGuard>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}