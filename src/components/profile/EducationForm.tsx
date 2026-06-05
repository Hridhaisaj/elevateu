import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Education } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  existing?: Education | null
  onSaved: () => void
}

export default function EducationForm({ open, onClose, userId, existing, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    school_name: existing?.school_name ?? '',
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
    if (!form.school_name.trim()) return
    setSaving(true)
    const payload = {
      user_id: userId,
      school_name: form.school_name.trim(),
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
          <Button onClick={save} disabled={saving || !form.school_name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">School *</label>
          <input value={form.school_name} onChange={(e) => set('school_name', e.target.value)} className="input" placeholder="Lincoln High School" />
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
