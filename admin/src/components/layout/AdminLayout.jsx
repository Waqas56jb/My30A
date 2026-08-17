import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'
import { Toaster } from '../ui/Modal'
import Sidebar from '../navigation/Sidebar'
import AdminDrawer from '../navigation/AdminDrawer'
import GlobalSearch from '../navigation/GlobalSearch'
import { useAdmin } from '../../context/AdminContext'
import { labelForPath } from '../navigation/navItems'
import { initials } from '../../utils/format'

/**
 * The shell: fixed rail on desktop, top bar plus a drawer below 1100px.
 *
 * The main column owns the vertical scroll on desktop so the rail and the top
 * bar stay put while a long table moves. Below 1100px the document scrolls
 * normally, which is what a phone expects.
 */
export default function AdminLayout() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { toasts, dismissToast, user, attentionCount } = useAdmin()
  const mainRef = useRef(null)

  /* A new page should start at the top, whichever element is scrolling.
     Guarded: Element.scrollTo does not exist everywhere (jsdom has no layout,
     and older Safari lacks the options form), and a missing scroll reset must
     never take the whole shell down with it. */
  useEffect(() => {
    const main = mainRef.current
    if (typeof main?.scrollTo === 'function') main.scrollTo({ top: 0, behavior: 'auto' })
    else if (main) main.scrollTop = 0
    if (typeof window.scrollTo === 'function') window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="ashell">
      <a className="skip-link" href="#admin-content">Skip to content</a>

      <Sidebar />

      <div className="ashell__body">
        <header className="atopbar">
          <button
            type="button"
            className="icon-btn atopbar__menu"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
          >
            <Icon name="list" />
          </button>

          <Link to="/admin/dashboard" className="atopbar__brand">
            <Icon name="waves" size={20} />
            <span>My30A</span>
          </Link>

          <span className="atopbar__crumb">{labelForPath(location.pathname)}</span>

          <GlobalSearch className="atopbar__search" />

          <div className="atopbar__actions">
            <Link
              to="/admin/operations"
              className="icon-btn atopbar__alerts"
              aria-label={
                attentionCount > 0
                  ? `${attentionCount} items need attention`
                  : 'Nothing needs attention'
              }
            >
              <Icon name="bell" />
              {attentionCount > 0 && <span className="icon-btn__badge">{attentionCount}</span>}
            </Link>
            <Link to="/admin/settings" className="atopbar__avatar" aria-label="Your account">
              {initials(user?.name ?? 'Admin')}
            </Link>
          </div>
        </header>

        <main id="admin-content" className="ashell__main" ref={mainRef} tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      <AdminDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
