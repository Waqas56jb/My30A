import { api } from './api'
import { connectNotifications } from './realtime'
import { showBrowserNotification, restorePushIfGranted } from './pushClient'

function shape(n) {
  const at = n.created_at ?? n.createdAt ?? n.at ?? null
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: String(n.type ?? 'info').toLowerCase(),
    read: Boolean(n.read),
    at,
    createdAt: at,
    link: n.link,
  }
}

export function resetNotifications() {}
export const unreadCountSync = () => 0

export async function listNotifications() {
  const data = await api('/notifications')
  return (data.items ?? data).map(shape)
}

export async function markRead(id) {
  await api(`/notifications/${id}/read`, { method: 'POST', body: {} })
  return listNotifications()
}

export async function markAllRead() {
  await api('/notifications/read-all', { method: 'POST', body: {} })
  return listNotifications()
}

export function subscribe(onNotification) {
  restorePushIfGranted()
  const seen = new Set()
  let primed = false

  const deliver = (raw) => {
    const notification = shape({ ...raw, read: raw.read ?? false })
    if (notification.id) {
      if (seen.has(notification.id)) return
      seen.add(notification.id)
    }
    onNotification?.(notification)
    showBrowserNotification(notification)
  }

  const stopSocket = connectNotifications(deliver)

  const poll = async () => {
    try {
      const items = await listNotifications()
      if (!primed) {
        items.forEach((item) => {
          if (item.id) seen.add(item.id)
        })
        primed = true
        return
      }
      items
        .filter((item) => item.id && !seen.has(item.id))
        .reverse()
        .forEach(deliver)
    } catch {
      /* inbox is a convenience */
    }
  }
  poll()
  const timer = window.setInterval(poll, 12000)

  return () => {
    stopSocket()
    window.clearInterval(timer)
  }
}

export function push() {
  return null
}
