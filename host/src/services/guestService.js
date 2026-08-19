import { api } from './api'

function shapeGuest(guest) {
  return {
    id: guest.id,
    name: `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim(),
    email: guest.email,
    phone: guest.phone,
    propertyId: guest.property_id,
    propertyName: guest.property_name,
    checkIn: guest.check_in_date,
    checkOut: guest.check_out_date,
    accessStatus: guest.status,
  }
}

export async function listGuests({ propertyId = null, search = '', status = 'All' } = {}) {
  const rows = await api('/hosts/me/guests')
  return rows
    .map(shapeGuest)
    .filter((guest) => !propertyId || guest.propertyId === propertyId)
    .filter((guest) => status === 'All' || guest.accessStatus === status)
    .filter((guest) => {
      if (!search) return true
      const needle = search.trim().toLowerCase()
      return [guest.name, guest.email, guest.accessStatus].some((field) =>
        String(field ?? '').toLowerCase().includes(needle),
      )
    })
}

export async function getGuest(id) {
  const rows = await listGuests()
  const found = rows.find((guest) => guest.id === id)
  if (!found) throw Object.assign(new Error('We could not find that guest.'), { code: 'NOT_FOUND' })
  return found
}

export async function getGuestActivity() {
  return []
}

export async function getRecentActivity() {
  return []
}

export async function getGuestCounts(propertyId = null) {
  const list = await listGuests({ propertyId })
  return {
    all: list.length,
    active: list.filter((guest) => guest.accessStatus === 'active').length,
    invited: list.filter((guest) => guest.accessStatus === 'invited').length,
    expired: list.filter((guest) => guest.accessStatus === 'expired').length,
  }
}
