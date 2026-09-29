import { useEffect, useRef, useState } from 'react'
import { getApiBaseUrl } from '../config/api'
import ImageUploadPlaceholder from './ImageUploadPlaceholder'

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path?.trim()) return null
  const trimmed = path.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  const base = getApiBaseUrl().replace(/\/$/, '')
  const origin = base.replace(/\/api\/v1$/, '')
  let normalized = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
  if (!normalized.startsWith('api/v1/')) {
    normalized = normalized.startsWith('media/')
      ? `api/v1/${normalized}`
      : `api/v1/media/${normalized}`
  }
  return `${origin}/${normalized}`
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
  const [remoteBroken, setRemoteBroken] = useState(false)
  const serverUrl = resolveMediaUrl(previewUrl)
  const resolved = remoteBroken ? localPreview : (localPreview ?? serverUrl)

  useEffect(() => {
    setRemoteBroken(false)
  }, [previewUrl])

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview)
      }
    }
  }, [localPreview])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    setRemoteBroken(false)
    if (localPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview)
    }
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
            onLoad={() => {
              if (!localPreview && serverUrl) setRemoteBroken(false)
            }}
            onError={() => {
              if (localPreview) return
              setRemoteBroken(true)
            }}
          />
        ) : (
          <span
            className={`hospital-image-upload-empty ${kind === 'logo' ? 'hospital-image-upload-empty-logo' : 'hospital-image-upload-empty-cover'}`}
          >
            <ImageUploadPlaceholder size={kind === 'logo' ? 96 : 88} caption="Tap to upload" />
            {remoteBroken && serverUrl ? (
              <span className="image-upload-placeholder-caption" style={{ color: '#b42318' }}>
                Saved image could not load — upload again or check S3 public access
              </span>
            ) : null}
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
