import { Link, Outlet } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { Toaster } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { hero, PHOTO } from '../assets/images'

/**
 * Shell for login / signup / password reset.
 *
 * Deliberately its own layout: no site header, no sidebar, no tab bar. An auth
 * screen with navigation on it invites people to wander off half-way through
 * signing in. The photograph carries the brand instead.
 */
export default function AuthLayout() {
  const { toasts, dismissToast } = useApp()

  return (
    <div className="access">
      <div className="access__media">
        <img src={hero(PHOTO.duneWalkover)} alt="" />
        <div className="access__media-body">
          <p className="u-eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}>
            My30A
          </p>
          <h2 style={{ color: '#fff', fontSize: '1.9rem', maxWidth: '16ch', lineHeight: 1.1 }}>
            Everything about your stay, in one place.
          </h2>
          <p
            className="u-small"
            style={{ color: 'rgba(255,255,255,.8)', marginTop: 10, maxWidth: '42ch' }}
          >
            WiFi and door codes, groceries before you arrive, a ride from the airport, and a local
            concierge who already knows which house you are in.
          </p>
        </div>
      </div>

      <div className="access__panel">
        <Link to="/" className="u-row" style={{ gap: 10, alignSelf: 'flex-start' }}>
          <Icon name="arrowLeft" size={18} />
          <span className="u-small">Back to 30A</span>
        </Link>

        <Outlet />
      </div>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
