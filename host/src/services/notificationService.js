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

export async function listNotifications() {
  return request(
    () => clone(db).sort((a, b) => String(b.at).localeCompare(String(a.at))),
    { label: 'your notifications' },
  )
}

export const unreadCountSync = () => db.filter((item) => !item.read).length

export async function markRead(id) {
  return request(() => {
    db = db.map((item) => (item.id === id ? { ...item, read: true } : item))
    persist()
    return clone(db)
  }, { label: 'your notifications' })
}

export async function markAllRead() {
  return request(() => {
    db = db.map((item) => ({ ...item, read: true }))
    persist()
    return clone(db)
  }, { label: 'your notifications' })
}

/** Services raise these when something happens the host should know about. */
export function push({ type = 'property', icon = 'bell', title, message, link, propertyId }) {
  const notification = {
    id: makeId('hn'),
    type,
    icon,
    title,
    message,
    link,
    propertyId,
    at: new Date().toISOString(),
    read: false,
  }
  db = [notification, ...db]
  persist()
  return clone(notification)
}
