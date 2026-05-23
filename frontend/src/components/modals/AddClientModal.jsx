import { useState } from 'react'
import {
  X, Mail, ArrowRight, CheckCircle2,
  AlertTriangle, Copy, Plus, Info,
} from 'lucide-react'
import api from '../../api/client'
import { useAuth } from '../../context/AuthContext'

// ─── BACKDROP — defined outside to prevent remount on every render ─
function Backdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  )
}

// ─── FIELD HELPER ─────────────────────────────────────────────
function Field({ label, optional, children }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1">
        <label className="text-[13px] font-medium text-[#141a14]">{label}</label>
        {optional && <span className="text-[12px] text-[#9ea89e]">(optional)</span>}
      </div>
      {children}
    </div>
  )
}

// ─── MAIN MODAL ───────────────────────────────────────────────
export default function AddClientModal({ onClose, onSuccess }) {
  const { tenant } = useAuth()

  const [step, setStep]           = useState('form')
  const [loading, setLoading]     = useState(false)
  const [errorMsg, setErrorMsg]   = useState('')
  const [successData, setSuccess] = useState(null)

  const [form, setForm] = useState({
    client_name: '',
    client_email: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.client_name.trim() || form.client_name.trim().length < 2)
      errs.client_name = 'Name must be at least 2 characters.'
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(form.client_email.trim()))
      errs.client_email = 'Enter a valid email address.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await api.post('/clients/', {
        client_name:  form.client_name.trim(),
        client_email: form.client_email.trim(),
      })
      setSuccess(res.data.data)
      setStep('success')
      onSuccess?.()
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Something went wrong. Please try again.'
      setErrorMsg(msg)
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const resetToForm = () => {
    setStep('form')
    setForm({ client_name: '', client_email: '' })
    setFieldErrors({})
    setErrorMsg('')
    setSuccess(null)
  }

  // ── FORM STATE ────────────────────────────────────────────
  if (step === 'form') return (
    <Backdrop onClose={onClose}>
      <div className="w-full max-w-[560px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[28px] font-semibold text-[#0a2e24]">Add a new client</h2>
            <p className="mt-1 text-[14px] text-[#9ea89e]">
              They'll receive an invite to their own private portal.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f8f7] hover:bg-[#eef0ee] transition-colors"
          >
            <X size={18} className="text-[#9ea89e]" />
          </button>
        </div>

        <div className="my-6 h-px bg-[#e8eae8]" />

        <div className="space-y-5">
          <Field label="Client name">
            <input
              type="text"
              value={form.client_name}
              onChange={set('client_name')}
              placeholder="e.g. Meera Enterprises"
              className={`h-12 w-full rounded-xl border px-4 text-[14px] outline-none transition-all ${
                fieldErrors.client_name
                  ? 'border-red-400 ring-4 ring-red-100'
                  : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10'
              }`}
            />
            {fieldErrors.client_name && (
              <p className="mt-1.5 text-[12px] text-red-500">{fieldErrors.client_name}</p>
            )}
          </Field>

          <Field label="Email address">
            <div className="relative">
              <input
                type="email"
                value={form.client_email}
                onChange={set('client_email')}
                placeholder="meera@example.com"
                className={`h-12 w-full rounded-xl border px-4 pr-10 text-[14px] outline-none transition-all ${
                  fieldErrors.client_email
                    ? 'border-red-400 ring-4 ring-red-100'
                    : 'border-[#e8eae8] focus:border-[#0f6e56] focus:ring-4 focus:ring-[#0f6e56]/10'
                }`}
              />
              {form.client_email && !fieldErrors.client_email && (
                <CheckCircle2
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0f6e56]"
                />
              )}
            </div>
            {fieldErrors.client_email && (
              <p className="mt-1.5 text-[12px] text-red-500">{fieldErrors.client_email}</p>
            )}
          </Field>
        </div>

        <div className="mt-6 flex gap-4 rounded-xl border border-[#e8eae8] bg-[#f7f8f7] p-4">
          <Mail size={20} className="mt-0.5 text-[#9ea89e] shrink-0" />
          <div>
            <p className="text-[13px] text-[#4a544a]">
              <span className="font-medium text-[#141a14]">
                {form.client_name || 'Your client'}
              </span>{' '}
              will receive an invite email with a link to set their password and access their portal at
            </p>
            <p className="mt-1 text-[13px] font-medium text-[#0f6e56]">
              {tenant?.slug}.grove.co/client-login
            </p>
            <p className="mt-2 text-[12px] text-[#9ea89e]">
              The invite link expires in 48 hours.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f6e56] text-[14px] font-medium text-white hover:bg-[#0c5b47] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Sending invite…
              </span>
            ) : (
              <>Send invite <ArrowRight size={16} /></>
            )}
          </button>
          <button
            onClick={onClose}
            className="mt-3 w-full text-[13px] text-[#9ea89e] hover:text-[#4a544a] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Backdrop>
  )

  // ── SUCCESS STATE ─────────────────────────────────────────
  if (step === 'success') return (
    <Backdrop onClose={onClose}>
      <div className="relative w-full max-w-[500px] rounded-[24px] bg-white p-8 shadow-[0px_24px_32px_rgba(10,46,36,0.18)]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f8f7]"
        >
          <X size={18} className="text-[#9ea89e]" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#b3e0d1] bg-[#e6f5f0]">
            <CheckCircle2 size={32} className="text-[#0f6e56]" />
          </div>

          <h2 className="mt-6 text-[30px] font-semibold text-[#0a2e24]">Invite sent!</h2>

          <p className="mt-4 max-w-[320px] text-[14px] leading-7 text-[#9ea89e]">
            An invite has been sent to{' '}
            <span className="font-medium text-[#4a544a]">{successData?.email}</span>.{' '}
            Their portal is ready the moment they sign in.
          </p>

          <div className="mt-5 flex items-center gap-2 text-[13px]">
            <span className="text-[#9ea89e]">Portal link:</span>
            <span className="font-medium text-[#0f6e56]">
              {tenant?.slug}.grove.co/client-login
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(`https://${tenant?.slug}.grove.co/client-login`)}
              title="Copy link"
            >
              <Copy size={14} className="text-[#9ea89e] hover:text-[#0f6e56] transition-colors" />
            </button>
          </div>

          <div className="my-8 h-px w-full bg-[#e8eae8]" />

          <div className="flex w-full gap-3">
            <button
              onClick={resetToForm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#b3e0d1] bg-[#e6f5f0] py-3 text-[14px] font-medium text-[#085041] hover:bg-[#d4eddf] transition-colors"
            >
              <Plus size={16} />
              Add another
            </button>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-[#0f6e56] py-3 text-[14px] font-medium text-white hover:bg-[#0c5b47] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </Backdrop>
  )

  // ── ERROR STATE ───────────────────────────────────────────
  return (
    <Backdrop onClose={onClose}>
      <div className="relative w-full max-w-[430px] rounded-[24px] bg-white p-8 shadow-[0px_8px_20px_rgba(10,46,36,0.1)]">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8eae8]"
        >
          <X size={18} className="text-[#9ea89e]" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#f5dfb0] bg-[#fef3e2]">
            <AlertTriangle size={28} className="text-[#92500a]" />
          </div>

          <h2 className="mt-6 text-[28px] font-semibold text-[#0a2e24]">Something went wrong</h2>

          <p className="mt-4 max-w-[320px] text-[14px] leading-7 text-[#9ea89e]">
            {errorMsg}
          </p>

          <div className="my-8 h-px w-full bg-[#e8eae8]" />

          <div className="flex gap-3">
            <button
              onClick={resetToForm}
              className="rounded-xl bg-[#0f6e56] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#0c5b47] transition-colors"
            >
              Try again
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-[#e8eae8] bg-[#f7f8f7] px-6 py-3 text-[14px] font-medium text-[#4a544a] hover:bg-[#eef0ee] transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 flex items-start gap-2">
            <Info size={14} className="mt-0.5 text-[#9ea89e] shrink-0" />
            <p className="text-[12px] leading-5 text-[#9ea89e]">
              If this keeps happening, contact{' '}
              <a href="mailto:help@grove.co" className="font-medium text-[#0f6e56]">
                help@grove.co
              </a>
            </p>
          </div>
        </div>
      </div>
    </Backdrop>
  )
}