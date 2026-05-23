import { useState, useEffect } from 'react'
import { ArrowRight, Check, Eye, EyeOff } from 'lucide-react'
import GroveLogo from '../../components/layout/GroveLogo'
import { authApi as clientApi } from '../../api/auth.api'
import { useAuth } from '../../context/AuthContext'
import { getSubdomain } from '../../utils/domain'
import { Link } from "react-router-dom";

export default function ClientLoginPage() {
  const { saveSession, isAuth, user } = useAuth()
  const subdomain = getSubdomain()

  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [showPw, setShowPw]                 = useState(false)
  const [keepSignedIn, setKeepSignedIn]     = useState(true)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')


  const handleSubmit = async (e) => {
    e?.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      const res = await clientApi.clientLogin(
        { email: email.trim(), password },
        { headers: {'X-Tenant-Slug' : subdomain } }
      )

      const { access, user: u, tenant } = res.data

      saveSession({ accessToken: access, user: u, tenant })

      window.location.replace(
        `http://${tenant.slug}.lvh.me:5173/dashboard`
      )
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Invalid email or password.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Provider initials from subdomain
  const slugInitials = subdomain
    ? subdomain.slice(0, 2).toUpperCase()
    : 'GR'

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f8f7] px-4">
      <div className="w-full max-w-[440px] rounded-[28px] border border-[#e8eae8] bg-white px-8 py-11 shadow-[0px_8px_24px_rgba(0,0,0,0.06)] md:px-11">

        {/* Header */}
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0a2e24] text-[20px] font-medium tracking-[0.5px] text-white">
            {slugInitials}
          </div>

          <h1 className="mt-4 text-center text-[22px] font-semibold text-[#141a14]">
            {subdomain ? `${subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Workspace` : 'Client Portal'}
          </h1>

          <p className="mt-2 text-center text-[14px] text-[#9ea89e]">
            Welcome back to your project portal
          </p>

          <div className="mt-7 h-px w-full bg-[#e8eae8]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          {/* Email */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#4a544a]">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="meera@example.com"
              autoComplete="email"
              className="h-[46px] w-full rounded-[10px] border border-[#e8eae8] bg-white px-4 text-[14px] text-[#141a14] outline-none transition-all placeholder:text-[#9ea89e] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10"
            />
          </div>

          {/* Password */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-medium text-[#4a544a]">Password</label>
              <Link to="/forgot-password"
                className="text-[12px] font-medium text-[#0f6e56] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                className="h-[46px] w-full rounded-[10px] border border-[#e8eae8] bg-white px-4 pr-11 text-[14px] text-[#141a14] outline-none transition-all focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10"
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ea89e]"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Keep signed in */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setKeepSignedIn(s => !s)}
              className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                keepSignedIn ? 'border-[#0f6e56] bg-[#0f6e56]' : 'border-[#d8dcd8] bg-white'
              }`}
            >
              {keepSignedIn && <Check size={10} className="text-white" />}
            </button>
            <span className="text-[13px] text-[#4a544a]">Keep me signed in</span>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0f6e56] text-[14px] font-medium text-white transition-all hover:bg-[#0c5b47] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <>
                <ArrowRight size={15} />
                Sign in to your portal
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8">
          <div className="h-px w-full bg-[#e8eae8]" />
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <GroveLogo size="sm" variant="icon" />
            <span className="text-[11px] text-[#9ea89e]">Powered by Grove</span>
          </div>
        </div>
      </div>
    </div>
  )
}