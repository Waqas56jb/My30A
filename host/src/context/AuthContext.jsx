import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext(null)

/**
 * Mock session state. `status` drives the route guards:
 *   checking -> we have not read storage yet, render nothing decisive
 *   authed   -> a host is signed in
 *   guest    -> nobody is signed in
 */
export function AuthProvider({ children }) {
  const [host, setHost] = useState(null)
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const session = authService.getSession()
    setHost(session?.host ?? null)
    setStatus(session?.host ? 'authed' : 'guest')
  }, [])

  const login = useCallback(async (credentials) => {
    const session = await authService.login(credentials)
    setHost(session.host)
    setStatus('authed')
    return session.host
  }, [])

  const signUp = useCallback(async (input) => {
    const session = await authService.signUp(input)
    setHost(session.host)
    setStatus('authed')
    return session.host
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setHost(null)
    setStatus('guest')
  }, [])

  const updateProfile = useCallback(async (patch) => {
    const next = await authService.updateProfile(patch)
    setHost(next)
    return next
  }, [])

  const updateSettings = useCallback(async (patch) => {
    const next = await authService.updateSettings(patch)
    setHost(next)
    return next
  }, [])

  const value = useMemo(
    () => ({
      host,
      status,
      isAuthed: status === 'authed',
      login,
      signUp,
      signOut,
      updateProfile,
      updateSettings,
    }),
    [host, status, login, signUp, signOut, updateProfile, updateSettings],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
