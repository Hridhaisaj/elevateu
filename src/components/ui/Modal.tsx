import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-10 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-surface-border my-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:bg-slate-100 hover:text-text-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-border bg-slate-50/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
