import { useState, useEffect, useRef } from 'react'
import { Building2, Plus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Company } from '@/types/database'

interface Props {
  value: { id: string | null; name: string }
  onChange: (val: { id: string | null; name: string; logo_url?: string | null }) => void
}

export default function CompanyCombobox({ value, onChange }: Props) {
  const { user } = useAuth()
  const [query, setQuery] = useState(value.name)
  const [results, setResults] = useState<Company[]>([])
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .ilike('name', `%${query.trim()}%`)
        .limit(6)
      setResults((data ?? []) as Company[])
    }, 200)
    return () => clearTimeout(t)
  }, [query])

  function selectCompany(c: Company) {
    onChange({ id: c.id, name: c.name, logo_url: c.logo_url })
    setQuery(c.name)
    setOpen(false)
  }

  async function createCompany() {
    if (!query.trim() || !user) return
    setCreating(true)
    // Try to find existing (case-insensitive) first to avoid duplicates
    const { data: existing } = await supabase
      .from('companies')
      .select('*')
      .ilike('name', query.trim())
      .maybeSingle()

    if (existing) {
      selectCompany(existing as Company)
      setCreating(false)
      return
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({ created_by: user.id, name: query.trim() })
      .select()
      .single()

    setCreating(false)
    if (!error && data) selectCompany(data as Company)
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            onChange({ id: null, name: e.target.value })
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search or add organization…"
          className="input pl-9"
        />
        {value.id && (
          <Check size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-surface-border rounded-lg shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCompany(c)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {c.logo_url ? (
                  <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={14} className="text-text-muted" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-text-primary truncate">{c.name}</p>
                {c.industry && <p className="text-xs text-text-muted truncate">{c.industry}</p>}
              </div>
            </button>
          ))}

          {!exactMatch && (
            <button
              type="button"
              onClick={createCompany}
              disabled={creating}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-brand-50 transition-colors border-t border-surface-border"
            >
              <div className="w-7 h-7 rounded bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Plus size={14} className="text-brand-500" />
              </div>
              <p className="text-sm text-brand-600">
                {creating ? 'Creating…' : `Create "${query.trim()}"`}
              </p>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
