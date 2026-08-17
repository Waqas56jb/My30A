import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as api from '../services/mockApi'
import * as auth from '../services/authService'
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
  /* ------------------------------ Account ------------------------------
     Read synchronously from storage. An async check would render every
     guarded route as "signed out" for one frame and bounce the guest to
     /login on every refresh. */
  const [account, setAccount] = useState(() => auth.getSession()?.account ?? null)

  // No slug means no stay is attached yet. The destination content is open to
  // everyone; the app itself needs an account, and property-specific screens
  // need a stay on top of that.
  const [guestSlug, setGuestSlug] = useState(
    () => readStore(STORAGE_KEYS.guestSlug) ?? auth.getSession()?.account?.guestSlug ?? null,
  )
  const [guest, setGuest] = useState(null)
  const [property, setProperty] = useState(null)
  const [status, setStatus] = useState(() =>
    readStore(STORAGE_KEYS.guestSlug) ?? auth.getSession()?.account?.guestSlug
      ? 'loading'
      : 'public',
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

  /* --------------------------- Authentication ---------------------------
     An account is who you are; a stay is which house you are in this week.
     Logging in restores both, because the account remembers the last stay
     that was linked to it. */

  const adoptSession = useCallback((session) => {
    setAccount(session.account)
    // A returning guest should not have to re-enter a code they already used.
    if (session.account?.guestSlug) setGuestSlug(session.account.guestSlug)
    return session.account
  }, [])

  const logIn = useCallback(
    async (credentials) => adoptSession(await auth.login(credentials)),
    [adoptSession],
  )

  const signUp = useCallback(
    async (input) => adoptSession(await auth.signUp(input)),
    [adoptSession],
  )

  const signOut = useCallback(async () => {
    await auth.signOut()
    setAccount(null)
    setGuestSlug(null)
    pushToast({
      tone: 'info',
      title: 'Signed out',
      message: 'Your stay is safe — log back in any time to pick it up.',
    })
  }, [pushToast])

  /**
   * Exchange a printed access code (or a pasted guest link) for a stay.
   *
   * This attaches a property to whoever is signed in; it is not a login. The
   * link is remembered on the account so the next sign-in goes straight there.
   */
  const unlockWithCode = useCallback(
    (input) => {
      const slug = resolveAccessCode(input)
      if (!slug) return false
      setGuestSlug(slug)
      if (account?.id) {
        auth.linkStayToAccount(account.id, slug).then((next) => {
          if (next) setAccount(next)
        })
      }
      return true
    },
    [account],
  )

  /** Detach the property but stay logged in — for end of holiday. */
  const leaveStay = useCallback(async () => {
    setGuestSlug(null)
    if (account?.id) {
      const next = await auth.linkStayToAccount(account.id, null)
      if (next) setAccount(next)
    }
    pushToast({
      tone: 'info',
      title: 'Stay removed',
      message: 'Your account is still signed in. Enter a new code whenever you book again.',
    })
  }, [account, pushToast])

  const updateAccount = useCallback(async (patch) => {
    const next = await auth.updateAccount(patch)
    setAccount(next)
    return next
  }, [])

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
      account,
      isAuthed: !!account,
      logIn,
      signUp,
      updateAccount,
      leaveStay,
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
      account,
      logIn,
      signUp,
      updateAccount,
      leaveStay,
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
export const useAuth = () => {
  const { account, isAuthed, logIn, signUp, signOut } = useApp()
  return { account, isAuthed, logIn, signUp, signOut }
}
export const useGuest = () => useApp().guest
export const useProperty = () => useApp().property
export const useToast = () => useApp().pushToast
