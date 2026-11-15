import { Image, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import ActiveToggle from '../components/ActiveToggle'
import Modal from '../components/Modal'
import HospitalImageUpload, { resolveMediaUrl } from '../components/HospitalImageUpload'
import { ApiError } from '../api/http'
import { hasApiBackend } from '../config/api'
import * as adminApi from '../api/admin'
import type { HomeCarouselSlide } from '../api/admin'

const empty = {
  title: '',
  subtitle: '',
  imageUrl: '',
  actionUrl: '',
  sortOrder: 0,
  isActive: true,
}

export default function HomeCarouselPage() {
  const [slides, setSlides] = useState<HomeCarouselSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const rows = await adminApi.fetchHomeCarouselSlides()
      setSlides(rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load carousel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return slides
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
      .filter(
        (s) =>
          !q ||
          s.title.toLowerCase().includes(q) ||
          (s.subtitle ?? '').toLowerCase().includes(q),
      )
  }, [slides, query])

  function closeModal() {
    setOpen(false)
    setEditingId(null)
    setForm(empty)
    setUploadError(null)
  }

  async function onBannerPick(file: File) {
    if (!hasApiBackend()) {
      setUploadError('API is not configured — set VITE_API_BASE_URL or use the hosted admin URL.')
      return
    }
    setUploadingImage(true)
    setUploadError(null)
    try {
      const { url } = await adminApi.uploadHomeCarouselBanner(file)
      if (!url?.trim()) {
        throw new Error('Upload succeeded but no image URL was returned.')
      }
      setForm((prev) => ({ ...prev, imageUrl: url }))
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Upload failed. Check you are signed in and the API is reachable.'
      setUploadError(message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.imageUrl.trim()) {
      setUploadError('Upload a banner image before saving.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        imageUrl: form.imageUrl.trim(),
        actionUrl: form.actionUrl.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }
      if (editingId) {
        const updated = await adminApi.updateHomeCarouselSlide(editingId, payload)
        setSlides((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...updated } : s)))
      } else {
        const created = await adminApi.createHomeCarouselSlide(payload)
        setSlides((prev) => [...prev, created])
      }
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save slide')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(slide: HomeCarouselSlide, on: boolean) {
    const updated = await adminApi.updateHomeCarouselSlide(slide.id, { isActive: on })
    setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, ...updated } : s)))
  }

  async function remove(slide: HomeCarouselSlide) {
    if (!confirm(`Remove “${slide.title}”?`)) return
    await adminApi.deleteHomeCarouselSlide(slide.id)
    setSlides((prev) => prev.filter((s) => s.id !== slide.id))
  }

  const canSave = form.title.trim().length > 0 && form.imageUrl.trim().length > 0 && !uploadingImage

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Home carousel</h3>
          <p>Promotional banners on the employee app home screen (managed order & visibility)</p>
        </div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            setEditingId(null)
            setForm(empty)
            setUploadError(null)
            setOpen(true)
          }}
        >
          <Plus size={16} />
          Add slide
        </button>
      </div>

      {loading ? <p className="hint">Loading slides…</p> : null}
      {error ? <p className="hint" style={{ color: 'var(--danger)' }}>{error}</p> : null}

      <div className="toolbar">
        <div className="search">
          <Search size={16} color="#98A2B3" />
          <input
            placeholder="Search title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Order</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const src = resolveMediaUrl(s.imageUrl)
              return (
                <tr key={s.id}>
                  <td>
                    {src ? (
                      <img
                        src={src}
                        alt=""
                        style={{
                          width: 120,
                          height: 56,
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    ) : (
                      <span className="muted">
                        <Image size={16} /> No image
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="cell-title">{s.title}</div>
                    <div className="cell-sub">{s.subtitle || '—'}</div>
                  </td>
                  <td>{s.sortOrder}</td>
                  <td>
                    <ActiveToggle
                      active={s.isActive}
                      ariaLabel={`${s.title} on home carousel`}
                      onChange={(on) => void toggleActive(s, on)}
                    />
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditingId(s.id)
                        setForm({
                          title: s.title,
                          subtitle: s.subtitle ?? '',
                          imageUrl: s.imageUrl,
                          actionUrl: s.actionUrl ?? '',
                          sortOrder: s.sortOrder,
                          isActive: s.isActive,
                        })
                        setUploadError(null)
                        setOpen(true)
                      }}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => void remove(s)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editingId ? 'Edit carousel slide' : 'Add carousel slide'} wide onClose={closeModal}>
          <form onSubmit={(e) => void submit(e)}>
            <div className="form-grid">
              <div className="field full">
                <HospitalImageUpload
                  label="Banner image"
                  kind="cover"
                  previewUrl={form.imageUrl}
                  hint="16:9 recommended · JPG, PNG or WebP · max 5 MB"
                  onPick={(file) => void onBannerPick(file)}
                />
                {uploadingImage ? (
                  <p className="hint" style={{ marginTop: 8 }}>Uploading image…</p>
                ) : null}
                {uploadError ? (
                  <p className="hint" style={{ color: 'var(--danger)', marginTop: 8 }}>
                    {uploadError}
                  </p>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="carousel-title">Title</label>
                <input
                  id="carousel-title"
                  required
                  placeholder="e.g. Free health checkup camp"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="carousel-subtitle">Subtitle</label>
                <input
                  id="carousel-subtitle"
                  placeholder="Short supporting line (optional)"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="carousel-link">Link URL (optional)</label>
                <input
                  id="carousel-link"
                  placeholder="https://… deep link or web page"
                  value={form.actionUrl}
                  onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="carousel-sort">Sort order</label>
                <input
                  id="carousel-sort"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
                <span className="muted" style={{ fontSize: 11 }}>
                  Lower numbers appear first on the home screen.
                </span>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving || !canSave}>
                {saving ? 'Saving…' : 'Save slide'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
