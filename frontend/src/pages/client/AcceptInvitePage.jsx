import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { clearAuth } from '../../features/auth/authSlice'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Check, Eye, EyeOff,
  Lock, MessageCircle, TrendingUp, Upload, AlertTriangle,
} from 'lucide-react'
import GroveLogo from '../../components/layout/GroveLogo'
import { authApi as clientApi } from '../../api/auth.api'
import { useAuth } from '../../context/AuthContext'
import { getSubdomain } from '../../utils/domain'

// ─── PASSWORD STRENGTH ────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' }
  let s = 0
  if (pw.length >= 8)              s++
  if (/[A-Z]/.test(pw))           s++
  if (/[0-9]/.test(pw))           s++
  if (/[^A-Za-z0-9]/.test(pw))   s++
  const levels = [
    { label: '',      color: '' },
    { label: 'Weak',  color: 'bg-red-400' },
    { label: 'Fair',  color: 'bg-yellow-400' },
    { label: 'Good',  color: 'bg-[#1d9e75]' },
    { label: 'Strong',color: 'bg-[#0f6e56]' },
  ]
  return { score: s, ...levels[s] }
}

// ─── FEATURE ROW ──────────────────────────────────────────────
function Feature({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1d9e75] text-white shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-[14px] font-medium text-white">{title}</h3>
        <p className="mt-1 text-[12px] leading-5 text-[#b3e0d1]">{desc}</p>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="my-5 h-px w-full bg-white/10" />
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function AcceptInvitePage() {
  const [searchParams]        = useSearchParams()
  const token                 = searchParams.get('token')
  const { saveSession }       = useAuth()

  // Token validation state
  const [validating, setValidating]     = useState(true)
  const [tokenError, setTokenError]     = useState('')
  const [inviteData, setInviteData]     = useState(null)   // {client_name, client_email, provider_name, workspace_name, tenant_slug}

  // Form state
  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState('')
  const [done, setDone]                 = useState(false)

  const dispatch = useDispatch()  // is this line present?
  
  const strength = getStrength(password)
  const pwMatch  = confirm && password === confirm

  // ── Validate token on mount ────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenError('No invite token found. Check your email link.')
      setValidating(false)
      return
    }

    clientApi.validateInviteToken(token)
      .then(res => {
        setInviteData(res.data.data)
      })
      .catch(err => {
        setTokenError(
          err?.response?.data?.message ||
          'This invite link is invalid or has expired.'
        )
      })
      .finally(() => setValidating(false))
  }, [token])

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError('')

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setSubmitError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await clientApi.acceptInvite({ token, password })
      console.log('accept response:', res.data)
      const { tenant } = res.data.data

      dispatch(clearAuth())

      setDone(true)

      // Redirect to client login on provider subdomain
      setTimeout(() => {
        window.location.replace(
          `http://${tenant.slug}.lvh.me:5173/client-login`
        )
      }, 1500)
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Provider initials for left panel
  const providerInitials = inviteData?.provider_name
    ? inviteData.provider_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  // ── LOADING ────────────────────────────────────────────────
  if (validating) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
      <div className="flex flex-col items-center gap-4">
        <svg className="h-8 w-8 animate-spin text-[#0f6e56]" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        <p className="text-[14px] text-[#9ea89e]">Validating your invite…</p>
      </div>
    </div>
  )

  // ── TOKEN ERROR ────────────────────────────────────────────
  if (tokenError) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6] px-4">
      <div className="w-full max-w-[420px] rounded-[24px] border border-[#e8eae8] bg-white p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f5dfb0] bg-[#fef3e2] mx-auto">
          <AlertTriangle size={28} className="text-[#92500a]" />
        </div>
        <h1 className="mt-6 text-[22px] font-semibold text-[#0a2e24]">Invalid invite link</h1>
        <p className="mt-3 text-[14px] leading-7 text-[#9ea89e]">{tokenError}</p>
        <p className="mt-6 text-[13px] text-[#9ea89e]">
          Contact your provider to resend the invite.
        </p>
      </div>
    </div>
  )

  // ── SUCCESS ────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6] px-4">
      <div className="w-full max-w-[420px] rounded-[24px] border border-[#b3e0d1] bg-white p-10 text-center shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#b3e0d1] bg-[#e6f5f0] mx-auto">
          <Check size={30} className="text-[#0f6e56]" />
        </div>
        <h1 className="mt-6 text-[22px] font-semibold text-[#0a2e24]">You're all set!</h1>
        <p className="mt-3 text-[14px] leading-7 text-[#9ea89e]">
          Taking you to your portal…
        </p>
      </div>
    </div>
  )

  // ── MAIN FORM ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="relative hidden lg:flex w-[42%] overflow-hidden bg-[#041c16]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(15,110,86,0.9)_0%,rgba(10,46,36,1)_55%,rgba(4,28,22,1)_100%)]" />
        <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-10 py-10">
          {/* Logo */}
          <GroveLogo size="md" variant="full" dark />

          {/* Center */}
          <div className="mx-auto flex w-full max-w-[420px] flex-col items-center">
            <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full bg-[#1d9e75] text-[28px] font-semibold tracking-wide text-white">
              {providerInitials}
            </div>
            <h2 className="mt-5 text-center text-[32px] font-semibold text-white">
              {inviteData?.workspace_name}
            </h2>
            <p className="mt-3 text-center text-[16px] text-[#b3e0d1]">
              has invited you to their Grove workspace
            </p>

            <div className="mt-12 w-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <Feature icon={<Upload size={14} />} title="Submit requests" desc="One place for all your work" />
              <Divider />
              <Feature icon={<TrendingUp size={14} />} title="Track progress" desc="Live status updates on every request" />
              <Divider />
              <Feature icon={<MessageCircle size={14} />} title="Message directly" desc={`Chat with ${inviteData?.provider_name} without switching apps`} />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 text-[12px] text-[#6ba898]">
            <Lock size={11} />
            <span>Your portal is private and secured</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-1 items-center justify-center bg-[#f8f8f6] px-6 py-12 lg:px-10">
        <div className="w-full max-w-[450px]">
          <div>
            <h1 className="text-[36px] font-bold tracking-[-1px] text-[#141a14]">
              You're invited, {inviteData?.client_name?.split(' ')[0]}!
            </h1>
            <p className="mt-2 text-[16px] leading-7 text-[#6b7a6b]">
              Set a password to access your private project portal.
            </p>
          </div>

          <div className="mt-10 space-y-6">
            {/* Email (read-only) */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#141a14]">Email address</label>
              <div className="relative">
                <input
                  disabled
                  type="email"
                  value={inviteData?.client_email || ''}
                  className="h-[52px] w-full rounded-[12px] border border-[#e7ebe7] bg-[#f7f8f7] px-4 pr-11 text-[14px] text-[#9ea89e] outline-none"
                />
                <Lock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a3aaa3]" />
              </div>
              <p className="mt-2 text-[12px] text-[#9ea89e]">This cannot be changed.</p>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#141a14]">Create a password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  className="h-[54px] w-full rounded-[12px] border border-[#e8eae8] bg-white px-4 pr-12 text-[14px] outline-none transition-all focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ea89e]"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-[4px] flex-1 rounded-full transition-all ${
                          i <= strength.score ? strength.color : 'bg-[#dfe3df]'
                        }`}
                      />
                    ))}
                    {strength.label && (
                      <span className={`ml-2 text-[11px] font-semibold ${
                        strength.score >= 3 ? 'text-[#0f6e56]' : 'text-[#92500a]'
                      }`}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                </div>
              )}
              <p className="mt-2 text-[12px] text-[#9ea89e]">Minimum 8 characters.</p>
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#141a14]">Confirm password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className={`h-[54px] w-full rounded-[12px] border bg-white px-4 pr-12 text-[14px] outline-none transition-all ${
                    confirm
                      ? pwMatch
                        ? 'border-[#1d9e75] ring-4 ring-[#1d9e75]/10'
                        : 'border-red-400 ring-4 ring-red-100'
                      : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10'
                  }`}
                />
                {confirm && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    {pwMatch
                      ? <Check size={16} className="text-[#1d9e75]" />
                      : <span className="text-[11px] text-red-400 font-medium">✗</span>
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
              {submitError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !password || !confirm}
            className="mt-8 flex h-[56px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#0f6e56] text-[15px] font-semibold text-white transition-all hover:bg-[#0c5b47] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <>
                <ArrowRight size={16} />
                Accept invite & enter portal
              </>
            )}
          </button>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-center gap-2">
            <GroveLogo size="sm" variant="icon" />
            <span className="text-[12px] text-[#9ea89e]">Powered by Grove</span>
          </div>
          <p className="mt-4 text-center text-[12px] text-[#9ea89e]">
            Wrong invite?{' '}
            <a href="mailto:support@grove.co" className="cursor-pointer text-[#0f6e56] underline">
              Contact support@grove.co
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}