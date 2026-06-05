import { Outlet, NavLink } from 'react-router-dom'
import { Home, Briefcase, Users, MessageSquare, Search } from 'lucide-react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const mobileLinks = [
  { to: '/feed', icon: Home, label: 'Home' },
  { to: '/opportunities', icon: Briefcase, label: 'Jobs' },
  { to: '/network', icon: Users, label: 'Network' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/search', icon: Search, label: 'Search' },
]

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <Topbar />
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pb-6 flex gap-6">
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="sticky top-20">
            <Sidebar />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-surface-border z-40">
        <div className="flex">
          {mobileLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                  isActive ? 'text-brand-500' : 'text-text-muted'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
