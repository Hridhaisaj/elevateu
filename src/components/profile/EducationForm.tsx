import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import SchoolCombobox from './SchoolCombobox'
import type { EntitySelection } from './EntityCombobox'
import type { EducationWithSchool } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  existing?: EducationWithSchool | null
  onSaved: () => void
}

export default function EducationForm({ open, onClose, userId, existing, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [school, setSchool] = useState<EntitySelection>({
    id: existing?.school_id ?? null,
    name: existing?.school_name ?? '',
    logo_url: existing?.schools?.logo_url ?? null,
  })
  const [form, setForm] = useState({
    degree: existing?.degree ?? '',
    field_of_study: existing?.field_of_study ?? '',
    start_year: existing?.start_year?.toString() ?? '',
    end_year: existing?.end_year?.toString() ?? '',
    grade: existing?.grade ?? '',
    activities: existing?.activities ?? '',
    description: existing?.description ?? '',
  })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    if (!school.name.trim()) return
    setSaving(true)
    const payload = {
      user_id: userId,
      school_id: school.id,
      school_name: school.name.trim(),
      degree: form.degree.trim() || null,
      field_of_study: form.field_of_study.trim() || null,
      start_year: form.start_year ? parseInt(form.start_year) : null,
      end_year: form.end_year ? parseInt(form.end_year) : null,
      grade: form.grade.trim() || null,
      activities: form.activities.trim() || null,
      description: form.description.trim() || null,
    }
    if (existing) {
      await supabase.from('education').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('education').insert(payload)
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit education' : 'Add education'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !school.name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">School *</label>
          <SchoolCombobox value={school} onChange={setSchool} />
          <p className="text-xs text-text-muted mt-1">Search for your school or add it, then upload its logo.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Degree / Diploma</label>
            <input value={form.degree} onChange={(e) => set('degree', e.target.value)} className="input" placeholder="High School Diploma" />
          </div>
          <div>
            <label className="label">Field of study</label>
            <input value={form.field_of_study} onChange={(e) => set('field_of_study', e.target.value)} className="input" placeholder="STEM / IB Program" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Start year</label>
            <input type="number" value={form.start_year} onChange={(e) => set('start_year', e.target.value)} className="input" placeholder="2022" />
          </div>
          <div>
            <label className="label">End year</label>
            <input type="number" value={form.end_year} onChange={(e) => set('end_year', e.target.value)} className="input" placeholder="2026" />
          </div>
          <div>
            <label className="label">Grade / GPA</label>
            <input value={form.grade} onChange={(e) => set('grade', e.target.value)} className="input" placeholder="3.9" />
          </div>
        </div>

        <div>
          <label className="label">Activities & societies</label>
          <input value={form.activities} onChange={(e) => set('activities', e.target.value)} className="input" placeholder="Debate, NHS, Varsity Soccer" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="input resize-none" rows={3} maxLength={400} />
        </div>
      </div>
    </Modal>
  )
}
