import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EXPERIENCE_TYPES } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import CompanyCombobox from './CompanyCombobox'
import type { Experience } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  existing?: Experience | null
  onSaved: () => void
}

const TYPE_LABELS: Record<string, string> = {
  club: 'Club', volunteer: 'Volunteer', internship: 'Internship', job: 'Job',
  research: 'Research', sport: 'Sport', other: 'Other',
}

export default function ExperienceForm({ open, onClose, userId, existing, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [company, setCompany] = useState<{ id: string | null; name: string }>({
    id: existing?.company_id ?? null,
    name: existing?.organization ?? '',
  })
  const [form, setForm] = useState({
    title: existing?.title ?? '',
    type: existing?.type ?? 'club',
    location: existing?.location ?? '',
    start_date: existing?.start_date ?? '',
    end_date: existing?.end_date ?? '',
    is_current: existing?.is_current ?? false,
    description: existing?.description ?? '',
  })

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    if (!form.title.trim() || !company.name.trim() || !form.start_date) return
    setSaving(true)
    const payload = {
      user_id: userId,
      company_id: company.id,
      title: form.title.trim(),
      organization: company.name.trim(),
      location: form.location.trim() || null,
      type: form.type as Experience['type'],
      start_date: form.start_date,
      end_date: form.is_current ? null : form.end_date || null,
      is_current: form.is_current,
      description: form.description.trim() || null,
    }
    if (existing) {
      await supabase.from('experiences').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('experiences').insert(payload)
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit experience' : 'Add experience'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.title.trim() || !company.name.trim() || !form.start_date}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Title / Role *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className="input" placeholder="Robotics Team Captain" />
        </div>

        <div>
          <label className="label">Organization / Company *</label>
          <CompanyCombobox value={company} onChange={setCompany} />
          <p className="text-xs text-text-muted mt-1">Search for an existing organization or create a new one.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type</label>
            <select value={form.type} onChange={(e) => set('type', e.target.value as Experience['type'])} className="input">
              {EXPERIENCE_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input value={form.location} onChange={(e) => set('location', e.target.value)} className="input" placeholder="San Jose, CA" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start date *</label>
            <input type="month" value={form.start_date?.slice(0, 7)} onChange={(e) => set('start_date', e.target.value + '-01')} className="input" />
          </div>
          <div>
            <label className="label">End date</label>
            <input
              type="month"
              value={form.end_date?.slice(0, 7) ?? ''}
              onChange={(e) => set('end_date', e.target.value ? e.target.value + '-01' : '')}
              className="input"
              disabled={form.is_current}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_current}
            onChange={(e) => set('is_current', e.target.checked)}
            className="rounded border-surface-border text-brand-500 focus:ring-brand-500"
          />
          I currently do this
        </label>

        <div>
          <label className="label">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="input resize-none"
            rows={4}
            placeholder="What did you do? What did you accomplish?"
            maxLength={600}
          />
        </div>
      </div>
    </Modal>
  )
}
