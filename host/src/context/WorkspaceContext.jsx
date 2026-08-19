import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as propertyService from '../services/propertyService'
import * as notificationService from '../services/notificationService'
import * as recommendationService from '../services/recommendationService'
import { readStore, writeStore, STORAGE_KEYS } from '../utils/storage'
import { makeId } from '../utils/format'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext(null)

const DEFAULT_SETTINGS = { simulateErrors: false, maskSecrets: true }

/**
 * Everything the signed-in host works on: their properties, which one is
 * selected, the notification feed, and toasts. Toasts live here rather than in
 * a page so any screen can raise one.
 */
export function WorkspaceProvider({ children }) {
  const { isAuthed, signOut } = useAuth()

  const [properties, setProperties] = useState([])
  const [activePropertyId, setActivePropertyId] = useState(
    () => readStore(STORAGE_KEYS.activeProperty) ?? null,
  )
  const [status, setStatus] = useState('idle') // idle | loading | ready | error
  const [error, setError] = useState(null)

  const [notifications, setNotifications] = useState([])
  const [recommendations, setRecommendations] = useState([])
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

  /* ---------------------------- Properties ---------------------------- */
  const loadProperties = useCallback(async () => {
    setStatus('loading')
    setError(null)
    try {
      const list = await propertyService.listProperties()
      setProperties(list)
      setStatus('ready')
      return list
    } catch (err) {
      if (err?.code === 'AUTH_REQUIRED' || err?.code === 'AUTH_INVALID' || err?.code === 'AUTH_EXPIRED') {
        await signOut()
        setStatus('idle')
        return []
      }
      setError(err)
      setStatus('error')
      return []
    }
  }, [signOut])

  useEffect(() => {
    if (!isAuthed) {
      setProperties([])
      setStatus('idle')
      return undefined
    }
    loadProperties()
    recommendationService.listRecommendations().then(setRecommendations).catch(() => {})
    notificationService.listNotifications().then(setNotifications).catch(() => {})
    return notificationService.subscribe((notification) => {
      setNotifications((list) =>
        list.some((row) => row.id && row.id === notification.id)
          ? list
          : [notification, ...list],
      )
      pushToast({ tone: 'info', title: notification.title, message: notification.message })
    })
  }, [isAuthed, loadProperties])

  // Keep a valid property selected at all times.
  useEffect(() => {
    if (properties.length === 0) return
    const stillExists = properties.some((property) => property.id === activePropertyId)
    if (!stillExists) setActivePropertyId(properties[0].id)
  }, [properties, activePropertyId])

  useEffect(() => {
    if (activePropertyId) writeStore(STORAGE_KEYS.activeProperty, activePropertyId)
  }, [activePropertyId])

  const activeProperty = useMemo(
    () => properties.find((property) => property.id === activePropertyId) ?? properties[0] ?? null,
    [properties, activePropertyId],
  )

  /** Optimistically fold a service response back into the list. */
  const applyProperty = useCallback((next) => {
    setProperties((list) => list.map((property) => (property.id === next.id ? next : property)))
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
      await notificationService.markAllRead()
    } catch {
      /* optimistic */
    }
  }, [])

  /* ------------------------------ Settings ---------------------------- */
  const updateWorkspaceSettings = useCallback((patch) => {
    setSettings((prev) => {
      const merged = { ...prev, ...patch }
      writeStore(STORAGE_KEYS.settings, merged)
      return merged
    })
  }, [])

  const resetDemoData = useCallback(async () => {
    await loadProperties()
    const next = await recommendationService.listRecommendations().catch(() => [])
    setRecommendations(next)
    const notes = await notificationService.listNotifications().catch(() => [])
    setNotifications(notes)
  }, [loadProperties])

  const recommendationCount = useCallback(
    (propertyId) => recommendations.filter((rec) => rec.propertyId === propertyId).length,
    [recommendations],
  )

  const value = useMemo(
    () => ({
      properties,
      activeProperty,
      activePropertyId: activeProperty?.id ?? null,
      setActivePropertyId,
      status,
      error,
      loadProperties,
      applyProperty,
      recommendations,
      recommendationCount,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      pushToast,
      dismissToast,
      settings,
      updateWorkspaceSettings,
      resetDemoData,
    }),
    [
      properties,
      activeProperty,
      status,
      error,
      loadProperties,
      applyProperty,
      recommendations,
      recommendationCount,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      toasts,
      pushToast,
      dismissToast,
      settings,
      updateWorkspaceSettings,
      resetDemoData,
    ],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>')
  return ctx
}

export const useToast = () => useWorkspace().pushToast
