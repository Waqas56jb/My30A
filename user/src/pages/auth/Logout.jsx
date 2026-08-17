import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { SkeletonPage } from '../../components/ui/Skeleton'

/**
 * Signing out has its own route, and it is deliberately not guarded.
 *
 * Clearing the account while still standing on a guarded screen is a race:
 * React Router defers navigation inside a transition, so the urgent state
 * update lands first, RequireAuth re-renders, and the guest is bounced to
 * /login instead of the website. Stepping onto an open route first, then
 * clearing, has no such ordering problem.
 */
export default function Logout() {
  const { signOut } = useApp()
  const [done, setDone] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    Promise.resolve(signOut()).then(() => setDone(true))
  }, [signOut])

  if (done) return <Navigate to="/" replace />
  return <SkeletonPage />
}
