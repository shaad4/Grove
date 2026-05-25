import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Check, ChevronDown, ExternalLink } from 'lucide-react'
import {
  selectCurrentUser,
  selectTenant,
  selectMemberships,
  selectTotalPortalCount,
} from '../../features/auth/authSlice'


function PortalAvatar({ name, logo, size = 'sm' }) {
  const initials = name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??'

  const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'

  if (logo) {
    return <img src={logo} alt={name} className={`${sizeClass} rounded-md object-cover`} />
  }

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-md bg-[#0F6E56] font-semibold text-white`}>
      {initials}
    </div>
  )
}

//Main component 

export default function PortalSwitcher({ dark = false }) {
  const user         = useSelector(selectCurrentUser)
  const tenant       = useSelector(selectTenant)
  const memberships  = useSelector(selectMemberships)
  const totalPortals = useSelector(selectTotalPortalCount)

  const [open, setOpen] = useState(false)
  const ref             = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const providerPortals = memberships?.provider_portals ?? []
  const clientPortals   = memberships?.client_portals   ?? []

  const goTo = (slug, role) => {
    setOpen(false)
    const path = role === 'provider' ? 'dashboard' : 'portal'
    window.location.replace(`http://${slug}.lvh.me:5173/${path}`)
  }

  const textColor    = dark ? 'text-white'          : 'text-[#141A14]'
  const subTextColor = dark ? 'text-white/50'        : 'text-[#9EA89E]'
  const hoverBg      = dark ? 'hover:bg-white/10'    : 'hover:bg-[#F3F4F3]'
  const borderColor  = dark ? 'border-white/10'      : 'border-[#E8EAE8]'
  const dropdownBg   = dark ? 'bg-[#0A2E24]'         : 'bg-white'
  const dropdownBorder = dark ? 'border-white/10'    : 'border-[#E8EAE8]'
  const activeBg     = dark ? 'bg-white/10'          : 'bg-[#F7F8F7]'

  // No switcher needed for single-portal users
  const showDropdown = totalPortals > 1

  return (
    <div className="relative" ref={ref}>

      {/* Trigger button */}
      <button
        onClick={() => showDropdown && setOpen(v => !v)}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-all ${
          showDropdown ? hoverBg + ' cursor-pointer' : 'cursor-default'
        }`}
      >
        <PortalAvatar name={tenant?.name} logo={tenant?.logo_url} size="sm" />

        <div className="min-w-0 flex-1 text-left">
          <p className={`truncate text-[13px] font-medium ${textColor}`}>
            {tenant?.name ?? 'Grove'}
          </p>
          <p className={`text-[10px] ${subTextColor}`}>
            {user?.role === 'provider' ? 'Your portal' : 'Client'}
          </p>
        </div>

        {showDropdown && (
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform ${subTextColor} ${open ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute left-0 top-full z-50 mt-1 w-[220px] rounded-xl border ${dropdownBorder} ${dropdownBg} shadow-lg`}>

          {/* Provider portals */}
          {providerPortals.length > 0 && (
            <div className="p-1.5">
              <p className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${subTextColor}`}>
                Your portal
              </p>
              {providerPortals.map(portal => {
                const isCurrent = portal.tenant_slug === tenant?.slug
                return (
                  <button
                    key={portal.tenant_slug}
                    onClick={() => !isCurrent && goTo(portal.tenant_slug, 'provider')}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all ${
                      isCurrent ? activeBg + ' cursor-default' : hoverBg
                    }`}
                  >
                    <PortalAvatar name={portal.tenant_name} logo={portal.tenant_logo} size="sm" />
                    <span className={`flex-1 truncate text-[13px] ${textColor}`}>
                      {portal.tenant_name}
                    </span>
                    {isCurrent && <Check size={13} className="shrink-0 text-[#0F6E56]" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Divider between sections */}
          {providerPortals.length > 0 && clientPortals.length > 0 && (
            <div className={`mx-1.5 border-t ${borderColor}`} />
          )}

          {/* Client portals */}
          {clientPortals.length > 0 && (
            <div className="p-1.5">
              <p className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${subTextColor}`}>
                Portals you've joined
              </p>
              {clientPortals.map(portal => {
                const isCurrent = portal.tenant_slug === tenant?.slug
                return (
                  <button
                    key={portal.tenant_slug}
                    onClick={() => !isCurrent && goTo(portal.tenant_slug, 'client')}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-all ${
                      isCurrent ? activeBg + ' cursor-default' : hoverBg
                    }`}
                  >
                    <PortalAvatar name={portal.tenant_name} logo={portal.tenant_logo} size="sm" />
                    <span className={`flex-1 truncate text-[13px] ${textColor}`}>
                      {portal.tenant_name}
                    </span>
                    {isCurrent && <Check size={13} className="shrink-0 text-[#0F6E56]" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* Escape hatch → all portals */}
          <div className={`border-t ${borderColor} p-1.5`}>
            <button
              onClick={() => {
                setOpen(false)
                window.location.replace('http://lvh.me:5173/portals')
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all ${hoverBg}`}
            >
              <ExternalLink size={13} className={subTextColor} />
              <span className={`text-[12px] ${subTextColor}`}>All portals</span>
            </button>
          </div>

        </div>
      )}
    </div>
  )
}