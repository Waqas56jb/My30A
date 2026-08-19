import { api } from './api'

function shape(n) {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    at: n.created_at ?? n.at,
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

export function push() {
  return null
}
