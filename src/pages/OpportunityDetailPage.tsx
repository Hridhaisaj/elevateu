import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, Calendar, ExternalLink, ArrowLeft, Building } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Badge from '@/components/ui/Badge'
import type { Opportunity } from '@/types/database'

const TYPE_LABELS: Record<string, string> = {
  internship: 'Internship', volunteer: 'Volunteer', scholarship: 'Scholarship',
  competition: 'Competition', program: 'Program', job: 'Job', other: 'Other',
}

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: opp, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: async () => {
      const { data } = await supabase.from('opportunities').select('*').eq('id', id!).single()
      return data as Opportunity | null
    },
  })

  if (isLoading) return (
    <div className="card p-6 animate-pulse space-y-3">
      <div className="h-5 bg-slate-200 rounded w-2/3" />
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-32 bg-slate-200 rounded mt-4" />
    </div>
  )

  if (!opp) return (
    <div className="card p-10 text-center">
      <p className="text-text-secondary">Opportunity not found.</p>
      <Link to="/opportunities" className="text-brand-500 text-sm hover:underline mt-2 inline-block">Back to opportunities</Link>
    </div>
  )

  const daysLeft = opp.deadline
    ? Math.ceil((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
    : null

  return (
    <div className="space-y-4 max-w-2xl">
      <Link to="/opportunities" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft size={15} /> Back to opportunities
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{opp.title}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-text-secondary">
              <Building size={14} />
              <span className="text-sm">{opp.organization}</span>
            </div>
          </div>
          {opp.application_url && (
            <a
              href={opp.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-1.5 flex-shrink-0"
            >
              Apply <ExternalLink size={13} />
            </a>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="default">{TYPE_LABELS[opp.type] ?? opp.type}</Badge>
          {opp.pay_type && <Badge variant="success" className="capitalize">{opp.pay_type}</Badge>}
          {opp.is_remote && <Badge variant="outline">Remote</Badge>}
          {opp.grade_levels?.map((g) => (
            <Badge key={g} variant="outline">{g}</Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 mb-5 text-sm text-text-secondary">
          {opp.city && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {[opp.city, opp.state].filter(Boolean).join(', ')}
            </span>
          )}
          {opp.deadline && (
            <span className={`flex items-center gap-1.5 ${daysLeft !== null && daysLeft <= 7 ? 'text-red-500 font-medium' : ''}`}>
              <Calendar size={14} />
              Deadline: {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {daysLeft !== null && daysLeft > 0 && ` (${daysLeft} days left)`}
            </span>
          )}
        </div>

        <div className="border-t border-surface-border pt-5">
          <h2 className="text-sm font-semibold text-text-primary mb-3">About this opportunity</h2>
          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{opp.description}</div>
        </div>

        {opp.tags?.length > 0 && (
          <div className="mt-5 pt-5 border-t border-surface-border">
            <div className="flex flex-wrap gap-2">
              {opp.tags.map((tag) => (
                <span key={tag} className="text-xs bg-slate-100 text-text-muted px-2 py-0.5 rounded">#{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
