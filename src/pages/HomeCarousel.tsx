import { Image, Plus, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import ActiveToggle from '../components/ActiveToggle'
import Modal from '../components/Modal'
import { resolveMediaUrl } from '../components/HospitalImageUpload'
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
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

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

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await adminApi.createHomeCarouselSlide({
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        imageUrl: form.imageUrl.trim(),
        actionUrl: form.actionUrl.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      })
      setSlides((prev) => [...prev, created])
      setForm(empty)
      setOpen(false)
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

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h3>Home carousel</h3>
          <p>Promotional banners on the employee app home screen (managed order & visibility)</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
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
                  <td>
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
        <Modal title="Add carousel slide" onClose={() => setOpen(false)}>
          <form onSubmit={(e) => void submit(e)} className="form-grid">
            <label>
              Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label>
              Subtitle
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </label>
            <label>
              Image URL
              <input
                required
                placeholder="https://… or /media/…"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              />
            </label>
            <label>
              Link URL (optional)
              <input
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
              />
            </label>
            <label>
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save slide'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
