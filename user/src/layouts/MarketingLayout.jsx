import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteHeader from '../components/nav/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { Toaster } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'

/**
 * The public website shell: header, page, footer. No sidebar, no bottom tabs,
 * no app chrome of any kind.
 *
 * This is deliberately a different shell from `AppLayout`. A visitor who has
 * not booked anything should land on a website; the sidebar and tab bar only
 * appear once they step into the app itself.
 */
export default function MarketingLayout() {
  const location = useLocation()
  const { toasts, dismissToast } = useApp()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="site">
      <a className="skip-link" href="#site-content">
        Skip to content
      </a>

      <SiteHeader />

      <main id="site-content" className="site__main" tabIndex={-1}>
        <Outlet />
      </main>

      <div className="site__foot">
        <SiteFooter />
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
