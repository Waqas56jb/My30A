import { Link } from 'react-router-dom'
import Icon from './ui/Icon'
import Button from './ui/Button'
import SmartImage from './ui/SmartImage'
import { useApp } from '../context/AppContext'
import { SkeletonPage } from './ui/Skeleton'
import { PHOTO } from '../assets/images'

/**
 * Gate for property-specific screens.
 *
 * Rather than redirecting (which loses the guest's intent and makes the route
 * feel broken), an unlocked visitor gets an explanation of what is behind the
 * code and a way in. The destination content stays completely open.
 */
export default function RequireGuest({ children, title = 'This is part of your stay' , message }) {
  const { hasGuest, status } = useApp()

  if (status === 'loading') return <SkeletonPage />
  if (hasGuest) return children

  return (
    <div className="page">
      <div className="card" style={{ overflow: 'hidden', maxWidth: 720, margin: '0 auto' }}>
        <SmartImage photoId={PHOTO.duneWalkover} alt="" ratio="21x9" width={900} />
        <div className="card--pad" style={{ textAlign: 'center' }}>
          <span className="state__icon" style={{ margin: '0 auto var(--sp-3)' }} aria-hidden="true">
            <Icon name="key" />
          </span>
          <h1 style={{ fontSize: 'var(--fs-h2)' }}>{title}</h1>
          <p className="u-small u-muted" style={{ margin: '10px auto 0', maxWidth: '46ch' }}>
            {message ??
              'Your host sends an access code with your booking. Enter it once and your WiFi, door code, check-out steps, and concierge services all unlock here.'}
          </p>

          <div
            className="u-row u-wrap"
            style={{ justifyContent: 'center', marginTop: 'var(--sp-5)' }}
          >
            <Button to="/access" icon="key">
              Enter your code
            </Button>
            <Button to="/explore" variant="secondary" icon="compass">
              Keep exploring 30A
            </Button>
          </div>

          <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-4)' }}>
            Not staying with us yet?{' '}
            <Link to="/help" style={{ color: 'var(--sea-700)' }}>
              Ask us how it works
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
