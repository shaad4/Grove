import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react'
import WhiteLogo from '../../assets/Grove_transparent_logo(White).png'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients',   icon: Users,           label: 'Clients',  badgeKey: 'clients' },
  { to: '/requests',  icon: FolderKanban,    label: 'Requests', badgeKey: 'requests', badgeGreen: true },
  { to: '/activity',  icon: Activity,        label: 'Activity' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function ProviderSidebar({ badges = {} }) {
  const { user, tenant, logout } = useAuth()

  const initials = user?.display_name
    ? user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <aside className="hidden lg:flex w-[230px] flex-col bg-[#06281f] h-screen sticky top-0 shrink-0">

      {/* ── Logo + business name ───────────────────────────────── */}
      <div className="flex flex-col items-center px-5 pt-5 pb-4 border-b border-white/[0.07]">
        <img
          src={WhiteLogo}
          alt="Grove"
          className="h-[26px] w-auto object-contain select-none"
          draggable={false}
        />
        {tenant?.name && (
          <p className="mt-2 text-[10px] font-semibold text-white/40 tracking-[0.14em] uppercase text-center truncate w-full">
            {tenant.name}
          </p>
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="px-3 py-4 flex-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, badgeKey, badgeGreen }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `mb-0.5 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/55 hover:bg-white/5 hover:text-white/80'
              }`
            }
          >
            <Icon size={15} />
            <span className="flex-1 text-[13px]">{label}</span>
            {badgeKey && badges[badgeKey] != null && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                badgeGreen
                  ? 'bg-[#0f6e56] text-white'
                  : 'bg-white/10 text-white/70'
              }`}>
                {badges[badgeKey]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User footer ───────────────────────────────────────── */}
      <div className="border-t border-white/[0.07] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f6e56] text-xs font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-white truncate">{user?.display_name}</p>
            <p className="text-[10px] text-white/40 truncate">Free plan</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-[12px] w-full"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>

    </aside>
  )
}