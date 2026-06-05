import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { GRADE_LEVELS } from '@/lib/utils'

const STEPS = ['School', 'Grade & GPA', 'Bio'] as const

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    school_name: '',
    school_location: '',
    city: '',
    state: '',
    grade_level: '',
    graduation_year: '',
    gpa: '',
    headline: '',
    bio: '',
  })

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleFinish() {
    if (!user) return
    setLoading(true)
    await supabase.from('profiles').update({
      school_name: form.school_name,
      school_location: form.school_location,
      city: form.city,
      state: form.state,
      grade_level: form.grade_level || null,
      graduation_year: form.graduation_year ? parseInt(form.graduation_year) : null,
      gpa: form.gpa ? parseFloat(form.gpa) : null,
      headline: form.headline || null,
      bio: form.bio || null,
    }).eq('id', user.id)
    await refreshProfile()
    navigate('/feed')
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 mb-3">
            <span className="text-brand-500 font-bold text-xl">Elevate</span>
            <span className="bg-brand-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">U</span>
          </div>
          <h1 className="text-xl font-semibold text-text-primary">Set up your profile</h1>
          <p className="text-sm text-text-secondary mt-1">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-surface-border'}`} />
          ))}
        </div>

        <div className="card p-6 space-y-4">
          {step === 0 && (
            <>
              <div>
                <label className="label">School name</label>
                <input value={form.school_name} onChange={(e) => update('school_name', e.target.value)} className="input" placeholder="Lincoln High School" />
              </div>
              <div>
                <label className="label">School location</label>
                <input value={form.school_location} onChange={(e) => update('school_location', e.target.value)} className="input" placeholder="San Jose, CA" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">City</label>
                  <input value={form.city} onChange={(e) => update('city', e.target.value)} className="input" placeholder="San Jose" />
                </div>
                <div>
                  <label className="label">State</label>
                  <input value={form.state} onChange={(e) => update('state', e.target.value)} className="input" placeholder="CA" maxLength={2} />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="label">Grade level</label>
                <select value={form.grade_level} onChange={(e) => update('grade_level', e.target.value)} className="input">
                  <option value="">Select grade</option>
                  {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g} grade</option>)}
                </select>
              </div>
              <div>
                <label className="label">Graduation year</label>
                <input value={form.graduation_year} onChange={(e) => update('graduation_year', e.target.value)} className="input" type="number" placeholder="2026" min="2024" max="2030" />
              </div>
              <div>
                <label className="label">GPA (optional)</label>
                <input value={form.gpa} onChange={(e) => update('gpa', e.target.value)} className="input" type="number" step="0.01" min="0" max="4.5" placeholder="3.8" />
              </div>
              <div>
                <label className="label">Headline</label>
                <input value={form.headline} onChange={(e) => update('headline', e.target.value)} className="input" placeholder="STEM enthusiast | Robotics captain | Class of '26" maxLength={120} />
              </div>
            </>
          )}

          {step === 2 && (
            <div>
              <label className="label">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                className="input resize-none"
                rows={5}
                placeholder="Tell others about yourself — your interests, goals, and what you're passionate about."
                maxLength={500}
              />
              <p className="text-xs text-text-muted mt-1 text-right">{form.bio.length}/500</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)} className="btn-ghost flex-1">Back</button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary flex-1">Continue</button>
          ) : (
            <button onClick={handleFinish} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving…' : 'Finish setup'}
            </button>
          )}
        </div>

        <button onClick={() => navigate('/feed')} className="block text-center text-sm text-text-muted hover:text-text-secondary mt-3 w-full">
          Skip for now
        </button>
      </div>
    </div>
  )
}
