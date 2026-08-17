import { useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Sidebar, TopBar, BottomTabs } from '../components/nav/PartnerNav'
import PartnerDrawer from '../components/nav/PartnerDrawer'
import { Toaster } from '../components/ui/Modal'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { usePartner } from '../context/PartnerContext'

/**
 * The signed-in shell. Route guarding lives here rather than per page: an
 * unauthenticated visitor is sent to login with the route they wanted, so
 * signing in returns them to it.
 */
export default function PortalLayout() {
  const { status, isAuthed, loadState, error, loadPartner, toasts, dismissToast } = usePartner()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const mainRef = useRef(null)

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  if (status === 'checking') return <SkeletonPage />
  if (!isAuthed) return <Navigate to="/partner/login" replace state={{ from: location.pathname }} />

  return (
    <div className="pshell">
      <a className="skip-link" href="#partner-content">
        Skip to content
      </a>

      <Sidebar />
      <TopBar onOpenMenu={() => setMenuOpen(true)} />

      <main id="partner-content" ref={mainRef} className="pmain" tabIndex={-1}>
        {loadState === 'loading' && <SkeletonPage />}
        {loadState === 'error' && (
          <div className="ppage">
            <ErrorState
              title="We could not load your business"
              error={error}
              onRetry={loadPartner}
            />
          </div>
        )}
        {(loadState === 'ready' || loadState === 'idle') && <Outlet />}
      </main>

      <BottomTabs />
      <PartnerDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
