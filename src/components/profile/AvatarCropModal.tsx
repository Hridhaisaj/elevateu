import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

async function getCroppedBlob(src: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

  const size = Math.round(Math.min(area.width, area.height))
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not crop image'))),
      'image/jpeg',
      0.9,
    )
  })
}

interface Props {
  src: string
  onCancel: () => void
  onCropped: (blob: Blob) => Promise<void> | void
}

export default function AvatarCropModal({ src, onCancel, onCropped }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onComplete = useCallback((_: Area, areaPixels: Area) => setArea(areaPixels), [])

  async function handleSave() {
    if (!area) return
    setSaving(true)
    try {
      const blob = await getCroppedBlob(src, area)
      await onCropped(blob)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Adjust profile picture"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !area}>{saving ? 'Saving…' : 'Save photo'}</Button>
        </>
      }
    >
      <div className="relative w-full h-72 bg-slate-900 rounded-lg overflow-hidden">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onComplete}
        />
      </div>
      <div className="flex items-center gap-3 mt-4">
        <span className="text-xs text-text-muted w-10">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-brand-500"
        />
      </div>
      <p className="text-xs text-text-muted mt-2">Drag to reposition · slide to zoom.</p>
    </Modal>
  )
}
