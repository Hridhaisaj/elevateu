import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Achievement } from '@/types/database'

interface Props {
  open: boolean
  onClose: () => void
  userId: string
  existing?: Achievement | null
  onSaved: () => void
}

export default function AwardForm({ open, onClose, userId, existing, onSaved }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: existing?.title ?? '',
    issuer: existing?.issuer ?? '',
    category: existing?.category ?? '',
    date_received: existing?.date_received ?? '',
    description: existing?.description ?? '',
  })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      user_id: userId,
      title: form.title.trim(),
      issuer: form.issuer.trim() || null,
      category: form.category.trim() || null,
      date_received: form.date_received || null,
      description: form.description.trim() || null,
    }
    if (existing) {
      await supabase.from('achievements').update(payload).eq('id', existing.id)
    } else {
      await supabase.from('achievements').insert(payload)
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={existing ? 'Edit award' : 'Add award / honor'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} className="input" placeholder="1st Place — Regional Science Fair" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Issuer</label>
            <input value={form.issuer} onChange={(e) => set('issuer', e.target.value)} className="input" placeholder="Intel ISEF" />
          </div>
          <div>
            <label className="label">Category</label>
            <input value={form.category} onChange={(e) => set('category', e.target.value)} className="input" placeholder="Academic / Athletic" />
          </div>
        </div>

        <div>
          <label className="label">Date received</label>
          <input type="month" value={form.date_received?.slice(0, 7) ?? ''} onChange={(e) => set('date_received', e.target.value ? e.target.value + '-01' : '')} className="input" />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="input resize-none" rows={3} maxLength={400} />
        </div>
      </div>
    </Modal>
  )
}
