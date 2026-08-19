import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, TopBar, MobileBottomNav } from '../components/nav/Navigation'
import MobileDrawer from '../components/nav/MobileDrawer'
import { Toaster } from '../components/ui/Modal'
import { ErrorState } from '../components/ui/States'
import { SkeletonPage } from '../components/ui/Skeleton'
import { useApp } from '../context/AppContext'
import { useVisualViewport } from '../hooks/useVisualViewport'
import { cx } from '../utils/format'

/** Routes that render their own full-height chrome. */
const FULLSCREEN_ROUTES = ['/vitoria']

/**
 * The guest shell: sidebar on desktop, top bar + bottom tabs + slide-in drawer
 * on mobile. It also owns the viewport hook (keyboard handling) and scroll
 * restoration. Public visitors get the same shell — only the property-specific
 * screens ask for a guest link.
 */
export default function AppLayout() {
  const location = useLocation()
  const { status, error, reloadSession, toasts, dismissToast } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const mainRef = useRef(null)
  const isFullscreen = FULLSCREEN_ROUTES.includes(location.pathname)

  useVisualViewport()

  // Reset scroll on navigation — the desktop scroll container is <main>.
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <Sidebar />

      {!isFullscreen && <TopBar onOpenMenu={() => setMenuOpen(true)} />}

      <main
        id="main-content"
        ref={mainRef}
        className={cx('app-main', isFullscreen && 'app-main--flush')}
        tabIndex={-1}
      >
        {status === 'loading' ? (
          <SkeletonPage />
        ) : (
          <>
            {status === 'error' && (
              <div className="page" style={{ paddingBottom: 0 }}>
                <ErrorState title="We could not refresh your stay" error={error} onRetry={reloadSession} />
              </div>
            )}
            <Outlet />
          </>
        )}
      </main>

      <MobileBottomNav />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
