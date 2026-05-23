import ProviderSidebar from './ProviderSidebar'

export default function ProviderLayout({ children, topbar, badges }) {
  return (
    <div className="flex min-h-screen bg-[#f7f8f7]">
      <ProviderSidebar badges={badges} />

      {/* Right column: topbar + scrollable content */}
      <div className="flex flex-1 flex-col min-w-0">
        {topbar}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}