import { useState, useEffect } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import ProviderLayout  from '../../components/layout/ProviderLayout'
import ProviderTopbar  from '../../components/layout/ProviderTopbar'
import AddClientModal  from '../../components/modals/AddClientModal'
import { useAuth }     from '../../context/AuthContext'
import  clientApi    from '../../api/client'


function StatCard({ title, value, sub, variant = 'neutral' }) {
  const subColor = {
    neutral: 'text-[#9ea89e]',
    warning: 'text-[#92500a]',
    success: 'text-[#085041]',
  }[variant]

  return (
    <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
      <p className="text-[11px] uppercase tracking-wide text-[#9ea89e]">{title}</p>
      <h2 className="mt-3 text-4xl font-semibold text-[#141a14]">{value ?? '—'}</h2>
      <p className={`mt-2 text-[12px] ${subColor}`}>{sub}</p>
    </div>
  )
}

function ClientCard({ initials, name, status, openCount, color }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#e8eae8] bg-white p-4">
      <div className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold shrink-0 ${color}`}>
          {initials}
        </div>
        <div>
          <p className="text-[14px] font-medium text-[#141a14]">{name}</p>
          <p className="text-[12px] text-[#9ea89e]">{status}</p>
        </div>
      </div>
      <span className="rounded-full bg-[#f7f8f7] px-3 py-1 text-[11px] text-[#4a544a]">
        {openCount} open
      </span>
    </div>
  )
}

function FeedItem({ color, text, time }) {
  return (
    <div className="flex gap-3 border-b border-[#f1f1f1] py-3 last:border-none">
      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${color}`} />
      <div>
        <p className="text-[13px] text-[#141a14]">{text}</p>
        <p className="mt-1 text-[11px] text-[#9ea89e]">{time}</p>
      </div>
    </div>
  )
}

// Initials + color from name
const AVATAR_COLORS = [
  'bg-[#e6f5f0] text-[#085041]',
  'bg-[#fef3e2] text-[#92500a]',
  'bg-[#eef2ff] text-[#3730a3]',
  'bg-[#fdf2f8] text-[#9d174d]',
]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function getColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

// ─── PAGE ─────────────────────────────────────────────────────

export default function ProviderDashboard() {
  const { tenant } = useAuth()
  const [showAddClient, setShowAddClient] = useState(false)
  const [clients, setClients]           = useState([])
  const [loadingClients, setLoading]    = useState(true)

  const fetchClients = async () => {
    try {
      const res = await clientApi.listClients()
      setClients(res.data.data.clients || [])
    } catch {
      // silently fail on dashboard — not critical
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClients() }, [])

  const clientCount   = clients.length
  // free plan limit is 3; this comes from your plan/tenant in future
  const clientLimit   = 3
  const usagePct      = Math.round((clientCount / clientLimit) * 100)
  const atLimit       = clientCount >= clientLimit

  return (
    <>
      <ProviderLayout
        badges={{ clients: clientCount, requests: 0 }}
        topbar={
          <ProviderTopbar
            title="Dashboard"
            liveIndicator
            onAddClient={() => setShowAddClient(true)}
            showAddBtn={!atLimit}
          />
        }
      >
        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div>
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Total Clients" value={clientCount} sub="in your workspace" />
              <StatCard title="Open Requests" value="—" sub="coming soon" variant="warning" />
              <StatCard title="Delivered" value="—" sub="this week" variant="success" />
            </div>

            {/* Clients section */}
            <div className="mt-8 mb-3 flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-[#141a14]">Clients</h3>
              <button className="text-[12px] font-medium text-[#0f6e56]">See all →</button>
            </div>

            {loadingClients ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-[68px] rounded-2xl border border-[#e8eae8] bg-white animate-pulse" />
                ))}
              </div>
            ) : clients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e8eae8] bg-white p-8 text-center">
                <p className="text-[14px] text-[#9ea89e]">No clients yet.</p>
                <button
                  onClick={() => setShowAddClient(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0f6e56] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#0c5b47] transition-colors"
                >
                  Add your first client
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map((c, i) => (
                  <ClientCard
                    key={c.id}
                    initials={getInitials(c.display_name)}
                    name={c.display_name}
                    status={c.last_login ? `Active recently` : 'Invite pending'}
                    openCount={0}
                    color={getColor(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Live feed placeholder */}
            <div className="rounded-2xl border border-[#e8eae8] bg-white">
              <div className="flex items-center justify-between border-b border-[#e8eae8] px-5 py-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium">Live feed</h3>
                  <div className="h-2 w-2 rounded-full bg-[#1d9e75] animate-pulse" />
                </div>
                <button className="text-[12px] text-[#0f6e56] hover:underline">Mark all read</button>
              </div>
              <div className="p-4">
                <FeedItem color="bg-green-500" text="Real-time feed coming soon" time="once WebSockets are connected" />
              </div>
            </div>

            {/* Plan usage */}
            <div className={`rounded-2xl border p-5 ${atLimit ? 'border-[#f5c6c6] bg-[#fff8f8]' : 'border-[#b3e0d1] bg-[#f0faf6]'}`}>
              <h3 className={`text-[14px] font-semibold ${atLimit ? 'text-[#92500a]' : 'text-[#085041]'}`}>
                Plan usage
              </h3>

              <div className="mt-5">
                <div className="mb-2 flex justify-between text-[12px] text-[#4a544a]">
                  <span>Clients · {clientCount} of {clientLimit} used</span>
                  <span>{usagePct}%</span>
                </div>
                <div className="h-[6px] rounded-full bg-[#e8eae8]">
                  <div
                    className={`h-full rounded-full transition-all ${atLimit ? 'bg-[#e24b4a]' : 'bg-[#0f6e56]'}`}
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
              </div>

              {atLimit ? (
                <div className="mt-6 rounded-xl bg-white/70 p-4">
                  <p className="text-[13px] font-medium text-[#92500a]">
                    You've reached your client limit.
                  </p>
                  <p className="mt-1 text-[12px] text-[#4a544a]">
                    Upgrade to Pro to add unlimited clients.
                  </p>
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f6e56] py-3 text-[13px] font-medium text-white hover:bg-[#0c5b47] transition-colors">
                    Upgrade to Pro
                    <ChevronRight size={15} />
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-[12px] text-[#4a544a]">
                  {clientLimit - clientCount} slot{clientLimit - clientCount !== 1 ? 's' : ''} remaining on Free plan.
                </p>
              )}
            </div>
          </div>
        </div>
      </ProviderLayout>

      {/* Add Client Modal */}
      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={() => {
            fetchClients()        // refresh client list
          }}
        />
      )}
    </>
  )
}