import { api } from './api'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

export function showBrowserNotification(notification) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (typeof document !== 'undefined' && document.hasFocus()) return
  try {
    const n = new Notification(notification.title || 'My30A', {
      body: notification.message || '',
      icon: '/favicon.svg',
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* some browsers throw if the payload is empty */
  }
}

export async function enablePush() {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
    return false
  }
  if (Notification.permission === 'denied') return false
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
  }
  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const { publicKey } = await api('/push/vapid-key')
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }
  const json = subscription.toJSON()
  await api('/push/subscribe', {
    method: 'POST',
    body: { endpoint: json.endpoint, keys: json.keys },
  })
  return true
}

export async function disablePush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return
  const endpoint = subscription.endpoint
  await subscription.unsubscribe().catch(() => {})
  await api('/push/unsubscribe', { method: 'POST', body: { endpoint } }).catch(() => {})
}

export function restorePushIfGranted() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  enablePush().catch(() => {})
}
