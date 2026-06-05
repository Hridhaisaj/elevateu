import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, School, Calendar, Star, Briefcase, Award, Zap, Edit2, UserPlus, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, EXPERIENCE_TYPES } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import type { Profile, Experience, Achievement, Skill, Connection } from '@/types/database'

function ExperienceItem({ exp }: { exp: Experience }) {
  return (
    <div className="flex gap-3 py-3 border-b border-surface-border last:border-0">
      <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Briefcase size={16} className="text-text-muted" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{exp.title}</p>
        <p className="text-sm text-text-secondary">{exp.organization}</p>
        <p className="text-xs text-text-muted mt-0.5">
          {formatDate(exp.start_date)} – {exp.end_date ? formatDate(exp.end_date) : 'Present'}
        </p>
        {exp.description && <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">{exp.description}</p>}
      </div>
      <Badge variant="outline" className="flex-shrink-0 capitalize">{exp.type}</Badge>
    </div>
  )
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user, profile: myProfile } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('username', username!).single()
      return data as Profile | null
    },
  })

  const { data: experiences = [] } = useQuery({
    queryKey: ['experiences', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('experiences').select('*').eq('user_id', profile!.id).order('start_date', { ascending: false })
      return (data ?? []) as Experience[]
    },
  })

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('achievements').select('*').eq('user_id', profile!.id).order('date_received', { ascending: false })
      return (data ?? []) as Achievement[]
    },
  })

  const { data: skills = [] } = useQuery({
    queryKey: ['skills', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data } = await supabase.from('skills').select('*').eq('user_id', profile!.id)
      return (data ?? []) as Skill[]
    },
  })

  const { data: connection } = useQuery({
    queryKey: ['connection', user?.id, profile?.id],
    enabled: !!user && !!profile && user.id !== profile.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user!.id},recipient_id.eq.${profile!.id}),and(requester_id.eq.${profile!.id},recipient_id.eq.${user!.id})`)
        .maybeSingle()
      return data as Connection | null
    },
  })

  const connect = useMutation({
    mutationFn: async () => {
      await supabase.from('connections').insert({ requester_id: user!.id, recipient_id: profile!.id, status: 'pending' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connection'] }),
  })

  const isOwn = user?.id === profile?.id

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="card h-40" />
      <div className="card p-6 h-32" />
    </div>
  )

  if (!profile) return (
    <div className="card p-10 text-center">
      <p className="text-text-secondary">Profile not found.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="card overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-brand-500 to-brand-700" style={
          profile.cover_photo_url ? { backgroundImage: `url(${profile.cover_photo_url})`, backgroundSize: 'cover' } : {}
        } />

        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-3">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" className="ring-4 ring-white" />
            <div className="flex gap-2 pb-1">
              {isOwn ? (
                <Link to="/settings" className="btn-secondary flex items-center gap-1.5">
                  <Edit2 size={14} /> Edit profile
                </Link>
              ) : (
                <>
                  {connection?.status === 'accepted' ? (
                    <button
                      onClick={() => navigate(`/messages/${profile.id}`)}
                      className="btn-primary flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                  ) : connection?.status === 'pending' ? (
                    <button disabled className="btn-ghost opacity-60">Pending</button>
                  ) : (
                    <button onClick={() => connect.mutate()} className="btn-primary flex items-center gap-1.5">
                      <UserPlus size={14} /> Connect
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold text-text-primary">{profile.full_name}</h1>
          {profile.headline && <p className="text-sm text-text-secondary mt-0.5">{profile.headline}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {profile.school_name && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <School size={12} /> {profile.school_name}
              </span>
            )}
            {(profile.city || profile.state) && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <MapPin size={12} /> {[profile.city, profile.state].filter(Boolean).join(', ')}
              </span>
            )}
            {profile.graduation_year && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Calendar size={12} /> Class of {profile.graduation_year}
              </span>
            )}
            {profile.gpa && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Star size={12} /> {profile.gpa.toFixed(2)} GPA
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="text-sm text-text-secondary mt-3 leading-relaxed">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Experience */}
      <div className="card p-5">
        <h2 className="section-title mb-1">Experience</h2>
        {experiences.length === 0 ? (
          <EmptyState icon={Briefcase} title="No experience listed" />
        ) : (
          experiences.map((exp) => <ExperienceItem key={exp.id} exp={exp} />)
        )}
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Achievements</h2>
          <div className="space-y-3">
            {achievements.map((ach) => (
              <div key={ach.id} className="flex gap-3">
                <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Award size={15} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{ach.title}</p>
                  {ach.description && <p className="text-xs text-text-secondary mt-0.5">{ach.description}</p>}
                  {ach.date_received && <p className="text-xs text-text-muted mt-0.5">{formatDate(ach.date_received)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="flex items-center gap-1 text-xs bg-slate-100 text-text-secondary px-2.5 py-1 rounded-full">
                <Zap size={11} className="text-brand-400" /> {s.skill_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
