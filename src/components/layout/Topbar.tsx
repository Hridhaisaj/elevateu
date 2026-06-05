import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, LogOut } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'

export default function Topbar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-surface-border h-14">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center gap-4">
        {/* Logo */}
        <Link to="/feed" className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-brand-500 font-bold text-lg leading-none">Elevate</span>
          <span className="bg-brand-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">U</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm">
          <div className="relative w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, opportunities…"
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-surface-border rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </form>

        <div className="flex-1 md:flex-none" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-md text-text-secondary hover:bg-slate-100 transition-colors relative">
            <Bell size={18} />
          </button>

          {profile && (
            <Link to={`/profile/${profile.username}`}>
              <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="p-2 rounded-md text-text-secondary hover:bg-slate-100 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
