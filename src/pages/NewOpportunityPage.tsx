import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { OPPORTUNITY_TYPES, GRADE_LEVELS } from '@/lib/utils'
import CompanyCombobox from '@/components/profile/CompanyCombobox'
import Button from '@/components/ui/Button'

const TYPE_LABELS: Record<string, string> = {
  internship: 'Internship', volunteer: 'Volunteer', scholarship: 'Scholarship',
  competition: 'Competition', program: 'Program', job: 'Job', other: 'Other',
}
const PAY_TYPES = ['paid', 'unpaid', 'stipend'] as const
const PAY_LABELS: Record<string, string> = { paid: 'Paid', unpaid: 'Unpaid', stipend: 'Stipend' }

export default function NewOpportunityPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [org, setOrg] = useState<{ id: string | null; name: string }>({ id: null, name: '' })
  const [type, setType] = useState<typeof OPPORTUNITY_TYPES[number]>('internship')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [payType, setPayType] = useState<'paid' | 'unpaid' | 'stipend' | ''>('')
  const [deadline, setDeadline] = useState('')
  const [applicationUrl, setApplicationUrl] = useState('')
  const [gradeLevels, setGradeLevels] = useState<string[]>([])
  const [tagsInput, setTagsInput] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function toggleGrade(g: string) {
    setGradeLevels((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!user) return
    if (!title.trim()) return setError('Please enter a title.')
    if (!org.name.trim()) return setError('Please enter an organization.')
    if (!description.trim()) return setError('Please enter a description.')

    setSaving(true)
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)

    const { data, error: insertError } = await supabase
      .from('opportunities')
      .insert({
        created_by: user.id,
        title: title.trim(),
        organization: org.name.trim(),
        description: description.trim(),
        type,
        city: city.trim() || null,
        state: state.trim() || null,
        is_remote: isRemote,
        pay_type: payType || null,
        deadline: deadline || null,
        application_url: applicationUrl.trim() || null,
        grade_levels: gradeLevels,
        tags,
      })
      .select()
      .single()

    setSaving(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    qc.invalidateQueries({ queryKey: ['opportunities'] })
    navigate(data?.id ? `/opportunities/${data.id}` : '/opportunities')
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Link to="/opportunities" className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary transition-colors">
        <ArrowLeft size={15} /> Back to opportunities
      </Link>

      <div className="card p-6">
        <h1 className="text-lg font-bold text-text-primary mb-1">Post an opportunity</h1>
        <p className="text-sm text-text-secondary mb-5">Share an internship, scholarship, competition, or program with the community.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer Research Intern"
              className="input"
            />
          </div>

          {/* Organization (company combobox — create on the fly) */}
          <div>
            <label className="label">Organization *</label>
            <CompanyCombobox value={org} onChange={(v) => setOrg({ id: v.id, name: v.name })} />
            <p className="text-xs text-text-muted mt-1">Search for an existing company or type a new name to create one.</p>
          </div>

          {/* Type + Pay */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input">
                {OPPORTUNITY_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Compensation</label>
              <select value={payType} onChange={(e) => setPayType(e.target.value as typeof payType)} className="input">
                <option value="">Not specified</option>
                {PAY_TYPES.map((p) => (
                  <option key={p} value={p}>{PAY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Boston" className="input" />
            </div>
            <div>
              <label className="label">State</label>
              <input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. MA" className="input" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} className="rounded border-surface-border text-brand-500 focus:ring-brand-500" />
            This opportunity is remote
          </label>

          {/* Deadline + URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Application deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Application link</label>
              <input type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} placeholder="https://…" className="input" />
            </div>
          </div>

          {/* Grade levels */}
          <div>
            <label className="label">Eligible grade levels</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {GRADE_LEVELS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGrade(g)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    gradeLevels.includes(g)
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-white text-text-secondary border-surface-border hover:border-brand-400'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="STEM, paid, summer (comma-separated)"
              className="input"
            />
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the opportunity, responsibilities, requirements, and how to apply…"
              rows={6}
              className="input resize-y"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? 'Posting…' : 'Post opportunity'}
            </Button>
            <Link to="/opportunities" className="text-sm text-text-muted hover:text-text-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
