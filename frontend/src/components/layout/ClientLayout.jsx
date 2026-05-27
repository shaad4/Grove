import ClientSidebar from './ClientSidebar'

export default function ClientLayout({
  children,
  badges = {},
}) {
  return (
    <div className="flex min-h-screen bg-[#f7f8f7]">
      <ClientSidebar badges={badges} />

      {/* Right column */}
      <div className="flex flex-1 flex-col min-w-0">
        <main
          className="
            flex-1
            overflow-y-auto
            pb-[88px]
            lg:pb-0
          "
        >
          {children}
        </main>
      </div>
    </div>
  )
}