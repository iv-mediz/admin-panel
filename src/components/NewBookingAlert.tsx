import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as adminApi from '../api/admin'
import { useDirectory } from '../data/directory'
import type { Booking } from '../types'
import Modal from './Modal'

const POLL_MS = 12000

function playDispatchBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.22)
    window.setTimeout(() => void ctx.close(), 400)
  } catch {
    /* ignore autoplay limits */
  }
}

export default function NewBookingAlert() {
  const navigate = useNavigate()
  const { updateBooking } = useDirectory()
  const knownIds = useRef<Set<string> | null>(null)
  const [queue, setQueue] = useState<Booking[]>([])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const rows = await adminApi.fetchBookings({ status: 'New' })
        if (cancelled) return
        const incoming = rows.filter((b) => b.status === 'New')
        for (const booking of incoming) updateBooking(booking)

        if (knownIds.current === null) {
          knownIds.current = new Set(incoming.map((b) => b.id))
          return
        }

        const fresh = incoming.filter((b) => !knownIds.current!.has(b.id))
        if (fresh.length === 0) return
        for (const booking of fresh) knownIds.current.add(booking.id)
        setQueue((prev) => {
          const seen = new Set(prev.map((b) => b.id))
          const next = [...prev, ...fresh.filter((b) => !seen.has(b.id))]
          if (prev.length === 0 && next.length > 0) playDispatchBeep()
          return next
        })
      } catch {
        /* keep polling */
      }
    }

    void poll()
    const timer = window.setInterval(() => void poll(), POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [updateBooking])

  const current = queue[0]
  if (!current) return null

  function dismiss() {
    setQueue((prev) => prev.slice(1))
  }

  function goAssign() {
    const booking = current
    dismiss()
    navigate('/ambulances', { state: { assignBookingId: booking.id } })
  }

  return (
    <Modal title="New ambulance booking" onClose={dismiss}>
      <div className="alert" style={{ marginBottom: 14 }}>
        A new trip request just came in. Assign a driver to dispatch.
      </div>
      <div className="detail-grid" style={{ marginBottom: 16 }}>
        <div className="meta">
          <span>Booking</span>
          <strong>{current.id}</strong>
        </div>
        <div className="meta">
          <span>Service</span>
          <strong>{current.serviceType}</strong>
        </div>
        <div className="meta">
          <span>Patient</span>
          <strong>{current.patientName || '—'}</strong>
        </div>
        <div className="meta">
          <span>Booked by</span>
          <strong>
            {current.bookedByName?.trim() || 'App user'}
            {current.bookedByPhone?.trim() || current.contactPhone?.trim()
              ? ` · ${current.bookedByPhone?.trim() || current.contactPhone}`
              : ''}
          </strong>
        </div>
        <div className="meta" style={{ gridColumn: '1 / -1' }}>
          <span>Route</span>
          <strong>
            {current.pickup} → {current.drop}
          </strong>
        </div>
        <div className="meta">
          <span>When</span>
          <strong>{current.dateTime || '—'}</strong>
        </div>
        <div className="meta">
          <span>Fare</span>
          <strong>{current.fare || '—'}</strong>
        </div>
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={dismiss}>
          Dismiss
        </button>
        <button type="button" className="btn btn-primary" onClick={goAssign}>
          Assign driver
        </button>
      </div>
    </Modal>
  )
}
