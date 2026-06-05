import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MapPin, Calendar, Bookmark, BookmarkCheck, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { OPPORTUNITY_TYPES } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import type { Opportunity } from '@/types/database'

const PAY_LABELS: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', stipend: 'Stipend' }
const TYPE_LABELS: Record<string, string> = {
  internship: 'Internship', volunteer: 'Volunteer', scholarship: 'Scholarship',
  competition: 'Competition', program: 'Program', job: 'Job', other: 'Other',
}

function OpportunityCard({ opp, savedIds, onToggleSave }: {
  opp: Opportunity
  savedIds: Set<string>
  onToggleSave: (id: string) => void
}) {
  const saved = savedIds.has(opp.id)
  const daysLeft = opp.deadline
    ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="card p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link to={`/opportunities/${opp.id}`} className="text-sm font-semibold text-text-primary hover:underline line-clamp-1">
                {opp.title}
              </Link>
              <p className="text-sm text-text-secondary mt-0.5">{opp.organization}</p>
            </div>
            <button
              onClick={() => onToggleSave(opp.id)}
              className="flex-shrink-0 text-text-muted hover:text-brand-500 transition-colors"
              title={saved ? 'Unsave' : 'Save'}
            >
              {saved ? <BookmarkCheck size={16} className="text-brand-500" /> : <Bookmark size={16} />}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="default">{TYPE_LABELS[opp.type] ?? opp.type}</Badge>
            {opp.pay_type && <Badge variant="success">{PAY_LABELS[opp.pay_type]}</Badge>}
            {opp.is_remote && <Badge variant="outline">Remote</Badge>}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {opp.city && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <MapPin size={11} />{opp.city}{opp.state ? `, ${opp.state}` : ''}
              </span>
            )}
            {daysLeft !== null && (
              <span className={`flex items-center gap-1 text-xs ${daysLeft <= 7 ? 'text-red-500' : 'text-text-muted'}`}>
                <Calendar size={11} />
                {daysLeft > 0 ? `${daysLeft}d left` : 'Deadline passed'}
              </span>
            )}
          </div>

          <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">{opp.description}</p>
        </div>
      </div>
    </div>
  )
}

export default function OpportunitiesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities', typeFilter],
    queryFn: async () => {
      let q = supabase.from('opportunities').select('*').order('created_at', { ascending: false })
      if (typeFilter) q = q.eq('type', typeFilter)
      const { data } = await q.limit(50)
      return (data ?? []) as Opportunity[]
    },
  })

  const { data: savedIds = new Set<string>() } = useQuery({
    queryKey: ['saved-opportunities', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('saved_opportunities').select('opportunity_id').eq('user_id', user!.id)
      return new Set((data ?? []).map((r) => r.opportunity_id))
    },
  })

  const toggleSave = useMutation({
    mutationFn: async (oppId: string) => {
      if (savedIds.has(oppId)) {
        await supabase.from('saved_opportunities').delete().eq('user_id', user!.id).eq('opportunity_id', oppId)
      } else {
        await supabase.from('saved_opportunities').insert({ user_id: user!.id, opportunity_id: oppId })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-opportunities'] }),
  })

  const filtered = opportunities.filter((o) =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.organization.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">Opportunities</h1>
        <Link to="/opportunities/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={14} /> Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-3 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities…"
            className="input pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input w-auto min-w-32"
        >
          <option value="">All types</option>
          {OPPORTUNITY_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bookmark} title="No opportunities found" description="Try adjusting your filters or check back later." />
      ) : (
        <div className="space-y-3">
          {filtered.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              savedIds={savedIds}
              onToggleSave={(id) => toggleSave.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
