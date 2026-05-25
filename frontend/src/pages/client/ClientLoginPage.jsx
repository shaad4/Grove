import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

import groveLogoGreen from "../../assets/Grove_transparent_logo(Green).png"
import groveLogoWhite from "../../assets/Grove_transparent_logo(White).png"


import { authApi } from '../../api/auth.api'
import { useAuth } from '../../context/AuthContext'
import { getSubdomain } from '../../utils/domain'
// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const BASE_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'lvh.me'
const PORT        = import.meta.env.VITE_PORT || '5173'
const IS_PROD     = import.meta.env.PROD

function rootUrl(path) {
  return IS_PROD
    ? `https://${BASE_DOMAIN}${path}`
    : `http://${BASE_DOMAIN}:${PORT}${path}`
}

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getWorkspaceHue(name = '') {
  return name
    ? name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    : 152
}

// ─────────────────────────────────────────────────────────────
// Background
// ─────────────────────────────────────────────────────────────

function LeftPanelBg({ name }) {

  const hue = getWorkspaceHue(name)

  const c1 = `hsl(${hue}, 52%, 24%)`
  const c2 = `hsl(${(hue + 25) % 360}, 50%, 16%)`
  const c3 = `hsl(${(hue + 15) % 360}, 45%, 20%)`

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        background: `
          radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 40%),
          radial-gradient(circle at bottom right, rgba(255,255,255,0.04), transparent 40%),
          linear-gradient(145deg, ${c1}, ${c2} 58%, ${c3})
        `,
      }}
    >

      {/* GRID */}

      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
        }}
      >
        <defs>
          <pattern
            id="dots"
            x="0"
            y="0"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="1.5"
              cy="1.5"
              r="1.5"
              fill="white"
            />
          </pattern>
        </defs>

        <rect
          width="100%"
          height="100%"
          fill="url(#dots)"
        />
      </svg>

      {/* BLOBS */}

      <div
        style={{
          position: 'absolute',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          filter: 'blur(14px)',
          top: -120,
          right: -120,
        }}
      />

      <div
        style={{
          position: 'absolute',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          bottom: 40,
          left: -80,
        }}
      />

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────

