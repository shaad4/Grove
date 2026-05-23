import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  AlertCircle,
  Lock,
  Star,
} from 'lucide-react'

import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/auth.api'
import { useGoogleLogin } from '@react-oauth/google'

import groveLogo from "../assets/Grove_transparent_logo(Green).png"

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const { saveSession } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setError('')
      try {
        const { data } = await authApi.googleAuth(tokenResponse.access_token)
        saveSession({
          accessToken: data.access,
          user: data.user,
          tenant: data.tenant,
        })
        if (data.needs_workspace) {
          window.location.replace('http://lvh.me:5173/setup-workspace')
        } else {
          const slug = data.tenant?.slug
          window.location.replace(`http://${slug}.lvh.me:5173/dashboard`)
        }
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
          'Google sign-in failed. Please try again.'
        )
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: (err) => {
      console.error('Google OAuth error:', err)
      setError('Google sign-in failed. Please try again.')
    },
    flow: 'implicit',
  })

  const validate = () => {
    const newErrors = {}
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Enter a valid email'
    }
    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await authApi.login({ email, password })
      saveSession({
        accessToken: data.access,
        user: data.user,
        tenant: data.tenant,
      })
      const slug = data.tenant?.slug
      if (slug) {
        window.location.replace(`http://${slug}.lvh.me:5173/dashboard`)
      }
    } catch (err) {
      console.log('login error response:', err.response?.data)
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFA] flex">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 lg:px-24">
        <div className="w-full max-w-md">

          <div className="mb-10">
            <img src={groveLogo} alt="Grove" className="h-10 object-contain" />
          </div>

          <div className="mb-8">
            <h1 className="text-[38px] leading-tight font-semibold text-[#0A2E24]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-[#8B948B]">
              Sign in to your Grove workspace.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle size={18} className="text-red-500 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-[#4A544A] mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((p) => ({ ...p, email: '' }))
                }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className={`w-full h-12 rounded-xl border bg-white px-4 text-sm outline-none transition-all ${
                  errors.email
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#E5E7EB] focus:border-[#0F6E56]'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#4A544A]">Password</label>
                <Link to="/forgot-password" className="text-xs text-[#0F6E56] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: '' }))
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full h-12 rounded-xl border bg-white px-4 pr-12 text-sm outline-none transition-all ${
                    errors.password
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#E5E7EB] focus:border-[#0F6E56]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
              {password && /[A-Z]/.test(password) && (
                <div className="flex items-center gap-2 mt-2 text-xs text-[#9EA89E]">
                  <Lock size={12} />
                  Caps Lock may be on
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-12 rounded-xl bg-[#0F6E56] hover:bg-[#0C5B48] text-white font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="text-center text-[11px] text-[#9EA89E] leading-5">
              By signing in you agree to our{' '}
              <span className="text-[#0F6E56] underline cursor-pointer">Terms</span>{' '}
              and{' '}
              <span className="text-[#0F6E56] underline cursor-pointer">Privacy Policy</span>
            </p>

            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="text-xs text-[#9EA89E]">or</span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={() => googleLogin()}
              className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#141A14] hover:bg-[#F7F8F7] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
            >
              {googleLoading ? (
                <svg className="animate-spin h-4 w-4 text-[#9EA89E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <GoogleIcon />
              )}
              <span>{googleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            <p className="text-center text-sm text-[#9EA89E]">
              Don't have a workspace?{' '}
              <Link to="/signup" className="text-[#0F6E56] font-medium underline">
                Create one free
              </Link>
            </p>

            <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8F7] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Lock size={16} className="text-[#9EA89E]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#4A544A]">Are you a client?</h3>
                  <p className="mt-2 text-xs text-[#9EA89E] leading-5">
                    Sign in at your provider's portal link — for example,
                  </p>
                  <p className="text-xs text-[#0F6E56]">arjundev.grove.co</p>
                  <p className="mt-2 text-xs italic text-[#9EA89E]">
                    Check your invite email for the right link.
                  </p>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:flex w-1/2 bg-[#F7F8F7] px-12 py-16 flex-col justify-between">
        <div className="flex-1 flex items-center">
          <div className="w-full bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-10">
            <div className="flex gap-1 text-[#0F6E56] mb-6">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p className="text-[#141A14] text-lg italic leading-9">
              Grove changed how I handle client relationships entirely. Every project has
              a home now. My clients send me thank-you notes instead of chasing messages —
              that's never happened before.
            </p>
            <div className="flex items-center gap-4 mt-10">
              <div className="w-12 h-12 rounded-full bg-[#E6F5F0] flex items-center justify-center text-[#085041] font-semibold">
                NK
              </div>
              <div>
                <h4 className="font-medium text-[#141A14]">Nisha Kreations</h4>
                <p className="text-sm text-[#9EA89E]">UI/UX Freelancer · Grove Pro</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6 border-t border-[#E5E7EB] pt-10">
          <div className="text-center">
            <h3 className="text-3xl font-semibold text-[#0A2E24]">500+</h3>
            <p className="text-sm text-[#9EA89E] mt-1">Workspaces created</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-semibold text-[#0A2E24]">3,200+</h3>
            <p className="text-sm text-[#9EA89E] mt-1">Client portals active</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-semibold text-[#0A2E24]">98%</h3>
            <p className="text-sm text-[#9EA89E] mt-1">Provider retention</p>
          </div>
        </div>
        <div className="text-center text-xs text-[#9EA89E] mt-10">
          Your workspace data is encrypted in transit and at rest.
        </div>
      </div>
    </div>
  )
}