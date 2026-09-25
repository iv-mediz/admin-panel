import { useRef, useState } from 'react'
import { getApiBaseUrl } from '../config/api'
import ImageUploadPlaceholder from './ImageUploadPlaceholder'

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path?.trim()) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = getApiBaseUrl().replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path.slice(1) : path
  if (normalized.startsWith('api/v1/')) {
    return `${base.replace(/\/api\/v1$/, '')}/${normalized}`
  }
  return `${base}/${normalized}`
}

type Kind = 'logo' | 'cover'

export default function HospitalImageUpload({
  label,
  kind,
  previewUrl,
  onPick,
  hint,
}: {
  label: string
  kind: Kind
  previewUrl?: string | null
  onPick: (file: File) => void
  hint?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const resolved = localPreview ?? resolveMediaUrl(previewUrl)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setLocalPreview(URL.createObjectURL(file))
    onPick(file)
    e.target.value = ''
  }

  return (
    <div className="field full">
      <label>{label}</label>
      {hint ? <p className="muted" style={{ margin: '4px 0 8px', fontSize: 12 }}>{hint}</p> : null}
      <button
        type="button"
        className="hospital-image-upload"
        onClick={() => inputRef.current?.click()}
        aria-label={`Upload ${kind}`}
      >
        {resolved ? (
          <img
            src={resolved}
            alt=""
            className={kind === 'logo' ? 'hospital-image-upload-logo' : 'hospital-image-upload-cover'}
          />
        ) : (
          <span
            className={`hospital-image-upload-empty ${kind === 'logo' ? 'hospital-image-upload-empty-logo' : 'hospital-image-upload-empty-cover'}`}
          >
            <ImageUploadPlaceholder size={kind === 'logo' ? 96 : 88} caption="Tap to upload" />
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={onFileChange}
      />
    </div>
  )
}
