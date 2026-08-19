import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Field, Input } from '../components/ui/Form'
import { Callout } from '../components/ui/Display'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { hero, PHOTO } from '../assets/images'

export default function Access() {
  const navigate = useNavigate()
  const { unlockWithCode, pushToast, hasGuest, guest, isAuthed } = useApp()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Unlock your stay')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!code.trim()) {
      setError('Enter the code your host sent you.')
      return
    }
    if (!isAuthed) {
      navigate('/login', { state: { from: '/access' } })
      return
    }
    setBusy(true)
    const ok = await unlockWithCode(code)
    setBusy(false)
    if (!ok) {
      setError('We do not recognise that code. Check it against your booking confirmation.')
      return
    }
    pushToast({ tone: 'success', title: 'Stay unlocked', message: 'Everything is ready for you.' })
    navigate('/discover')
  }

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
          <p className="u-small" style={{ color: 'rgba(255,255,255,.8)', marginTop: 10, maxWidth: '42ch' }}>
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

        {hasGuest ? (
          <>
            <div>
              <h1 style={{ fontSize: 'var(--fs-h1)' }}>You are already signed in</h1>
              <p className="u-small u-muted" style={{ marginTop: 8 }}>
                This device is unlocked for {guest.firstName}&apos;s stay.
              </p>
            </div>
            <Button to="/discover" size="lg" block iconRight="arrowRight">
              Continue to your stay
            </Button>
            <Button to="/my-stay" variant="secondary" block icon="key">
              Property details
            </Button>
          </>
        ) : (
          <>
            <div>
              <p className="u-eyebrow">Guest access</p>
              <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Unlock your stay</h1>
              <p className="u-small u-muted" style={{ marginTop: 8, maxWidth: '44ch' }}>
                Enter the code from your booking confirmation, or scan the QR sticker inside the
                front door.
              </p>
            </div>

            <form onSubmit={submit} className="u-stack" style={{ gap: 'var(--sp-4)' }}>
              <Field label="Access code" error={error} hint="Looks like MY30A-0000">
                {(props) => (
                  <Input
                    {...props}
                    className="input access__code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="MY30A-0000"
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck="false"
                    enterKeyHint="go"
                  />
                )}
              </Field>

              <Button type="submit" size="lg" block loading={busy} icon="key">
                Unlock my stay
              </Button>
            </form>

            <div className="access__qr">
              <span className="access__qr-grid" aria-hidden="true" />
              <span className="u-xs u-muted">
                Scanning the QR code in your welcome pack opens this app already unlocked.
              </span>
            </div>

            <Callout icon="info">
              No code yet? Your host sends one with the booking confirmation. You can still{' '}
              <Link to="/" style={{ textDecoration: 'underline' }}>
                explore 30A
              </Link>{' '}
              without it, or{' '}
              <Link to="/help" style={{ textDecoration: 'underline' }}>
                contact us
              </Link>
              .
            </Callout>
          </>
        )}
      </div>
    </div>
  )
}
