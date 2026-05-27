import { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  Check,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'

import {
  selectTenant,
  selectMemberships,
  selectTotalPortalCount,
} from '../../features/auth/authSlice'

// ───────────────── Avatar ─────────────────
function PortalAvatar({
  name,
  logo,
  size = 'sm',
}) {
  const initials =
    name
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '??'

  const dim =
    size === 'lg'
      ? 'h-8 w-8 rounded-[8px] text-[11px]'
      : 'h-6 w-6 rounded-[6px] text-[9px]'

  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className={`${dim} shrink-0 object-cover`}
      />
    )
  }

  return (
    <div
      className={`
        ${dim}

        shrink-0

        flex items-center justify-center

        bg-[#111]

        text-white

        font-semibold

        tracking-wide
      `}
    >
      {initials}
    </div>
  )
}

// ───────────────── Component ─────────────────
export default function ClientPortalSwitcher() {
  const tenant = useSelector(selectTenant)

  const memberships = useSelector(
    selectMemberships
  )

  const totalPortals = useSelector(
    selectTotalPortalCount
  )

  const [open, setOpen] =
    useState(false)

  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handler
    )

    return () =>
      document.removeEventListener(
        'mousedown',
        handler
      )
  }, [])

  const providerPortals =
    memberships?.provider_portals ??
    []

  const clientPortals =
    memberships?.client_portals ??
    []

  const showDropdown =
    totalPortals > 1

  // ───────────────── Navigation ─────────────────
  const goTo = (slug, role) => {
    setOpen(false)

    const path =
      role === 'provider'
        ? 'dashboard'
        : 'portal'

    const domain =
      import.meta.env
        .VITE_APP_DOMAIN ||
      'lvh.me'

    const port =
      import.meta.env.VITE_PORT ||
      '5173'

    const base =
      import.meta.env.PROD
        ? `https://${slug}.${domain}`
        : `http://${slug}.${domain}:${port}`

    window.location.replace(
      `${base}/${path}`
    )
  }

  return (
    <div
      className="relative"
      ref={ref}
    >
      {/* ───────────────── Trigger ───────────────── */}
      <button
        onClick={() =>
          showDropdown &&
          setOpen((v) => !v)
        }
        className={`
          flex w-full items-center gap-2.5

          rounded-[12px]

          px-2.5 py-2

          transition-all duration-150

          hover:bg-[#f5f5f5]

          ${
            showDropdown
              ? 'cursor-pointer'
              : 'cursor-default'
          }
        `}
      >
        <PortalAvatar
          name={tenant?.name}
          logo={tenant?.logo_url}
          size="lg"
        />

        <div className="min-w-0 flex-1 text-left">
          <p
            className="
              truncate

              text-[13px]
              font-semibold

              text-[#111]

              leading-tight
            "
          >
            {tenant?.name ??
              'Portal'}
          </p>

          <p className="text-[10px] text-[#9b9b9b] mt-0.5">
            Client portal
          </p>
        </div>

        {showDropdown && (
          <ChevronDown
            size={13}
            className={`
              shrink-0

              text-[#c0c4c0]

              transition-transform duration-200

              ${
                open
                  ? 'rotate-180'
                  : ''
              }
            `}
          />
        )}
      </button>

      {/* ───────────────── Dropdown ───────────────── */}
      {open && (
        <div
          className="
            absolute

            left-[calc(100%+12px)]
            bottom-0

            z-[80]

            w-[260px]

            overflow-hidden

            rounded-[16px]

            border border-[#e8e8e8]

            bg-white

            shadow-[0_18px_50px_rgba(0,0,0,0.14)]

            animate-in
            fade-in
            slide-in-from-left-2
            duration-150
          "
        >
          {/* ───────────────── Workspaces ───────────────── */}
          {providerPortals.length >
            0 && (
            <div className="p-2">
              <p
                className="
                  px-2.5 py-1.5

                  text-[10px]
                  font-semibold

                  uppercase

                  tracking-[0.1em]

                  text-[#9b9b9b]
                "
              >
                Workspaces
              </p>

              {providerPortals.map(
                (portal) => {
                  const isCurrent =
                    portal.tenant_slug ===
                    tenant?.slug

                  return (
                    <button
                      key={
                        portal.tenant_slug
                      }
                      onClick={() =>
                        !isCurrent &&
                        goTo(
                          portal.tenant_slug,
                          'provider'
                        )
                      }
                      className={`
                        flex w-full items-center gap-2.5

                        rounded-[10px]

                        px-2.5 py-2

                        text-left

                        transition-all duration-150

                        ${
                          isCurrent
                            ? 'bg-[#f5f5f5]'
                            : 'hover:bg-[#f7f7f7]'
                        }
                      `}
                    >
                      <PortalAvatar
                        name={
                          portal.tenant_name
                        }
                        logo={
                          portal.tenant_logo
                        }
                      />

                      <span
                        className="
                          flex-1 truncate

                          text-[13px]

                          text-[#111]
                        "
                      >
                        {
                          portal.tenant_name
                        }
                      </span>

                      {isCurrent && (
                        <Check
                          size={12}
                          className="
                            shrink-0

                            text-[#0f6e56]
                          "
                        />
                      )}
                    </button>
                  )
                }
              )}
            </div>
          )}

          {/* Divider */}
          {providerPortals.length >
            0 &&
            clientPortals.length >
              0 && (
              <div className="mx-2 border-t border-[#f0f0f0]" />
            )}

          {/* ───────────────── Client portals ───────────────── */}
          {clientPortals.length >
            0 && (
            <div className="p-2">
              <p
                className="
                  px-2.5 py-1.5

                  text-[10px]
                  font-semibold

                  uppercase

                  tracking-[0.1em]

                  text-[#9b9b9b]
                "
              >
                Client portals
              </p>

              {clientPortals.map(
                (portal) => {
                  const isCurrent =
                    portal.tenant_slug ===
                    tenant?.slug

                  return (
                    <button
                      key={
                        portal.tenant_slug
                      }
                      onClick={() =>
                        !isCurrent &&
                        goTo(
                          portal.tenant_slug,
                          'client'
                        )
                      }
                      className={`
                        flex w-full items-center gap-2.5

                        rounded-[10px]

                        px-2.5 py-2

                        text-left

                        transition-all duration-150

                        ${
                          isCurrent
                            ? 'bg-[#f5f5f5]'
                            : 'hover:bg-[#f7f7f7]'
                        }
                      `}
                    >
                      <PortalAvatar
                        name={
                          portal.tenant_name
                        }
                        logo={
                          portal.tenant_logo
                        }
                      />

                      <span
                        className="
                          flex-1 truncate

                          text-[13px]

                          text-[#111]
                        "
                      >
                        {
                          portal.tenant_name
                        }
                      </span>

                      {isCurrent && (
                        <Check
                          size={12}
                          className="
                            shrink-0

                            text-[#0f6e56]
                          "
                        />
                      )}
                    </button>
                  )
                }
              )}
            </div>
          )}

          {/* ───────────────── Footer ───────────────── */}
          <div className="border-t border-[#f0f0f0] p-2">
            <button
              onClick={() => {
                setOpen(false)

                const domain =
                  import.meta.env
                    .VITE_APP_DOMAIN ||
                  'lvh.me'

                const port =
                  import.meta.env
                    .VITE_PORT ||
                  '5173'

                window.location.replace(
                  import.meta.env.PROD
                    ? `https://${domain}/portals`
                    : `http://${domain}:${port}/portals`
                )
              }}
              className="
                flex w-full items-center gap-2.5

                rounded-[10px]

                px-2.5 py-2

                text-left

                transition-all duration-150

                hover:bg-[#f7f7f7]
              "
            >
              <ExternalLink
                size={12}
                className="text-[#c0c4c0]"
              />

              <span className="text-[12px] text-[#9b9b9b]">
                All portals
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}