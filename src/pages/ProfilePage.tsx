import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin, GraduationCap, Calendar, Star, Award, Zap,
  Edit2, UserPlus, MessageSquare, Plus, Trash2, Building2, Clock, X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ExperienceForm from '@/components/profile/ExperienceForm'
import EducationForm from '@/components/profile/EducationForm'
import AwardForm from '@/components/profile/AwardForm'
import type {
  Profile, ExperienceWithCompany, Experience, Education, Achievement, Skill, Connection,
} from '@/types/database'

const TYPE_LABELS: Record<string, string> = {
  club: 'Club', volunteer: 'Volunteer', internship: 'Internship', job: 'Job',
  research: 'Research', sport: 'Sport', other: 'Other',
}

function monthRange(start: string, end: string | null, current: boolean) {
  const s = formatDate(start)
  if (current) return `${s} – Present`
  return end ? `${s} – ${formatDate(end)}` : s
}

// ─── Section shell ─────────────────────────────────────────────────────────────
function Section({ title, isOwn, onAdd, children }: {
  title: string
  isOwn: boolean
  onAdd?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {isOwn && onAdd && (
          <button
            onClick={onAdd}
            className="p-1.5 rounded-md text-text-secondary hover:bg-slate-100 hover:text-brand-600 transition-colors"
            title={`Add ${title.toLowerCase()}`}
          >
            <Plus size={18} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-1 flex-shrink-0">
      <button onClick={onEdit} className="p-1.5 rounded-md text-text-muted hover:bg-slate-100 hover:text-text-secondary transition-colors">
        <Edit2 size={14} />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded-md text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user, refreshProfile } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [expForm, setExpForm] = useState<{ open: boolean; editing: Experience | null }>({ open: false, editing: null })
  const [eduForm, setEduForm] = useState<{ open: boolean; editing: Education | null }>({ open: false, editing: null })
  const [awardForm, setAwardForm] = useState<{ open: boolean; editing: Achievement | null }>({ open: false, editing: null })
  const [newSkill, setNewSkill] = useState('')

  // ─── Profile ───
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('username', username!).single()
      return data as Profile | null
    },
  })

  const pid = profile?.id

  // ─── Experiences (with company) ───
  const { data: experiences = [] } = useQuery({
    queryKey: ['experiences', pid],
    enabled: !!pid,
    queryFn: async () => {
      const { data } = await supabase
        .from('experiences')
        .select('*, companies(id, name, logo_url, industry)')
        .eq('user_id', pid!)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false })
      return (data ?? []) as ExperienceWithCompany[]
    },
  })

  // ─── Education ───
  const { data: education = [] } = useQuery({
    queryKey: ['education', pid],
    enabled: !!pid,
    queryFn: async () => {
      const { data } = await supabase.from('education').select('*').eq('user_id', pid!).order('end_year', { ascending: false })
      return (data ?? []) as Education[]
    },
  })

  // ─── Awards ───
  const { data: awards = [] } = useQuery({
    queryKey: ['awards', pid],
    enabled: !!pid,
    queryFn: async () => {
      const { data } = await supabase.from('achievements').select('*').eq('user_id', pid!).order('date_received', { ascending: false })
      return (data ?? []) as Achievement[]
    },
  })

  // ─── Skills ───
  const { data: skills = [] } = useQuery({
    queryKey: ['skills', pid],
    enabled: !!pid,
    queryFn: async () => {
      const { data } = await supabase.from('skills').select('*').eq('user_id', pid!).order('created_at', { ascending: true })
      return (data ?? []) as Skill[]
    },
  })

  // ─── Connection state ───
  const { data: connection } = useQuery({
    queryKey: ['connection', user?.id, pid],
    enabled: !!user && !!profile && user.id !== pid,
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user!.id},recipient_id.eq.${pid}),and(requester_id.eq.${pid},recipient_id.eq.${user!.id})`)
        .maybeSingle()
      return data as Connection | null
    },
  })

  const connect = useMutation({
    mutationFn: async () => {
      await supabase.from('connections').insert({ requester_id: user!.id, recipient_id: pid!, status: 'pending' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connection'] }),
  })

  const isOwn = !!user && user.id === pid

  // ─── Delete helpers ───
  async function deleteRow(table: 'experiences' | 'education' | 'achievements' | 'skills', id: string, key: string) {
    await supabase.from(table).delete().eq('id', id)
    qc.invalidateQueries({ queryKey: [key, pid] })
  }

  async function addSkill() {
    if (!newSkill.trim() || !pid) return
    await supabase.from('skills').insert({ user_id: pid, skill_name: newSkill.trim() })
    setNewSkill('')
    qc.invalidateQueries({ queryKey: ['skills', pid] })
  }

  function refetchAll(key: string) {
    qc.invalidateQueries({ queryKey: [key, pid] })
    if (isOwn) refreshProfile()
  }

  if (isLoading) return (
    <div className="animate-pulse space-y-4">
      <div className="card h-48" />
      <div className="card h-40" />
    </div>
  )

  if (!profile) return (
    <div className="card p-10 text-center">
      <p className="text-text-secondary text-sm">Profile not found.</p>
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* ─── Header ─── */}
      <div className="card overflow-hidden">
        <div
          className="h-28 bg-gradient-to-br from-brand-600 to-brand-500"
          style={profile.cover_photo_url ? { backgroundImage: `url(${profile.cover_photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        />
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-12 mb-3">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" className="ring-4 ring-white shadow-sm" />
            <div className="flex gap-2 pb-1">
              {isOwn ? (
                <Link to="/settings"><Button variant="secondary"><Edit2 size={14} /> Edit profile</Button></Link>
              ) : connection?.status === 'accepted' ? (
                <Button onClick={() => navigate(`/messages/${pid}`)}><MessageSquare size={14} /> Message</Button>
              ) : connection?.status === 'pending' ? (
                <Button variant="secondary" disabled><Clock size={14} /> Pending</Button>
              ) : (
                <Button onClick={() => connect.mutate()}><UserPlus size={14} /> Connect</Button>
              )}
            </div>
          </div>

          <h1 className="text-xl font-bold text-text-primary">{profile.full_name}</h1>
          {profile.headline && <p className="text-sm text-text-secondary mt-0.5">{profile.headline}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
            {profile.school_name && (
              <span className="flex items-center gap-1 text-xs text-text-muted"><GraduationCap size={13} /> {profile.school_name}</span>
            )}
            {(profile.city || profile.state) && (
              <span className="flex items-center gap-1 text-xs text-text-muted"><MapPin size={13} /> {[profile.city, profile.state].filter(Boolean).join(', ')}</span>
            )}
            {profile.graduation_year && (
              <span className="flex items-center gap-1 text-xs text-text-muted"><Calendar size={13} /> Class of {profile.graduation_year}</span>
            )}
            {profile.gpa != null && (
              <span className="flex items-center gap-1 text-xs text-text-muted"><Star size={13} /> {Number(profile.gpa).toFixed(2)} GPA</span>
            )}
          </div>

          {profile.bio && <p className="text-sm text-text-secondary mt-3 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>}
        </div>
      </div>

      {/* ─── Experience ─── */}
      <Section title="Experience" isOwn={isOwn} onAdd={() => setExpForm({ open: true, editing: null })}>
        {experiences.length === 0 ? (
          <p className="text-sm text-text-muted py-2">{isOwn ? 'Add your clubs, jobs, internships, and activities.' : 'No experience listed yet.'}</p>
        ) : (
          <div className="space-y-1">
            {experiences.map((exp) => (
              <div key={exp.id} className="flex gap-3 py-3 border-b border-surface-border last:border-0">
                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {exp.companies?.logo_url ? (
                    <img src={exp.companies.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={18} className="text-text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{exp.title}</p>
                  <p className="text-sm text-text-secondary">{exp.organization}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {monthRange(exp.start_date, exp.end_date, exp.is_current)}
                    {exp.location ? ` · ${exp.location}` : ''}
                  </p>
                  {exp.description && <p className="text-sm text-text-secondary mt-1.5 leading-relaxed whitespace-pre-wrap">{exp.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge variant="outline">{TYPE_LABELS[exp.type]}</Badge>
                  {isOwn && <RowActions onEdit={() => setExpForm({ open: true, editing: exp })} onDelete={() => deleteRow('experiences', exp.id, 'experiences')} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ─── Education ─── */}
      <Section title="Education" isOwn={isOwn} onAdd={() => setEduForm({ open: true, editing: null })}>
        {education.length === 0 ? (
          <p className="text-sm text-text-muted py-2">{isOwn ? 'Add your schools and programs.' : 'No education listed yet.'}</p>
        ) : (
          <div className="space-y-1">
            {education.map((edu) => (
              <div key={edu.id} className="flex gap-3 py-3 border-b border-surface-border last:border-0">
                <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={18} className="text-text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{edu.school_name}</p>
                  {(edu.degree || edu.field_of_study) && (
                    <p className="text-sm text-text-secondary">{[edu.degree, edu.field_of_study].filter(Boolean).join(', ')}</p>
                  )}
                  {(edu.start_year || edu.end_year) && (
                    <p className="text-xs text-text-muted mt-0.5">{[edu.start_year, edu.end_year].filter(Boolean).join(' – ')}{edu.grade ? ` · GPA ${edu.grade}` : ''}</p>
                  )}
                  {edu.activities && <p className="text-xs text-text-secondary mt-1"><span className="font-medium">Activities:</span> {edu.activities}</p>}
                  {edu.description && <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{edu.description}</p>}
                </div>
                {isOwn && <RowActions onEdit={() => setEduForm({ open: true, editing: edu })} onDelete={() => deleteRow('education', edu.id, 'education')} />}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ─── Awards ─── */}
      <Section title="Awards & Honors" isOwn={isOwn} onAdd={() => setAwardForm({ open: true, editing: null })}>
        {awards.length === 0 ? (
          <p className="text-sm text-text-muted py-2">{isOwn ? 'Showcase your awards and recognitions.' : 'No awards listed yet.'}</p>
        ) : (
          <div className="space-y-1">
            {awards.map((a) => (
              <div key={a.id} className="flex gap-3 py-3 border-b border-surface-border last:border-0">
                <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Award size={18} className="text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                  {a.issuer && <p className="text-sm text-text-secondary">{a.issuer}</p>}
                  {a.date_received && <p className="text-xs text-text-muted mt-0.5">{formatDate(a.date_received)}{a.category ? ` · ${a.category}` : ''}</p>}
                  {a.description && <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">{a.description}</p>}
                </div>
                {isOwn && <RowActions onEdit={() => setAwardForm({ open: true, editing: a })} onDelete={() => deleteRow('achievements', a.id, 'awards')} />}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ─── Skills ─── */}
      <Section title="Skills" isOwn={isOwn}>
        {isOwn && (
          <div className="flex gap-2 mb-3">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="Add a skill (e.g. Python, Public Speaking)"
              className="input"
              maxLength={40}
            />
            <Button onClick={addSkill} disabled={!newSkill.trim()}><Plus size={14} /> Add</Button>
          </div>
        )}
        {skills.length === 0 ? (
          <p className="text-sm text-text-muted py-1">{isOwn ? 'Add skills to highlight your strengths.' : 'No skills listed yet.'}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="group flex items-center gap-1.5 text-xs bg-slate-100 text-text-secondary pl-2.5 pr-2 py-1.5 rounded-full">
                <Zap size={12} className="text-brand-500" /> {s.skill_name}
                {isOwn && (
                  <button onClick={() => deleteRow('skills', s.id, 'skills')} className="text-text-muted hover:text-red-500 transition-colors">
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* ─── Forms ─── */}
      {pid && (
        <>
          <ExperienceForm open={expForm.open} existing={expForm.editing} userId={pid} onClose={() => setExpForm({ open: false, editing: null })} onSaved={() => refetchAll('experiences')} />
          <EducationForm open={eduForm.open} existing={eduForm.editing} userId={pid} onClose={() => setEduForm({ open: false, editing: null })} onSaved={() => refetchAll('education')} />
          <AwardForm open={awardForm.open} existing={awardForm.editing} userId={pid} onClose={() => setAwardForm({ open: false, editing: null })} onSaved={() => refetchAll('awards')} />
        </>
      )}
    </div>
  )
}