function TenantAvatar({
  name,
  logoUrl,
  size = 64,
}) {

  const initials = getInitials(name || '')

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: 18,
          objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 18,

        background: 'rgba(255,255,255,0.12)',

        border: '1px solid rgba(255,255,255,0.16)',

        backdropFilter: 'blur(10px)',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.32,
        letterSpacing: '0.04em',
      }}
    >
      {initials || '?'}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export default function ClientLoginPage() {

  const { saveSession } = useAuth()

  const subdomain = getSubdomain()

  const [tenant, setTenant] = useState(null)
  const [tenantErr, setTenantErr] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [showPw, setShowPw] = useState(false)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  useEffect(() => {

    authApi.getTenantInfo()
      .then(res => setTenant(res.data))
      .catch(() => setTenantErr(true))

  }, [])

  const handleSubmit = async (e) => {

    e.preventDefault()

    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)

    try {

      const res = await authApi.clientLogin({
        email: email.trim(),
        password,
      })

      const {
        access,
        user,
        tenant: t,
      } = res.data

      saveSession({
        accessToken: access,
        user,
        tenant: t,
      })

      window.location.replace(
        IS_PROD
          ? `https://${t.slug}.${BASE_DOMAIN}/portal`
          : `http://${t.slug}.${BASE_DOMAIN}:${PORT}/portal`
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

  const workspaceName = tenant?.name || (
    subdomain
      ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1)
      : 'Your Portal'
  )

  const hue = getWorkspaceHue(workspaceName)

  const accent = `hsl(${hue}, 65%, 40%)`
  const accentDark = `hsl(${hue}, 60%, 28%)`
  const accentSoft = `hsla(${hue}, 65%, 45%, 0.08)`

  return (
    <>
      <style>{`

        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'DM Sans', sans-serif;
        }

        .cl-root {

          min-height: 100svh;

          display: flex;

          background:
            radial-gradient(circle at top left, ${accentSoft} 0%, #F7F8F7 38%),
            linear-gradient(to bottom right, #F7FAF8, #F3F6F4);
        }

        /* LEFT */

        .cl-left {

          display: none;

          position: relative;

          flex-direction: column;
          justify-content: space-between;

          padding: 44px;

          overflow: hidden;
        }

        @media (min-width: 900px) {

          .cl-left {
            display: flex;
            flex: 0 0 450px;
          }

        }

        .cl-left-logo {
          position: relative;
          z-index: 2;
          display: inline-flex;
          width: fit-content;
        }

        .cl-grove-logo {
          height: 34px;
          width: auto;
          object-fit: contain;
        }

        .cl-left-body {
          position: relative;
          z-index: 2;
          animation: fadeUp 0.6s ease both;
        }

        .cl-workspace-avatar {
          margin-bottom: 26px;
        }

        .cl-workspace-name {

          font-family: 'Instrument Serif', serif;

          font-size: 40px;

          line-height: 1.08;

          font-weight: 400;

          color: white;

          letter-spacing: -0.04em;

          margin-bottom: 18px;
        }

        .cl-workspace-name em {
          font-style: italic;
          color: rgba(255,255,255,0.68);
        }

        .cl-workspace-tagline {

          max-width: 290px;

          font-size: 14px;

          line-height: 1.75;

          color: rgba(255,255,255,0.62);
        }

        .cl-left-footer {

          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;
          gap: 10px;

          font-size: 12px;

          color: rgba(255,255,255,0.42);
        }

        .cl-left-footer a {

          color: rgba(255,255,255,0.72);

          text-decoration: none;

          transition: 0.2s;
        }

        .cl-left-footer a:hover {
          color: white;
        }

        .cl-dot {

          width: 4px;
          height: 4px;

          border-radius: 50%;

          background: rgba(255,255,255,0.28);
        }

        /* RIGHT */

        .cl-right {

          flex: 1;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 48px 24px;

          position: relative;

          overflow: hidden;
        }

        .cl-right::before {

          content: '';

          position: absolute;

          width: 560px;
          height: 560px;

          border-radius: 50%;

          background: ${accentSoft};

          filter: blur(90px);

          top: -180px;
          right: -160px;
        }

        .cl-form-wrap {

          width: 100%;
          max-width: 440px;

          padding: 38px;

          border-radius: 30px;

          background:
            linear-gradient(
              to bottom right,
              rgba(255,255,255,0.84),
              rgba(255,255,255,0.72)
            );

          border: 1px solid rgba(255,255,255,0.8);

          backdrop-filter: blur(18px);

          box-shadow:
            0 10px 40px rgba(0,0,0,0.04),
            0 8px 24px ${accentSoft};

          position: relative;
          z-index: 2;

          animation: fadeUp 0.5s ease both;
        }

        /* MOBILE */

        /* MOBILE */

        @media (max-width: 899px) {

          .cl-root {

            background: #F6F7F6;
          }

          .cl-right {

            align-items: center;

            justify-content: center;

            padding: 20px 16px;
          }

          .cl-right::before {
            display: none;
          }

          .cl-form-wrap {

            max-width: 100%;

            min-height: auto;

            border-radius: 26px;

            padding: 28px 22px;

            background: rgba(255,255,255,0.92);

            border: 1px solid rgba(0,0,0,0.04);

            backdrop-filter: blur(14px);

            box-shadow:
              0 8px 30px rgba(0,0,0,0.05);

          }

          .cl-heading {

            font-size: 28px;

            margin-bottom: 6px;
          }

          .cl-subheading {

            font-size: 13px;

            margin-bottom: 26px;

            line-height: 1.6;
          }

          .cl-input {

            height: 52px;

            border-radius: 14px;

            font-size: 14px;
          }

          .cl-submit {

            height: 54px;

            border-radius: 15px;
          }

          .cl-provider-link {

            margin-top: 18px;

            font-size: 12px;
          }

          .cl-powered {
            display: none;
          }

        }

        /* MOBILE BRAND */

        .cl-mobile-brand {

          display: flex;

          flex-direction: column;

          align-items: flex-start;

          text-align: left;

          margin-bottom: 28px;
        }

        @media (min-width: 900px) {

          .cl-mobile-brand {
            display: none;
          }

        }

        .cl-mobile-name {

          margin-top: 0;

          font-size: 14px;

          font-weight: 600;

          color: #7A847D;

          letter-spacing: -0.01em;
        }

        .cl-mobile-sub {
          display: none;
        }

        /* HEAD */

        .cl-heading {

          font-size: 28px;

          font-weight: 700;

          color: #111815;

          letter-spacing: -0.04em;

          margin-bottom: 8px;
        }

        .cl-subheading {

          font-size: 14px;

          line-height: 1.6;

          color: #738076;

          margin-bottom: 32px;
        }

        /* FIELD */

        .cl-field {
          margin-bottom: 18px;
        }

        .cl-label {

          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 8px;

          font-size: 13px;
          font-weight: 600;

          color: #4C564F;
        }

        .cl-label a {

          font-size: 12px;

          color: ${accent};

          text-decoration: none;
        }

        .cl-input-wrap {
          position: relative;
        }

        .cl-input {

          width: 100%;
          height: 54px;

          border-radius: 15px;

          border: 1.5px solid rgba(0,0,0,0.06);

          background: rgba(255,255,255,0.92);

          padding: 0 16px;

          font-size: 14px;

          color: #111815;

          outline: none;

          transition: 0.18s;
        }

        .cl-input::placeholder {
          color: #B0B8B2;
        }

        .cl-input:focus {

          border-color: ${accent};

          box-shadow:
            0 0 0 4px ${accentSoft};

          background: white;
        }

        .cl-input.has-suffix {
          padding-right: 50px;
        }

        .cl-pw-toggle {

          position: absolute;

          top: 50%;
          right: 14px;

          transform: translateY(-50%);

          border: none;
          background: none;

          color: #9DA79F;

          cursor: pointer;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ERROR */

        .cl-error {

          display: flex;
          align-items: flex-start;
          gap: 8px;

          padding: 12px 14px;

          background: #FEF2F2;

          border: 1px solid #FECACA;

          border-radius: 12px;

          font-size: 13px;

          color: #991B1B;

          margin-bottom: 18px;
        }

        /* BUTTON */

        .cl-submit {

          width: 100%;
          height: 56px;

          border: none;

          border-radius: 16px;

          background:
            linear-gradient(
              135deg,
              ${accent},
              ${accentDark}
            );

          color: white;

          font-size: 14px;
          font-weight: 600;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          cursor: pointer;

          transition: 0.2s;

          box-shadow:
            0 10px 24px ${accentSoft};
        }

        .cl-submit:hover:not(:disabled) {

          transform: translateY(-1px);

          filter: brightness(0.96);
        }

        .cl-submit:disabled {
          opacity: 0.64;
          cursor: not-allowed;
        }

        /* DIVIDER */

        .cl-divider-line {

          margin-top: 24px;

          height: 1px;

          background: rgba(0,0,0,0.06);
        }

        /* PROVIDER */

        .cl-provider-link {

          margin-top: 20px;

          display: flex;
          justify-content: center;

          font-size: 13px;

          color: #8A948D;
        }

        .cl-provider-link a {

          color: ${accent};

          text-decoration: none;

          font-weight: 600;
        }

        /* POWERED */

        .cl-powered {

          margin-top: 28px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;

          font-size: 12px;

          color: #A0A8A1;
        }

        .cl-powered-logo-wrap {
          display: flex;
          align-items: center;
        }

        .cl-powered-logo {
          height: 18px;
          width: auto;
          opacity: 0.9;
        }

        /* SPINNER */

        .cl-spinner {

          width: 18px;
          height: 18px;

          border-radius: 50%;

          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;

          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {

          to {
            transform: rotate(360deg);
          }

        }

        /* NOT FOUND */

        .cl-not-found {
          text-align: center;
          padding: 24px;
        }

        .cl-not-found h2 {

          font-size: 20px;

          color: #111815;

          margin-bottom: 10px;
        }

        .cl-not-found p {

          font-size: 14px;

          color: #7D8780;
        }

        /* MOBILE */

        @media (max-width: 899px) {

          .cl-root {

            background:
              linear-gradient(
                to bottom,
                ${accentDark} 0%,
                ${accent} 34%,
                #F7F8F7 34%,
                #F7F8F7 100%
              );
          }

          .cl-right {

            align-items: stretch;

            justify-content: flex-start;

            padding: 42px 18px 0;
          }

          .cl-form-wrap {

            max-width: 100%;

            min-height: calc(100svh - 170px);

            border-radius: 30px 30px 0 0;

            padding: 30px 24px;
          }

          .cl-heading {
            font-size: 26px;
          }

        }

        @keyframes fadeUp {

          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }

      `}</style>

      <div className="cl-root">

        {/* LEFT */}

        <div className="cl-left">

          <LeftPanelBg name={workspaceName} />

          <a
            href={rootUrl('/')}
            className="cl-left-logo"
          >

            <img
              src={groveLogoWhite}
              alt="Grove"
              className="cl-grove-logo"
            />

          </a>

          <div className="cl-left-body">

            <div className="cl-workspace-avatar">

              <TenantAvatar
                name={workspaceName}
                logoUrl={tenant?.logo_url}
                size={70}
              />

            </div>

            <h1 className="cl-workspace-name">

              {workspaceName}

              <br />

              <em>client portal</em>

            </h1>

            <p className="cl-workspace-tagline">

              Sign in to manage requests, collaborate
              with your provider, and stay synced with
              your workflow.

            </p>

          </div>

          <div className="cl-left-footer">

            <span>Powered by Grove</span>

            <div className="cl-dot" />

            <a href={rootUrl('/login')}>
              Provider sign in
            </a>

          </div>

        </div>

        {/* RIGHT */}

        <div className="cl-right">

          <div className="cl-form-wrap">

            {tenantErr ? (

              <div className="cl-not-found">

                <h2>Workspace not found</h2>

                <p>
                  This portal doesn't exist or has been deactivated.
                </p>

              </div>

            ) : (

              <>

                {/* MOBILE */}

                <div className="cl-mobile-brand">

                  <p className="cl-mobile-name">
                    {workspaceName}
                  </p>

                </div>

                {/* HEAD */}

                <h2 className="cl-heading">
                  Welcome back
                </h2>

                <p className="cl-subheading">
                  Sign in to access your {workspaceName} workspace.
                </p>

                {/* FORM */}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                >

                  {/* EMAIL */}

                  <div className="cl-field">

                    <div className="cl-label">
                      <span>Email address</span>
                    </div>

                    <div className="cl-input-wrap">

                      <input
                        className="cl-input"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        autoFocus
                        required
                      />

                    </div>

                  </div>

                  {/* PASSWORD */}

                  <div className="cl-field">

                    <div className="cl-label">

                      <span>Password</span>

                      <Link to="/forgot-password">
                        Forgot password?
                      </Link>

                    </div>

                    <div className="cl-input-wrap">

                      <input
                        className="cl-input has-suffix"
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Your password"
                        autoComplete="current-password"
                        required
                      />

                      <button
                        type="button"
                        className="cl-pw-toggle"
                        onClick={() => setShowPw(v => !v)}
                      >

                        {showPw
                          ? <EyeOff size={17} />
                          : <Eye size={17} />
                        }

                      </button>

                    </div>

                  </div>

                  {/* ERROR */}

                  {error && (

                    <div
                      className="cl-error"
                      role="alert"
                    >

                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      >

                        <circle
                          cx="8"
                          cy="8"
                          r="7"
                          stroke="#991B1B"
                          strokeWidth="1.3"
                        />

                        <path
                          d="M8 5v3.5M8 10.5v.5"
                          stroke="#991B1B"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />

                      </svg>

                      {error}

                    </div>

                  )}

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className="cl-submit"
                    disabled={loading}
                  >

                    {loading ? (

                      <div className="cl-spinner" />

                    ) : (

                      <>

                        Sign in to portal

                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >

                          <path
                            d="M3 8h10M9 4l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                        </svg>

                      </>

                    )}

                  </button>

                </form>

                <div className="cl-divider-line" />

                {/* PROVIDER */}

                <div className="cl-provider-link">

                  Are you a provider?&nbsp;

                  <a href={rootUrl('/login')}>
                    Sign in at grove.co
                  </a>

                </div>

                {/* POWERED */}

                <div className="cl-powered">

                  <span>Powered by</span>

                  <a
                    href={rootUrl('/')}
                    className="cl-powered-logo-wrap"
                  >

                    <img
                      src={groveLogoGreen}
                      alt="Grove"
                      className="cl-powered-logo"
                    />

                  </a>

                </div>

              </>

            )}

          </div>

        </div>

      </div>

    </>
  )
}