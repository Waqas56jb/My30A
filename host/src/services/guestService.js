import { request, clone, notFound } from './mockClient'
import { mockGuests, mockGuestActivity, mockRecentActivity } from '../data/guests'

const matches = (guest, query) => {
  if (!query) return true
  const needle = query.trim().toLowerCase()
  return [guest.name, guest.email, guest.accessStatus]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(needle))
}

export async function listGuests({ propertyId = null, search = '', status = 'All' } = {}) {
  return request(
    () =>
      clone(mockGuests)
        .filter((guest) => !propertyId || guest.propertyId === propertyId)
        .filter((guest) => status === 'All' || guest.accessStatus === status)
        .filter((guest) => matches(guest, search))
        .sort((a, b) => String(b.checkIn).localeCompare(String(a.checkIn))),
    { label: 'your guests' },
  )
}

export async function getGuest(id) {
  return request(
    () => {
      const found = mockGuests.find((guest) => guest.id === id)
      if (!found) throw notFound('that guest')
      return clone(found)
    },
    { label: 'this guest' },
  )
}

export async function getGuestActivity(id) {
  return request(() => clone(mockGuestActivity[id] ?? []), { label: 'guest activity' })
}

export async function getRecentActivity({ propertyId = null, limit = 6 } = {}) {
  return request(
    () =>
      clone(mockRecentActivity)
        .filter((item) => !propertyId || item.propertyId === propertyId)
        .slice(0, limit),
    { label: 'recent activity' },
  )
}

/** Counts used by the guests page tabs. */
export async function getGuestCounts(propertyId = null) {
  return request(() => {
    const list = mockGuests.filter((guest) => !propertyId || guest.propertyId === propertyId)
    return {
      all: list.length,
      active: list.filter((guest) => guest.accessStatus === 'active').length,
      invited: list.filter((guest) => guest.accessStatus === 'invited').length,
      expired: list.filter((guest) => guest.accessStatus === 'expired').length,
    }
  }, { label: 'your guests' })
}
