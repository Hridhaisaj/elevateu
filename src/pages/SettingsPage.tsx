import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { GRADE_LEVELS } from '@/lib/utils'

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    username: profile?.username ?? '',
    headline: profile?.headline ?? '',
    bio: profile?.bio ?? '',
    school_name: profile?.school_name ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    grade_level: profile?.grade_level ?? '',
    graduation_year: profile?.graduation_year?.toString() ?? '',
    gpa: profile?.gpa?.toString() ?? '',
  })

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    await supabase.from('profiles').update({
      full_name: form.full_name,
      username: form.username,
      headline: form.headline || null,
      bio: form.bio || null,
      school_name: form.school_name || null,
      city: form.city || null,
      state: form.state || null,
      grade_level: form.grade_level || null,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      gpa: form.gpa ? parseFloat(form.gpa) : null,
    }).eq('id', user.id)
    qc.invalidateQueries({ queryKey: ['profile'] })
    setSaved(true)
    setLoading(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-lg font-bold text-text-primary">Settings</h1>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="card p-5 space-y-4">
          <h2 className="section-title border-b border-surface-border pb-3">Profile information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="input" required />
            </div>
            <div>
              <label className="label">Username</label>
              <input value={form.username} onChange={(e) => update('username', e.target.value)} className="input" required />
            </div>
          </div>

          <div>
            <label className="label">Headline</label>
            <input value={form.headline} onChange={(e) => update('headline', e.target.value)} className="input" placeholder="STEM enthusiast | Class of '26" maxLength={120} />
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea value={form.bio} onChange={(e) => update('bio', e.target.value)} className="input resize-none" rows={4} maxLength={500} />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="section-title border-b border-surface-border pb-3">Education</h2>

          <div>
            <label className="label">School name</label>
            <input value={form.school_name} onChange={(e) => update('school_name', e.target.value)} className="input" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input value={form.city} onChange={(e) => update('city', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">State</label>
              <input value={form.state} onChange={(e) => update('state', e.target.value)} className="input" maxLength={2} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Grade</label>
              <select value={form.grade_level} onChange={(e) => update('grade_level', e.target.value)} className="input">
                <option value="">—</option>
                {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Grad year</label>
              <input value={form.graduation_year} onChange={(e) => update('graduation_year', e.target.value)} className="input" type="number" placeholder="2026" />
            </div>
            <div>
              <label className="label">GPA</label>
              <input value={form.gpa} onChange={(e) => update('gpa', e.target.value)} className="input" type="number" step="0.01" min="0" max="4.5" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <p className="text-sm text-emerald-600 font-medium">✓ Saved</p>}
        </div>
      </form>
    </div>
  )
}
