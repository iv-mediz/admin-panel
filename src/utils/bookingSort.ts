import type { Booking } from '../types'

function millisFromBookingId(id: string): number {
  const m = /^MC-([a-z0-9]+)/i.exec(id)
  if (!m) return 0
  const body = m[1]
  const now = Date.now()
  for (let len = 10; len >= 5; len--) {
    if (body.length < len) continue
    const n = parseInt(body.slice(0, len), 36)
    if (Number.isFinite(n) && n >= 1_400_000_000_000 && n <= now + 86_400_000) {
      return n
    }
  }
  return 0
}

export function bookingRecencyMillis(b: Booking): number {
  const fromId = millisFromBookingId(b.id)
  if (fromId) return fromId
  const parsed = Date.parse(b.dateTime)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function sortBookingsNewestFirst(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => bookingRecencyMillis(b) - bookingRecencyMillis(a))
}
