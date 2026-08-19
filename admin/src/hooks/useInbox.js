import { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../services/adminApi'
import { playNotificationSound, unlockNotificationSound } from '../utils/notifySound'

const POLL_MS = 12000

function inboxIcon(type) {
  const value = String(type ?? '').toUpperCase()
  if (value.includes('PARTNER')) return 'sparkles'
  if (value.includes('GROCERY') || value.includes('ORDER')) return 'bag'
  if (value.includes('TRANSFER')) return 'car'
  if (value.includes('HOST')) return 'building'
  if (value.includes('REVIEW')) return 'star'
  if (value.includes('PAY')) return 'creditCard'
  return 'bell'
}

/**
 * Personal admin inbox: poll, mark read, chime when a new row appears.
 */
export function useInbox() {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [arriving, setArriving] = useState(null)
  const knownIds = useRef(null)
  const arrivingTimer = useRef(null)

  const reload = useCallback(async () => {
    try {
      const data = await api.getInbox()
      const nextItems = (data.items ?? []).map((row) => ({ ...row, icon: inboxIcon(row.type) }))
      const nextUnread = Number(data.unread) || nextItems.filter((row) => !row.read).length

      if (knownIds.current === null) {
        knownIds.current = new Set(nextItems.map((row) => row.id))
      } else {
        const fresh = nextItems.filter((row) => !knownIds.current.has(row.id))
        if (fresh.length) {
          playNotificationSound()
          const latest = fresh[0]
          setArriving(latest)
          window.clearTimeout(arrivingTimer.current)
          arrivingTimer.current = window.setTimeout(() => setArriving(null), 5600)
        }
        knownIds.current = new Set(nextItems.map((row) => row.id))
      }

      setItems(nextItems)
      setUnread(nextUnread)
    } catch {
      /* inbox is a convenience; a miss must not crash the shell */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    const timer = window.setInterval(reload, POLL_MS)
    const onFocus = () => reload()
    const onUnlock = () => unlockNotificationSound()
    window.addEventListener('focus', onFocus)
    window.addEventListener('visibilitychange', onFocus)
    window.addEventListener('pointerdown', onUnlock, { once: true })
    return () => {
      window.clearInterval(timer)
      window.clearTimeout(arrivingTimer.current)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('visibilitychange', onFocus)
      window.removeEventListener('pointerdown', onUnlock)
    }
  }, [reload])

  const markRead = useCallback(async (id) => {
    setItems((list) => list.map((row) => (row.id === id ? { ...row, read: true } : row)))
    setUnread((count) => Math.max(0, count - 1))
    try {
      await api.markNotificationRead(id)
    } catch {
      reload()
    }
  }, [reload])

  const markAllRead = useCallback(async () => {
    setItems((list) => list.map((row) => ({ ...row, read: true })))
    setUnread(0)
    try {
      await api.markAllInboxRead()
    } catch {
      reload()
    }
  }, [reload])

  const dismissArriving = useCallback(() => {
    window.clearTimeout(arrivingTimer.current)
    setArriving(null)
  }, [])

  return { items, unread, loading, arriving, dismissArriving, reload, markRead, markAllRead }
}
