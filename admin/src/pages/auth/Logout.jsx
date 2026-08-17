import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import { SkeletonPage } from '../../components/ui/Skeleton'

/**
 * Signing out has its own unguarded route.
 *
 * Clearing the session while still standing on a guarded screen is a race:
 * React Router defers navigation inside a transition, so the state update
 * lands first, the guard re-renders, and the operator is bounced to /login
 * with a `from` pointing back at the page they just left. Stepping onto an
 * open route first has no such ordering problem.
 */
export default function Logout() {
  const { signOut } = useAdmin()
  const [done, setDone] = useState(false)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    Promise.resolve(signOut()).then(() => setDone(true))
  }, [signOut])

  if (done) return <Navigate to="/admin/login" replace />
  return <SkeletonPage />
}
