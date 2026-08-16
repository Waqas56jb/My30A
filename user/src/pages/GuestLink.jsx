import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getGuestBySlug } from '../data/mockGuests'

/**
 * /guest/:guestId — the unique link a host shares after booking.
 *
 * There is no authentication yet: the slug resolves a guest + property from
 * mock data and seeds the session. When real auth lands, this component is
 * where the token exchange belongs.
 */
export default function GuestLink() {
  const { guestId } = useParams()
  const { setGuestSlug, guestSlug, status, error, reloadSession } = useApp()
  const [ready, setReady] = useState(false)
  useDocumentTitle('Opening your stay')

  const known = !!getGuestBySlug(guestId)

  useEffect(() => {
    if (!known) return
    if (guestId !== guestSlug) setGuestSlug(guestId)
    setReady(true)
  }, [guestId, guestSlug, setGuestSlug, known])

  if (!known) {
    return (
      <div className="page">
        <ErrorState
          title="This link is not active"
          error={{
            message:
              'We could not find a stay for this link. Check the link your host sent you, or open the demo stay.',
          }}
          onRetry={() => window.location.assign('/guest/demo')}
        />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="page">
        <ErrorState title="We could not open your stay" error={error} onRetry={reloadSession} />
      </div>
    )
  }

  if (!ready || status === 'loading') return <SkeletonPage />

  // Land on the property, since that is what the link unlocked.
  return <Navigate to="/my-stay" replace />
}
