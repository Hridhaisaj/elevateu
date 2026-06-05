import { useRef, useState } from 'react'
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  currentUrl?: string | null
  /** Sub-folder inside the `logos` bucket, e.g. "companies" or "schools". */
  folder: string
  onUploaded: (url: string) => void
  label?: string
  fallback?: React.ReactNode
}

export default function ImageUpload({ currentUrl, folder, onUploaded, label = 'Upload image', fallback }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.')
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${folder}/${crypto.randomUUID()}.${ext}`

    const { error: upErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, cacheControl: '3600' })

    if (upErr) {
      setError(upErr.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
    onUploaded(data.publicUrl)
  }

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
        {currentUrl ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          fallback ?? <ImageIcon size={20} className="text-text-muted" />
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
        >
          {uploading ? (
            <><Loader2 size={14} className="animate-spin" /> Uploading…</>
          ) : (
            <><Upload size={14} /> {currentUrl ? 'Change image' : label}</>
          )}
        </button>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        {!error && <p className="text-xs text-text-muted mt-1">PNG or JPG, up to 2 MB.</p>}
      </div>
    </div>
  )
}
