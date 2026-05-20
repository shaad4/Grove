import { useState } from 'react'
import { Bell, ChevronDown, Plus, Download, Check, LogOut } from 'lucide-react'
import GroveLogo from "../../components/layout/GroveLogo";
import { useAuth } from "../../context/AuthContext";

// ─── STATUS CONFIG ────────────────────────────────────────────
const STATUS_CONFIG = {
  received:    { label: 'Just submitted',    badge: 'bg-[#f7f8f7] text-[#9ea89e]',        step: 0 },
  in_review:   { label: 'We\'re looking at it', badge: 'bg-[#fef3e2] text-[#92500a]',    step: 1 },
  in_progress: { label: 'Work has started', badge: 'bg-[#eef2ff] text-[#3730a3]',          step: 2 },
  delivered:   { label: 'Ready for you ✓', badge: 'bg-[#e6f5f0] text-[#085041]',          step: 3 },
  closed:      { label: 'Done',             badge: 'bg-[#f7f8f7] text-[#9ea89e]',          step: 4 },
}

const TIMELINE_STEPS = ['Submitted', 'Being reviewed', 'Work started', 'Ready for you', 'Done']

// ─── COMPONENTS ───────────────────────────────────────────────

function TimelineItem({ title, stepIndex, activeStep }) {
  const completed = stepIndex < activeStep
  const current   = stepIndex === activeStep

  return (
    <div className="relative flex items-center gap-3">
      <div className={`relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 shrink-0 ${
        completed || current ? 'border-[#0f6e56] bg-white' : 'border-[#e8eae8] bg-white'
      }`}>
        {completed
          ? <Check size={11} className="text-[#0f6e56]" />
          : current
          ? <div className="h-[9px] w-[9px] rounded-full bg-[#0f6e56]" />
          : null
        }
      </div>
      <span className={`text-[12px] ${
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
          ? 'bg-[#0f6e56] text-white'
          : 'border border-[#e8eae8] bg-white text-[#4a544a] hover:border-[#0f6e56]/30'
      }`}
    >
      {label}
    </button>
  )
}

