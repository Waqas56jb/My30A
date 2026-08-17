import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar, TopBar, BottomTabs } from '../components/nav/HostNav'
import HostDrawer from '../components/nav/HostDrawer'
import { Toaster } from '../components/ui/Modal'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useVisualViewport } from '../hooks/useVisualViewport'

/**
 * The signed-in shell. Route guarding happens here rather than per page: an
 * unauthenticated visitor is bounced to login with the route they wanted, so
 * signing in returns them to it.
 */
export default function HostLayout() {
  const { status: authStatus, isAuthed } = useAuth()
  const { status, error, loadProperties, toasts, dismissToast } = useWorkspace()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const mainRef = useRef(null)

  useVisualViewport()

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  if (authStatus === 'checking') return <SkeletonPage />
  if (!isAuthed) return <Navigate to="/host/login" replace state={{ from: location.pathname }} />

  return (
    <div className="hshell">
      <a className="skip-link" href="#host-content">
        Skip to content
      </a>

      <Sidebar />
      <TopBar onOpenMenu={() => setMenuOpen(true)} />

      <main id="host-content" ref={mainRef} className="hmain" tabIndex={-1}>
        {status === 'loading' && <SkeletonPage />}
        {status === 'error' && (
          <div className="hpage">
            <ErrorState
              title="We could not load your properties"
              error={error}
              onRetry={loadProperties}
            />
          </div>
        )}
        {(status === 'ready' || status === 'idle') && <Outlet />}
      </main>

      <BottomTabs />
      <HostDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
