import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function GuestLink() {
  const { guestId } = useParams()
  const { unlockWithCode, status, error, reloadSession, isAuthed, hasGuest } = useApp()
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(true)
  useDocumentTitle('Opening your stay')

  useEffect(() => {
    if (!isAuthed || !guestId) {
      setBusy(false)
      return
    }
    let cancelled = false
    setBusy(true)
    unlockWithCode(guestId).then((ok) => {
      if (cancelled) return
      setFailed(!ok)
      setBusy(false)
    })
    return () => {
      cancelled = true
    }
  }, [guestId, isAuthed, unlockWithCode])

  if (!isAuthed) return <Navigate to="/login" replace state={{ from: `/guest/${guestId}` }} />

  if (failed) {
    return (
      <div className="page">
        <ErrorState
          title="This link is not active"
          error={{
            message: 'We could not find a stay for this link. Check the link your host sent you.',
          }}
          onRetry={reloadSession}
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

  if (busy || status === 'loading') return <SkeletonPage />

  if (!hasGuest) return <Navigate to="/access" replace />

  return <Navigate to="/my-stay" replace />
}
