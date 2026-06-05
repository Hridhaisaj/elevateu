import { NavLink } from 'react-router-dom'
import { Home, Briefcase, Users, MessageSquare, Search, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'

const links = [
  { to: '/feed', icon: Home, label: 'Home' },
  { to: '/opportunities', icon: Briefcase, label: 'Opportunities' },
  { to: '/network', icon: Users, label: 'My Network' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { profile } = useAuth()

  return (
    <div className="space-y-1">
      {profile && (
        <NavLink
          to={`/profile/${profile.username}`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors mb-2"
        >
          <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{profile.full_name}</p>
            <p className="text-xs text-text-muted truncate">View profile</p>
          </div>
        </NavLink>
      )}

      <div className="border-t border-surface-border pt-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-50 text-brand-600 font-medium'
                  : 'text-text-secondary hover:bg-slate-100 hover:text-text-primary'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
