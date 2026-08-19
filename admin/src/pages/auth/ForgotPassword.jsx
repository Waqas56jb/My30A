import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Form'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { requestPasswordReset } from '../../services/authService'
import { hero, PHOTO } from '../../assets/images'

/**
 * Password reset request.
 *
 * The confirmation never says whether the address is registered — for an admin
 * panel that is the difference between a nuisance and a list of who works here.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(null)

  useDocumentTitle('Reset your password')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      setSent(await requestPasswordReset(email))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="alogin">
      <header className="alogin__mobile">
        <span className="alogin__mark" aria-hidden="true">
          <Icon name="waves" />
        </span>
        <span>
          <strong>My30A</strong>
          <em>Admin</em>
        </span>
      </header>

      <aside className="alogin__aside">
        <img src={hero(PHOTO.duneWalkover)} alt="" />
        <span className="alogin__mark" aria-hidden="true">
          <Icon name="waves" />
        </span>
        <p className="alogin__kicker">My30A Host</p>
        <h2>Reset your operations password</h2>
      </aside>

      <div className="alogin__panel">
        <Link to="/admin/login" className="u-row" style={{ gap: 8, alignSelf: 'flex-start' }}>
          <Icon name="arrowLeft" size={18} />
          <span className="u-small">Back to sign in</span>
        </Link>

        {sent ? (
          <>
            <span className="inline-empty__icon" aria-hidden="true" style={{ margin: 0 }}>
              <Icon name="mail" />
            </span>
            <div>
              <h1 style={{ fontSize: 'var(--fs-h1)' }}>Check your email</h1>
              <p className="u-small u-muted" style={{ marginTop: 8, maxWidth: '46ch' }}>
                If an admin account exists for <strong>{sent.email}</strong>, a link to set a new
                password is on its way. It expires in one hour.
              </p>
            </div>
            <Button to="/admin/login" size="lg" block iconRight="arrowRight">
              Back to sign in
            </Button>
          </>
        ) : (
          <>
            <div>
              <p className="u-eyebrow">Password reset</p>
              <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Forgot your password?</h1>
              <p className="u-small u-muted" style={{ marginTop: 8, maxWidth: '44ch' }}>
                Enter your work email and we will send a link to set a new one.
              </p>
            </div>

            <form onSubmit={submit} className="u-stack" style={{ gap: 'var(--sp-4)' }} noValidate>
              <Field label="Work email" error={error}>
                {(props) => (
                  <Input
                    {...props}
                    className="input alogin__email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@my30a.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck="false"
                    style={{ fontSize: 'max(16px, var(--fs-body))' }}
                  />
                )}
              </Field>
              <Button type="submit" size="lg" block loading={busy} icon="mail">
                Send reset link
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
