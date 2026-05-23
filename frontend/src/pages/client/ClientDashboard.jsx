import { useState } from 'react'
import { Bell, ChevronDown, Plus, Check, LogOut, User, Settings } from 'lucide-react'
import { useAuth } from "../../context/AuthContext";

// ─── STATUS CONFIG ────────────────────────────────────────────
const STATUS_CONFIG = {
  received:    { label: 'Just submitted',       badge: 'bg-[#f7f8f7] text-[#9ea89e] border border-[#e8eae8]',   step: 0 },
  in_review:   { label: "We're looking at it",  badge: 'bg-[#fef3e2] text-[#92500a] border border-[#fde8b4]',   step: 1 },
  in_progress: { label: 'Work has started',     badge: 'bg-[#eef2ff] text-[#3730a3] border border-[#c7d2fe]',   step: 2 },
  delivered:   { label: 'Ready for you ✓',      badge: 'bg-[#e6f5f0] text-[#085041] border border-[#a7d9c9]',   step: 3 },
  closed:      { label: 'Done',                 badge: 'bg-[#f7f8f7] text-[#9ea89e] border border-[#e8eae8]',   step: 4 },
}

const TIMELINE_STEPS = ['Submitted', 'Being reviewed', 'Work started', 'Ready for you', 'Done']

// ─── COMPONENTS ───────────────────────────────────────────────

function TimelineItem({ title, stepIndex, activeStep }) {
  const completed = stepIndex < activeStep
  const current   = stepIndex === activeStep

  return (
    <div className="relative flex items-center gap-3">
      <div className={`relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 shrink-0 transition-all ${
        completed || current ? 'border-[#0f6e56] bg-white' : 'border-[#e8eae8] bg-white'
      }`}>
        {completed
          ? <Check size={11} className="text-[#0f6e56]" />
          : current
          ? <div className="h-[9px] w-[9px] rounded-full bg-[#0f6e56]" />
          : null
        }
      </div>
      <span className={`text-[12px] transition-all ${
        completed || current ? 'font-semibold text-[#0f6e56]' : 'text-[#9ea89e]'
      }`}>
        {title}
      </span>
    </div>
  )
}

function FilterButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition-all ${
        active
          ? 'bg-[#0f6e56] text-white shadow-sm shadow-[#0f6e56]/20'
          : 'border border-[#e8eae8] bg-white text-[#4a544a] hover:border-[#0f6e56]/40 hover:text-[#0f6e56]'
      }`}
    >
      {label}
    </button>
  )
}

function RequestCard({ request }) {
  const cfg       = STATUS_CONFIG[request.status] || STATUS_CONFIG.received
  const highlight = request.status === 'delivered'

  return (
    <div className={`group overflow-hidden rounded-[18px] border bg-white transition-all hover:shadow-md ${
      highlight
        ? 'border-[#0f6e56]/30 shadow-sm shadow-[#0f6e56]/10'
        : 'border-[#e8eae8] shadow-sm hover:border-[#d0d5d0]'
    }`}>
      {/* delivered accent bar */}
      {highlight && (
        <div className="h-[3px] w-full bg-gradient-to-r from-[#0f6e56] to-[#1d9e75]" />
      )}

      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                highlight ? 'bg-[#0f6e56]' : request.status === 'in_progress' ? 'bg-[#3730a3]' : 'bg-[#e8eae8]'
              }`} />
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-[#141a14] truncate">{request.title}</h3>
                <p className="mt-1.5 text-[12px] leading-6 text-[#4a544a] line-clamp-2">{request.description}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 lg:items-end shrink-0 pl-5 lg:pl-0">
            {highlight && (
              <span className="rounded-md bg-[#0f6e56] px-2.5 py-1 text-[10px] font-semibold text-white tracking-wide">
                ACTION NEEDED
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-[#f0f2f0] pt-4">
          <span className="text-[11px] text-[#9ea89e]">
            Submitted {new Date(request.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </span>
          <button className={`text-[12px] font-medium transition-colors ${
            highlight ? 'text-[#0f6e56]' : 'text-[#9ea89e] group-hover:text-[#4a544a]'
          }`}>
            View details →
          </button>
        </div>
      </div>
    </div>
  )
}

// Provider brand initials avatar
function ProviderAvatar({ name }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#0a2e24] text-[11px] font-bold text-[#1d9e75] tracking-wide shrink-0">
      {initials}
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { user, tenant, logout } = useAuth()
  console.log('ClientDashboard user:', user)
  console.log('ClientDashboard tenant:', tenant)
  const [filter, setFilter]     = useState('all')
  const [showUserMenu, setMenu] = useState(false)

  // Requests — will come from API; using empty for now
  const requests = []

  const firstName = user?.display_name?.split(' ')[0] || 'there'
  const initials  = user?.display_name
    ? user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const providerName = tenant?.name || 'Your Portal'

  const filtered = filter === 'all'
    ? requests
    : filter === 'open'
    ? requests.filter(r => !['delivered', 'closed'].includes(r.status))
    : requests.filter(r => r.status === 'closed')

  const latestRequest = requests[0]
  const activeStep    = latestRequest
    ? STATUS_CONFIG[latestRequest.status]?.step ?? 0
    : -1

  // stats — kept identical to original logic
  const activeCount    = requests.filter(r => !['closed'].includes(r.status)).length
  const completedCount = requests.filter(r => r.status === 'closed').length
  const actionCount    = requests.filter(r => r.status === 'delivered').length

  return (
    <div className="min-h-screen bg-[#f7f8f7]">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-[#e8eae8] bg-white/95 backdrop-blur-sm px-5 lg:px-10">

        {/* Provider brand — replaces Grove logo */}
        <div className="flex items-center gap-2.5">
          <ProviderAvatar name={providerName} />
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[#141a14] leading-none">{providerName}</span>
            <span className="text-[10px] text-[#9ea89e] leading-none mt-0.5">Client portal</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <button className="relative flex h-8 w-8 items-center justify-center rounded-[9px] border border-[#e8eae8] bg-[#f7f8f7] hover:bg-[#eef0ee] transition-colors">
            <Bell size={15} className="text-[#4a544a]" />
          </button>

          {/* Divider */}
          <div className="h-5 w-px bg-[#e8eae8]" />

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenu(s => !s)}
              className="flex items-center gap-2 rounded-[9px] px-2 py-1.5 hover:bg-[#f7f8f7] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e6f5f0] text-[10px] font-semibold text-[#085041]">
                {initials}
              </div>
              <span className="hidden sm:block text-[13px] font-medium text-[#141a14]">{firstName}</span>
              <ChevronDown size={13} className={`text-[#9ea89e] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                {/* backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-10 z-50 w-[180px] rounded-[14px] border border-[#e8eae8] bg-white shadow-xl overflow-hidden">
                  {/* user info strip */}
                  <div className="px-4 py-3 border-b border-[#f0f2f0]">
                    <p className="text-[12px] font-semibold text-[#141a14] truncate">{user?.display_name}</p>
                    <p className="text-[11px] text-[#9ea89e] truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#4a544a] hover:bg-[#f7f8f7] transition-colors">
                      <Settings size={13} className="text-[#9ea89e]" />
                      Settings
                    </button>
                    <div className="mx-3 my-1 h-px bg-[#f0f2f0]" />
                    <button
                      onClick={() => { setMenu(false); logout() }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={13} />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── BODY ───────────────────────────────────────────────── */}
      <main className="flex flex-col gap-5 px-4 py-6 lg:flex-row lg:px-10">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────── */}
        <aside className="w-full space-y-4 lg:w-[280px] lg:shrink-0">

          {/* Greeting card */}
          <div className="rounded-[18px] border border-[#e8eae8] bg-white p-6 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-widest text-[#9ea89e]">
              {providerName}
            </p>
            <h2 className="mt-2 text-[28px] font-semibold leading-none text-[#0a2e24]">
              Hi {firstName}! 👋
            </h2>
            <p className="mt-3 text-[12px] leading-6 text-[#9ea89e]">
              Here's what's happening with your projects.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#1d9e75]" />
              <span className="text-[10px] text-[#85bdaa]">Updated just now</span>
            </div>
            <button className="mt-5 flex h-[42px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0f6e56] text-[13px] font-medium text-white transition-all hover:bg-[#0c5b47] active:scale-[0.98]">
              <Plus size={14} />
              New request
            </button>
          </div>

          {/* Timeline */}
          <div className="rounded-[18px] border border-[#e8eae8] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#9ea89e]">
              {latestRequest ? 'Latest request at' : 'Request stages'}
            </p>
            <div className="relative mt-5 space-y-5 pl-6">
              <div className="absolute left-[10px] top-1 h-[calc(100%-8px)] w-[1.5px] bg-[#e8eae8]" />
              {TIMELINE_STEPS.map((step, i) => (
                <TimelineItem key={step} title={step} stepIndex={i} activeStep={activeStep} />
              ))}
            </div>
          </div>

          {/* Stats card */}
          <div className="rounded-[18px] bg-[#0a2e24] p-5">
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#1d9e75]">
              At a glance
            </p>
            <div className="mt-4 space-y-0">
              {[
                { label: 'Active requests',       value: activeCount },
                { label: 'Completed this month',  value: completedCount },
                { label: 'Awaiting your action',  value: actionCount },
              ].map(({ label, value }, i) => (
                <div key={label}>
                  {i > 0 && <div className="my-3 h-px bg-white/[0.07]" />}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-white/60">{label}</span>
                    <span className="text-[16px] font-semibold text-white">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── RIGHT CONTENT ─────────────────────────────────────── */}
        <section className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-[#141a14]">Your requests</h2>
              {requests.length > 0 && (
                <p className="text-[12px] text-[#9ea89e] mt-0.5">
                  {requests.length} total · {actionCount} need attention
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FilterButton label="All"  active={filter === 'all'}  onClick={() => setFilter('all')}  />
              <FilterButton label="Open" active={filter === 'open'} onClick={() => setFilter('open')} />
              <FilterButton label="Done" active={filter === 'done'} onClick={() => setFilter('done')} />
            </div>
          </div>

          {/* Empty state */}
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-[#d0d5d0] bg-white px-8 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#e6f5f0]">
                <Plus size={22} className="text-[#0f6e56]" />
              </div>
              <h3 className="mt-5 text-[16px] font-semibold text-[#141a14]">No requests yet</h3>
              <p className="mt-2 max-w-[240px] text-[13px] leading-6 text-[#9ea89e]">
                Submit your first request and track its progress right here.
              </p>
              <button className="mt-6 flex items-center gap-2 rounded-[12px] bg-[#0f6e56] px-6 py-2.5 text-[13px] font-medium text-white hover:bg-[#0c5b47] transition-colors active:scale-[0.98]">
                <Plus size={14} />
                Submit first request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <RequestCard key={r.id} request={r} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}