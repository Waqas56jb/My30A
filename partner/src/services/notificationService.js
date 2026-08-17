import { request, clone, publish } from './mockClient'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { makeId } from '../utils/format'
import { mockNotifications } from '../data/notifications'

let db = readStore(STORAGE_KEYS.notifications) ?? clone(mockNotifications)

const persist = () => {
  writeStore(STORAGE_KEYS.notifications, db)
  publish('notifications', clone(db))
}

export function resetNotifications() {
  db = clone(mockNotifications)
  persist()
}

export async function listNotifications(partnerId) {
  return request(
    () =>
      clone(db)
        .filter((item) => !partnerId || item.partnerId === partnerId)
        .sort((a, b) => String(b.at).localeCompare(String(a.at))),
    { label: 'your notifications' },
  )
}

export async function markRead(id) {
  return request(() => {
    db = db.map((item) => (item.id === id ? { ...item, read: true } : item))
    persist()
    return clone(db)
  }, { label: 'your notifications' })
}

export async function markAllRead(partnerId) {
  return request(() => {
    db = db.map((item) => (!partnerId || item.partnerId === partnerId ? { ...item, read: true } : item))
    persist()
    return clone(db)
  }, { label: 'your notifications' })
}

/** Services raise these when something happens the partner should know about. */
export function push({ partnerId, type = 'listing', icon = 'bell', title, message, link }) {
  const notification = {
    id: makeId('pn'),
    partnerId,
    type,
    icon,
    title,
    message,
    link,
    at: new Date().toISOString(),
    read: false,
  }
  db = [notification, ...db]
  persist()
  return clone(notification)
}
