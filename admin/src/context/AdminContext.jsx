import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as auth from '../services/authService'
import * as api from '../services/adminApi'
import { makeId } from '../utils/format'

const AdminContext = createContext(null)

/**
 * Session, toasts and the attention counters the sidebar badges read from.
 *
 * The session is resolved synchronously from storage in `useState`, not in an
 * effect: an async check renders every guarded route as signed-out for one
 * frame and bounces the operator to /admin/login on each refresh.
 */
export function AdminProvider({ children }) {
  const [session, setSession] = useState(() => auth.getSession())
  const [toasts, setToasts] = useState([])
  const [overview, setOverview] = useState(null)

  const user = session?.user ?? null

  /* Every mutation stamps the audit log with whoever is signed in. */
  useEffect(() => {
    if (user) api.setAuditActor({ id: user.email, name: user.name, role: user.role })
  }, [user])

  /* ------------------------------ Toasts ------------------------------ */
  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const pushToast = useCallback(
    (toast) => {
      const id = makeId('toast')
      const record = { id, tone: 'info', duration: 4200, ...toast }
      setToasts((list) => [...list.slice(-2), record])
      if (record.duration > 0) window.setTimeout(() => dismissToast(id), record.duration)
      return id
    },
    [dismissToast],
  )

  /* --------------------------- Attention feed -------------------------- */
  const refreshOverview = useCallback(async () => {
    try {
      setOverview(await api.getOverview())
    } catch {
      /* the badges are a convenience; a failure must not break the shell */
    }
  }, [])

  useEffect(() => {
    if (!user) return undefined
    refreshOverview()
    /* Any table change can change a queue count, so listen broadly rather
       than wiring each screen to remember to refresh the sidebar. */
    const topics = ['partners', 'orders', 'transfers', 'payments', 'refunds', 'reviews', 'hosts']
    const unsubscribes = topics.map((topic) => api.subscribe(topic, refreshOverview))
    return () => unsubscribes.forEach((fn) => fn())
  }, [user, refreshOverview])

  /* ------------------------------- Auth -------------------------------- */
  const logIn = useCallback(async (credentials) => {
    const next = await auth.login(credentials)
    setSession(next)
    return next.user
  }, [])

  const signOut = useCallback(async () => {
    await auth.signOut()
    setSession(null)
    setOverview(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthed: !!user,
      logIn,
      signOut,
      can: (area, minimum) => auth.can(user, area, minimum),
      toasts,
      pushToast,
      dismissToast,
      overview,
      refreshOverview,
      attention: overview?.attention ?? [],
      attentionCount: (overview?.attention ?? []).reduce((sum, a) => sum + a.count, 0),
    }),
    [user, logIn, signOut, toasts, pushToast, dismissToast, overview, refreshOverview],
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>')
  return ctx
}

export const useToast = () => useAdmin().pushToast
