import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'
import * as partnerService from '../services/partnerService'
import * as notificationService from '../services/notificationService'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { makeId } from '../utils/format'

const PartnerContext = createContext(null)

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  performanceReports: true,
  profileUpdates: true,
  publicVisibility: true,
  simulateErrors: false,
}

/**
 * One provider for the whole portal: who is signed in, the business they
 * manage, their notifications, toasts, and the demo switches.
 */
export function PartnerProvider({ children }) {
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('checking') // checking | authed | guest
  const [partner, setPartner] = useState(null)
  const [loadState, setLoadState] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState(null)

  const [notifications, setNotifications] = useState([])
  const [toasts, setToasts] = useState([])
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...(readStore(STORAGE_KEYS.settings) ?? {}),
  }))

  /* ------------------------------ Toasts ------------------------------ */
  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast) => {
      const id = makeId('toast')
      const record = { id, tone: 'info', duration: 4000, ...toast }
      setToasts((list) => [...list.slice(-2), record])
      if (record.duration > 0) window.setTimeout(() => dismissToast(id), record.duration)
      return id
    },
    [dismissToast],
  )

  /* ----------------------------- Session ------------------------------ */
  useEffect(() => {
    const stored = authService.getSession()
    setSession(stored)
    setStatus(stored ? 'authed' : 'guest')
  }, [])

  const loadPartner = useCallback(async (partnerId) => {
    if (!partnerId) return null
    setLoadState('loading')
    setError(null)
    try {
      const record = await partnerService.getPartner(partnerId)
      setPartner(record)
      setLoadState('ready')
      return record
    } catch (err) {
      if (err?.code === 'AUTH_REQUIRED' || err?.code === 'AUTH_INVALID' || err?.code === 'AUTH_EXPIRED') {
        await authService.signOut()
        setSession(null)
        setStatus('guest')
        setLoadState('idle')
        return null
      }
      setError(err)
      setLoadState('error')
      return null
    }
  }, [])

  useEffect(() => {
    if (!session?.partnerId) {
      setPartner(null)
      setNotifications([])
      setLoadState('idle')
      return undefined
    }
    loadPartner(session.partnerId)
    notificationService.listNotifications(session.partnerId).then(setNotifications).catch(() => {})
  }, [session, loadPartner])

  const login = useCallback(async (credentials) => {
    const next = await authService.login(credentials)
    setSession(next)
    setStatus('authed')
    return next
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
    setPartner(null)
    setStatus('guest')
  }, [])

  /** Applying signs the new partner straight in so they can see their status. */
  const apply = useCallback(async (input) => {
    const created = await partnerService.applyAsPartner(input)
    if (created?.token) {
      const next = authService.startSessionFor(created)
      setSession(next)
      setStatus('authed')
    } else if (input.email && input.password) {
      const next = await authService.login({ email: input.email, password: input.password })
      setSession(next)
      setStatus('authed')
    }
    setPartner(created)
    return created
  }, [])

  /** Fold a service response back into state without a refetch. */
  const applyPartner = useCallback((next) => {
    setPartner(next)
    return next
  }, [])

  /* --------------------------- Notifications -------------------------- */
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  )

  const markNotificationRead = useCallback(async (id) => {
    setNotifications((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)))
    try {
      await notificationService.markRead(id)
    } catch {
      /* optimistic */
    }
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((list) => list.map((item) => ({ ...item, read: true })))
    try {
      await notificationService.markAllRead(session?.partnerId)
    } catch {
      /* optimistic */
    }
  }, [session])

  /* ------------------------------ Settings ---------------------------- */
  const updateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const merged = { ...prev, ...patch }
      writeStore(STORAGE_KEYS.settings, merged)
      return merged
    })
  }, [])

  const resetDemoData = useCallback(async () => {
    if (session?.partnerId) await loadPartner(session.partnerId)
  }, [session, loadPartner])

  const value = useMemo(
    () => ({
      session,
      status,
      isAuthed: status === 'authed',
      partner,
      loadState,
      error,
      loadPartner: () => loadPartner(session?.partnerId),
      applyPartner,
      login,
      signOut,
      apply,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      pushToast,
      dismissToast,
      settings,
      updateSettings,
      resetDemoData,
    }),
    [
      session,
      status,
      partner,
      loadState,
      error,
      loadPartner,
      applyPartner,
      login,
      signOut,
      apply,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      pushToast,
      dismissToast,
      settings,
      updateSettings,
      resetDemoData,
    ],
  )

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
}

export function usePartner() {
  const ctx = useContext(PartnerContext)
  if (!ctx) throw new Error('usePartner must be used inside <PartnerProvider>')
  return ctx
}

export const useToast = () => usePartner().pushToast