function RequestCard({ request, providerName }) {
  const cfg = STATUS_CONFIG[request.status] || STATUS_CONFIG.received
  const highlight = request.status === 'delivered'

  return (
    <div className={`overflow-hidden rounded-[18px] border border-[#e8eae8] bg-white shadow-sm ${
      highlight ? 'border-l-[4px] border-l-[#0f6e56]' : ''
    }`}>
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-[#141a14]">{request.title}</h3>
            <p className="mt-3 text-[12px] leading-6 text-[#4a544a]">{request.description}</p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end shrink-0">
            {highlight && (
              <span className="rounded-md bg-[#e6f5f0] px-2 py-1 text-[10px] font-medium text-[#085041]">
                Action needed
              </span>
            )}
            <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-[#e8eae8] pt-4">
          <span className="text-[11px] text-[#9ea89e]">
            Submitted {new Date(request.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
          </span>
          <button className={`text-[12px] ${highlight ? 'font-medium text-[#0f6e56]' : 'text-[#9ea89e]'}`}>
            View details →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { user, tenant, logout } = useAuth()
  const [filter, setFilter]       = useState('all')
  const [showUserMenu, setMenu]   = useState(false)

  // Requests — will come from API; using empty for now
  const requests = []

  const firstName = user?.display_name?.split(' ')[0] || 'there'
  const initials  = user?.display_name
    ? user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  const filtered = filter === 'all'
    ? requests
    : filter === 'open'
    ? requests.filter(r => !['delivered', 'closed'].includes(r.status))
    : requests.filter(r => r.status === 'closed')

  // Latest request for timeline
  const latestRequest = requests[0]
  const activeStep    = latestRequest
    ? STATUS_CONFIG[latestRequest.status]?.step ?? 0
    : -1

  return (
    <div className="min-h-screen bg-[#f7f8f7]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex h-[64px] items-center justify-between border-b border-[#e8eae8] bg-white px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <GroveLogo size="sm" variant="icon" />
          <div>
            <h1 className="text-[14px] font-medium text-[#141a14]">{tenant?.name || 'Your Portal'}</h1>
            <p className="text-[10px] text-[#9ea89e]">Powered by Grove</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Bell */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#e8eae8] bg-[#f7f8f7] hover:bg-[#eef0ee] transition-colors">
            <Bell size={17} className="text-[#4a544a]" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenu(s => !s)}
              className="flex items-center gap-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e6f5f0] text-[11px] font-semibold text-[#085041]">
                {initials}
              </div>
              <span className="text-[13px] font-medium text-[#141a14]">{firstName}</span>
              <ChevronDown size={14} className="text-[#9ea89e]" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-10 z-50 w-[160px] rounded-xl border border-[#e8eae8] bg-white shadow-lg overflow-hidden">
                <button
                  onClick={() => { setMenu(false); logout() }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-[13px] text-[#4a544a] hover:bg-[#f7f8f7] transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="flex flex-col gap-6 px-4 py-6 lg:flex-row lg:px-10">
        {/* LEFT SIDEBAR */}
        <aside className="w-full space-y-5 lg:w-[300px] lg:shrink-0">
          {/* Greeting Card */}
          <div className="rounded-[18px] border border-[#e8eae8] bg-white p-6 shadow-sm">
            <h2 className="text-[32px] font-semibold leading-none text-[#0a2e24]">
              Hi {firstName}! 👋
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-[#9ea89e]">
              Here's what's happening with your projects.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#1d9e75]" />
              <span className="text-[11px] text-[#85bdaa]">Updated just now</span>
            </div>
            <button className="mt-6 flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] bg-[#0f6e56] text-[13px] font-medium text-white shadow-lg shadow-[#0f6e56]/20 transition-all hover:bg-[#0c5b47]">
              <Plus size={15} />
              New request
            </button>
          </div>

          {/* Timeline */}
          <div className="rounded-[18px] border border-[#e8eae8] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.6px] text-[#9ea89e]">
              {latestRequest ? 'Your latest request is at:' : 'Request stages'}
            </p>
            <div className="relative mt-5 space-y-6 pl-6">
              <div className="absolute left-[10px] top-1 h-[calc(100%-8px)] w-[1.5px] bg-[#e8eae8]" />
              {TIMELINE_STEPS.map((step, i) => (
                <TimelineItem key={step} title={step} stepIndex={i} activeStep={activeStep} />
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-[18px] bg-[#0f6e56] p-5 text-white shadow-lg shadow-[#0f6e56]/20">
            <p className="text-[10px] uppercase tracking-[0.6px] text-[#85bdaa]">At a glance</p>
            <div className="mt-5 space-y-4">
              {[
                { label: 'Active requests',      value: requests.filter(r => !['closed'].includes(r.status)).length },
                { label: 'Completed this month', value: requests.filter(r => r.status === 'closed').length },
                { label: 'Awaiting your action', value: requests.filter(r => r.status === 'delivered').length },
              ].map(({ label, value }, i) => (
                <div key={label}>
                  {i > 0 && <div className="mb-4 h-px bg-white/10" />}
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-white/80">{label}</span>
                    <span className="text-[15px] font-semibold">{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="flex-1 min-w-0">
          {/* Top */}
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-[18px] font-semibold text-[#141a14]">Your requests</h2>
            <div className="flex items-center gap-2">
              <FilterButton label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
              <FilterButton label="Open" active={filter === 'open'} onClick={() => setFilter('open')} />
              <FilterButton label="Done" active={filter === 'done'} onClick={() => setFilter('done')} />
            </div>
          </div>

          {/* Empty state */}
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-[#e8eae8] bg-white px-8 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f5f0]">
                <Plus size={22} className="text-[#0f6e56]" />
              </div>
              <h3 className="mt-5 text-[16px] font-semibold text-[#141a14]">No requests yet</h3>
              <p className="mt-2 max-w-[260px] text-[13px] leading-6 text-[#9ea89e]">
                Submit your first request and track its progress here.
              </p>
              <button className="mt-6 flex items-center gap-2 rounded-xl bg-[#0f6e56] px-6 py-3 text-[13px] font-medium text-white hover:bg-[#0c5b47] transition-colors">
                <Plus size={15} />
                Submit first request
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(r => (
                <RequestCard
                  key={r.id}
                  request={r}
                  providerName={tenant?.name}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}