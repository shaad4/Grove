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

import groveLogo from "../assets/Grove_transparent_logo(Green).png";

export default function LoginPage() {
  const { saveSession } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] =
    useState(false)

  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
        email
      )
    ) {
      newErrors.email = 'Enter a valid email'
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password =
        'Password must be at least 6 characters'
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
      const { data } = await authApi.login({
        email,
        password,
      })

      saveSession({
        accessToken: data.access,
        user: data.user,
        tenant: data.user.tenantId,
      })

    } catch (err) {
      const d = err.response?.data

      if (d?.nonFieldErrors) {
        setError(d.nonFieldErrors[0])
      } else if (d?.email) {
        setError(d.email[0])
      } else if (d?.password) {
        setError(d.password[0])
      } else {
        setError(
          'Something went wrong. Please try again.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFA] flex">
      {/* LEFT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-10 lg:px-24">
        <div className="w-full max-w-md">
          {/* LOGO */}
          <div className="mb-10">
            <img
              src={groveLogo}
              alt="Grove"
              className="h-10 object-contain"
            />
          </div>

          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-[38px] leading-tight font-semibold text-[#0A2E24]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-[#8B948B]">
              Sign in to your Grove workspace.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle
                size={18}
                className="text-red-500 mt-0.5"
              />

              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-[#4A544A] mb-2">
                Email address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)

                  if (errors.email) {
                    setErrors((prev) => ({
                      ...prev,
                      email: '',
                    }))
                  }
                }}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                className={`w-full h-12 rounded-xl border bg-white px-4 text-sm outline-none transition-all
                  ${
                    errors.email
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-[#E5E7EB] focus:border-[#0F6E56]'
                  }
                `}
              />

              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#4A544A]">
                  Password
                </label>

                <Link
                    to="/forgot-password"
                    className="text-xs text-[#0F6E56] hover:underline"
                    >
                    Forgot password?
                    </Link>
              </div>

              <div className="relative">
                <input
                  type={
                    showPassword ? 'text' : 'password'
                  }
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)

                    if (errors.password) {
                      setErrors((prev) => ({
                        ...prev,
                        password: '',
                      }))
                    }
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full h-12 rounded-xl border bg-white px-4 pr-12 text-sm outline-none transition-all
                    ${
                      errors.password
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-[#E5E7EB] focus:border-[#0F6E56]'
                    }
                  `}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password}
                </p>
              )}

              {password &&
                /[A-Z]/.test(password) && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#9EA89E]">
                    <Lock size={12} />
                    Caps Lock may be on
                  </div>
                )}
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#0F6E56] hover:bg-[#0C5B48] text-white font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Signing in...'
                : 'Sign in'}
            </button>

            {/* TERMS */}
            <p className="text-center text-[11px] text-[#9EA89E] leading-5">
              By signing in you agree to our{' '}
              <span className="text-[#0F6E56] underline cursor-pointer">
                Terms
              </span>{' '}
              and{' '}
              <span className="text-[#0F6E56] underline cursor-pointer">
                Privacy Policy
              </span>
            </p>

            {/* DIVIDER */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="text-xs text-[#9EA89E]">
                or
              </span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            {/* GOOGLE */}
            <button
              type="button"
              className="w-full h-12 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#141A14] hover:bg-gray-50 transition-all"
            >
              Continue with Google
            </button>

            {/* SIGNUP */}
            <p className="text-center text-sm text-[#9EA89E]">
              Don't have a workspace?{' '}
              <Link
                to="/signup"
                className="text-[#0F6E56] font-medium underline"
              >
                Create one free
              </Link>
            </p>

            {/* CLIENT CARD */}
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F7F8F7] p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Lock
                    size={16}
                    className="text-[#9EA89E]"
                  />
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#4A544A]">
                    Are you a client?
                  </h3>

                  <p className="mt-2 text-xs text-[#9EA89E] leading-5">
                    Sign in at your provider's portal
                    link — for example,
                  </p>

                  <p className="text-xs text-[#0F6E56]">
                    arjundev.grove.co
                  </p>

                  <p className="mt-2 text-xs italic text-[#9EA89E]">
                    Check your invite email for the
                    right link.
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
            {/* STARS */}
            <div className="flex gap-1 text-[#0F6E56] mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill="currentColor"
                />
              ))}
            </div>

            {/* TESTIMONIAL */}
            <p className="text-[#141A14] text-lg italic leading-9">
              Grove changed how I handle client
              relationships entirely. Every project has
              a home now. My clients send me thank-you
              notes instead of chasing messages — that's
              never happened before.
            </p>

            {/* PROFILE */}
            <div className="flex items-center gap-4 mt-10">
              <div className="w-12 h-12 rounded-full bg-[#E6F5F0] flex items-center justify-center text-[#085041] font-semibold">
                NK
              </div>

              <div>
                <h4 className="font-medium text-[#141A14]">
                  Nisha Kreations
                </h4>

                <p className="text-sm text-[#9EA89E]">
                  UI/UX Freelancer · Grove Pro
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-6 border-t border-[#E5E7EB] pt-10">
          <div className="text-center">
            <h3 className="text-3xl font-semibold text-[#0A2E24]">
              500+
            </h3>

            <p className="text-sm text-[#9EA89E] mt-1">
              Workspaces created
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-semibold text-[#0A2E24]">
              3,200+
            </h3>

            <p className="text-sm text-[#9EA89E] mt-1">
              Client portals active
            </p>
          </div>

          <div className="text-center">
            <h3 className="text-3xl font-semibold text-[#0A2E24]">
              98%
            </h3>

            <p className="text-sm text-[#9EA89E] mt-1">
              Provider retention
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center text-xs text-[#9EA89E] mt-10">
          Your workspace data is encrypted in transit
          and at rest.
        </div>
      </div>
    </div>
  )
}