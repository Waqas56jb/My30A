import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/mockApi'
import { setAnalyticsContext, track, ANALYTICS_EVENTS } from '../services/analytics'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { resolveAccessCode } from '../data/mockGuests'
import { makeId } from '../utils/format'

const AppContext = createContext(null)

const DEFAULT_SETTINGS = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  vitoriaMemory: true,
  simulateErrors: false,
}

/**
 * Single source of truth for guest session state: who is staying, where,
 * their saved places and preferences, the notification feed, and toasts.
 * Everything reads through mockApi so the backend swap is a one-file change.
 */
export function AppProvider({ children }) {
  // No slug means the visitor is browsing publicly. The destination content is
  // open to everyone; only property-specific screens need a guest link.
  const [guestSlug, setGuestSlug] = useState(() => readStore(STORAGE_KEYS.guestSlug) ?? null)
  const [guest, setGuest] = useState(null)
  const [property, setProperty] = useState(null)
  const [status, setStatus] = useState(() =>
    readStore(STORAGE_KEYS.guestSlug) ? 'loading' : 'public',
  ) // public | loading | ready | error
  const [error, setError] = useState(null)

  const [notifications, setNotifications] = useState([])
  const [savedIds, setSavedIds] = useState([])
  const [toasts, setToasts] = useState([])
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(readStore(STORAGE_KEYS.settings) ?? {}),
  }))

  const openedRef = useRef(false)

  /* ---------------------------- Toasts ---------------------------- */
  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast) => {
      const id = makeId('toast')
      const record = { id, tone: 'info', duration: 4200, ...toast }
      setToasts((list) => [...list.slice(-2), record])
      if (record.duration > 0) {
        window.setTimeout(() => dismissToast(id), record.duration)
      }
      return id
    },
    [dismissToast],
  )

  /* ------------------------ Session bootstrap ---------------------- */
  const loadSession = useCallback(
    async (slug) => {
      setStatus('loading')
      setError(null)
      try {
        const { guest: nextGuest, property: nextProperty } = await api.resolveGuestLink(slug)
        setGuest(nextGuest)
        setProperty(nextProperty)
        setSavedIds(nextGuest.savedPlaceIds ?? [])
        setAnalyticsContext({
          guestId: nextGuest.id,
          propertyId: nextProperty?.id,
          propertySlug: nextProperty?.slug,
        })
        setStatus('ready')
        if (!openedRef.current) {
          openedRef.current = true
          track(ANALYTICS_EVENTS.GUEST_OPENED_APP, { slug })
        }
        return nextGuest
      } catch (err) {
        setError(err)
        setStatus('error')
        return null
      }
    },
    [],
  )

  useEffect(() => {
    writeStore(STORAGE_KEYS.guestSlug, guestSlug)
    if (!guestSlug) {
      setGuest(null)
      setProperty(null)
      setSavedIds([])
      setStatus('public')
      return
    }
    loadSession(guestSlug)
  }, [guestSlug, loadSession])

  /**
   * Exchange a printed access code (or a pasted guest link) for a session.
   * This is the single seam where real authentication will land.
   */
  const unlockWithCode = useCallback(
    (input) => {
      const slug = resolveAccessCode(input)
      if (!slug) return false
      setGuestSlug(slug)
      return true
    },
    [],
  )

  const signOut = useCallback(() => {
    setGuestSlug(null)
    pushToast({
      tone: 'info',
      title: 'Signed out of your stay',
      message: 'You can still explore 30A. Re-enter your code any time.',
    })
  }, [pushToast])

  /* -------------------------- Notifications ------------------------ */
  const refreshNotifications = useCallback(async () => {
    try {
      setNotifications(await api.getNotifications())
    } catch {
      /* notification feed failures should never break the shell */
    }
  }, [])

  useEffect(() => {
    refreshNotifications()
    return api.subscribeToNotifications((notification) => {
      setNotifications((list) => [notification, ...list])
      pushToast({ tone: 'info', title: notification.title, message: notification.message })
    })
  }, [refreshNotifications, pushToast])

  const markNotificationRead = useCallback(async (id) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await api.markNotificationRead(id)
    } catch {
      /* optimistic — local state already updated */
    }
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })))
    try {
      await api.markAllNotificationsRead()
    } catch {
      /* optimistic */
    }
  }, [])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  /* --------------------------- Saved places ------------------------ */
  const isSaved = useCallback((id) => savedIds.includes(id), [savedIds])

  const toggleSaved = useCallback(
    async (id, name) => {
      const wasSaved = savedIds.includes(id)
      const optimistic = wasSaved ? savedIds.filter((x) => x !== id) : [...savedIds, id]
      setSavedIds(optimistic)
      pushToast({
        tone: 'success',
        title: wasSaved ? 'Removed from saved' : 'Saved',
        message: name ? `${name} ${wasSaved ? 'removed from' : 'added to'} your trip` : undefined,
        duration: 2400,
      })
      try {
        const next = await api.toggleSavedPlace(id, savedIds)
        setSavedIds(next)
      } catch {
        setSavedIds(savedIds)
      }
    },
    [savedIds, pushToast],
  )

  /* --------------------------- Preferences ------------------------- */
  const updatePreferences = useCallback(async (next) => {
    setGuest((g) => (g ? { ...g, preferences: { ...g.preferences, ...next } } : g))
    try {
      await api.updatePreferences(next)
    } catch {
      /* optimistic */
    }
  }, [])

  /* ----------------------------- Settings -------------------------- */
  const updateSettings = useCallback((next) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next }
      writeStore(STORAGE_KEYS.settings, merged)
      api.setFailureMode(merged.simulateErrors)
      return merged
    })
  }, [])

  useEffect(() => {
    api.setFailureMode(settings.simulateErrors)
  }, [settings.simulateErrors])

  /* ------------------------- Demo utilities ------------------------ */
  const resetDemoData = useCallback(async () => {
    api.resetMockData()
    await refreshNotifications()
    await loadSession(guestSlug)
    pushToast({ tone: 'success', title: 'Demo data reset', message: 'All mock requests restored.' })
  }, [guestSlug, loadSession, refreshNotifications, pushToast])

  const value = useMemo(
    () => ({
      guestSlug,
      setGuestSlug,
      guest,
      property,
      status,
      hasGuest: !!guest,
      error,
      unlockWithCode,
      signOut,
      reloadSession: () => loadSession(guestSlug),
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      savedIds,
      isSaved,
      toggleSaved,
      updatePreferences,
      settings,
      updateSettings,
      resetDemoData,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      guestSlug,
      guest,
      property,
      status,
      error,
      unlockWithCode,
      signOut,
      loadSession,
      notifications,
      unreadCount,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      savedIds,
      isSaved,
      toggleSaved,
      updatePreferences,
      settings,
      updateSettings,
      resetDemoData,
      toasts,
      pushToast,
      dismissToast,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

/** Convenience selectors used all over the app. */
export const useGuest = () => useApp().guest
export const useProperty = () => useApp().property
export const useToast = () => useApp().pushToast
