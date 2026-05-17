import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, GuestRoute } from './routes/ProtectedRoute'

import ErrorBoundary from './ErrorBoundary'

import LandingPage from './pages/LandingPage'
import SignupPage from './pages/SignupPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import WorkspaceSetupPage from './pages/WorkspaceSetupPage'

// temporary placeholders
const LoginPage = () => (
  <div className="min-h-screen flex items-center justify-center text-text-main">
    Login — next step
  </div>
)

const DashboardPage = () => (
  <div className="min-h-screen flex items-center justify-center text-text-main">
    Dashboard — next step
  </div>
)

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>

          <Routes>

            {/* PUBLIC LANDING PAGE */}
            <Route
              path="/"
              element={<LandingPage />}
            />

            {/* GUEST ROUTES */}
            <Route element={<GuestRoute />}>

              <Route
                path="/signup"
                element={<SignupPage />}
              />

              <Route
                path="/login"
                element={<LoginPage />}
              />

              <Route
                path="/verify-email"
                element={<VerifyEmailPage />}
              />

            </Route>

            {/* AUTH ROUTES */}
            <Route element={<ProtectedRoute />}>

              <Route
                path="/setup-workspace"
                element={<WorkspaceSetupPage />}
              />

              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

            </Route>

            {/* 404 FALLBACK */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />

          </Routes>

        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

