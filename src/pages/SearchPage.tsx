import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import type { Profile, Opportunity } from '@/types/database'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [tab, setTab] = useState<'people' | 'opportunities'>('people')

  const debouncedQuery = query.trim()

  const { data: people = [] } = useQuery({
    queryKey: ['search-people', debouncedQuery],
    enabled: debouncedQuery.length >= 2 && tab === 'people',
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, headline, school_name, grade_level')
        .or(`full_name.ilike.%${debouncedQuery}%,username.ilike.%${debouncedQuery}%,school_name.ilike.%${debouncedQuery}%`)
        .limit(20)
      return (data ?? []) as Profile[]
    },
  })

  const { data: opps = [] } = useQuery({
    queryKey: ['search-opps', debouncedQuery],
    enabled: debouncedQuery.length >= 2 && tab === 'opportunities',
    queryFn: async () => {
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .or(`title.ilike.%${debouncedQuery}%,organization.ilike.%${debouncedQuery}%`)
        .limit(20)
      return (data ?? []) as Opportunity[]
    },
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearchParams(query ? { q: query } : {})
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-lg font-bold text-text-primary">Search</h1>

      <form onSubmit={handleSearch} className="card p-3 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people, opportunities…"
            className="input pl-9"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {/* Tabs */}
      <div className="flex border-b border-surface-border">
        {(['people', 'opportunities'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${
              tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {debouncedQuery.length < 2 ? (
        <p className="text-text-muted text-sm text-center py-8">Type at least 2 characters to search</p>
      ) : tab === 'people' ? (
        people.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No people found</p>
        ) : (
          <div className="card divide-y divide-surface-border">
            {people.map((p) => (
              <Link key={p.id} to={`/profile/${p.username}`} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                <Avatar src={p.avatar_url} name={p.full_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{p.full_name}</p>
                  {p.headline && <p className="text-xs text-text-muted truncate">{p.headline}</p>}
                  {p.school_name && <p className="text-xs text-text-muted">{p.school_name}</p>}
                </div>
                {p.grade_level && <Badge variant="outline">{p.grade_level}</Badge>}
              </Link>
            ))}
          </div>
        )
      ) : (
        opps.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">No opportunities found</p>
        ) : (
          <div className="card divide-y divide-surface-border">
            {opps.map((opp) => (
              <Link key={opp.id} to={`/opportunities/${opp.id}`} className="block p-4 hover:bg-slate-50 transition-colors">
                <p className="text-sm font-semibold text-text-primary">{opp.title}</p>
                <p className="text-xs text-text-secondary mt-0.5">{opp.organization}</p>
                <div className="flex gap-2 mt-1.5">
                  <Badge variant="default" className="capitalize">{opp.type}</Badge>
                  {opp.is_remote && <Badge variant="outline">Remote</Badge>}
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  )
}
