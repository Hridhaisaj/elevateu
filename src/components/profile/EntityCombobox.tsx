import { useState, useEffect, useRef } from 'react'
import { Building2, Plus, Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import ImageUpload from '@/components/ui/ImageUpload'

export interface EntitySelection {
  id: string | null
  name: string
  logo_url?: string | null
}

interface Row {
  id: string
  name: string
  logo_url: string | null
  location: string | null
}

interface Props {
  table: 'companies' | 'schools'
  value: EntitySelection
  onChange: (val: EntitySelection) => void
  icon?: LucideIcon
  placeholder?: string
  logoLabel?: string
}

export default function EntityCombobox({
  table,
  value,
  onChange,
  icon: Icon = Building2,
  placeholder = 'Search or add…',
  logoLabel = 'Upload logo',
}: Props) {
  const { user } = useAuth()
  const [query, setQuery] = useState(value.name)
  const [results, setResults] = useState<Row[]>([])
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
        .from(table)
        .select('id, name, logo_url, location')
        .ilike('name', `%${query.trim()}%`)
        .limit(6)
      setResults((data ?? []) as Row[])
    }, 200)
    return () => clearTimeout(t)
  }, [query, table])

  function selectRow(r: Row) {
    onChange({ id: r.id, name: r.name, logo_url: r.logo_url })
    setQuery(r.name)
    setOpen(false)
  }

  async function createEntity() {
    if (!query.trim() || !user) return
    setCreating(true)
    // Case-insensitive dedup first
    const { data: existing } = await supabase
      .from(table)
      .select('id, name, logo_url, location')
      .ilike('name', query.trim())
      .maybeSingle()

    if (existing) {
      selectRow(existing as Row)
      setCreating(false)
      return
    }

    const { data, error } = await supabase
      .from(table)
      .insert({ created_by: user.id, name: query.trim() })
      .select('id, name, logo_url, location')
      .single()

    setCreating(false)
    if (!error && data) selectRow(data as Row)
  }

  async function setLogo(url: string) {
    if (!value.id) return
    await supabase.from(table).update({ logo_url: url }).eq('id', value.id)
    onChange({ ...value, logo_url: url })
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div>
      <div className="relative" ref={wrapRef}>
        <div className="relative">
          <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              onChange({ id: null, name: e.target.value })
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="input pl-9"
          />
          {value.id && (
            <Check size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
          )}
        </div>

        {open && query.trim() && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-surface-border rounded-lg shadow-lg overflow-hidden">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRow(r)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {r.logo_url ? (
                    <img src={r.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon size={14} className="text-text-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-text-primary truncate">{r.name}</p>
                  {r.location && <p className="text-xs text-text-muted truncate">{r.location}</p>}
                </div>
              </button>
            ))}

            {!exactMatch && (
              <button
                type="button"
                onClick={createEntity}
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

      {value.id && (
        <div className="mt-3">
          <ImageUpload
            currentUrl={value.logo_url ?? null}
            folder={table}
            onUploaded={setLogo}
            label={logoLabel}
            fallback={<Icon size={20} className="text-text-muted" />}
          />
        </div>
      )}
    </div>
  )
}
