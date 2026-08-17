import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import { AuthHeading, FormError } from '../../components/auth/AuthBits'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { requestPasswordReset } from '../../services/authService'

/**
 * Password reset, step one.
 *
 * The success screen never says whether the address is registered — that would
 * let anyone check which emails have accounts. The demo link only exists
 * because a prototype has no inbox; it disappears with the real backend.
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(null)

  useDocumentTitle('Reset your password')

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      setSent(await requestPasswordReset(email))
    } catch (error) {
      setErrors(error.field ? { [error.field]: error.message } : { form: error.message })
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <>
        <span className="state__icon" aria-hidden="true">
          <Icon name="mail" />
        </span>

        <AuthHeading title="Check your email">
          If an account exists for <strong>{sent.email}</strong>, a link to set a new password is on
          its way. It expires in an hour.
        </AuthHeading>

        {sent.token ? (
          <Callout icon="info">
            <strong style={{ display: 'block', marginBottom: 4 }}>Prototype shortcut</strong>
            There is no mailbox in this demo, so the link is here instead.
            <div style={{ marginTop: 'var(--sp-3)' }}>
              <Button to={`/reset-password?token=${sent.token}`} size="sm" iconRight="arrowRight">
                Open the reset link
              </Button>
            </div>
          </Callout>
        ) : (
          <Callout icon="info">
            No account uses that address in this demo — try <code>sarah@my30a.com</code>.
          </Callout>
        )}

        <div className="u-stack" style={{ gap: 'var(--sp-2)' }}>
          <Button variant="secondary" block onClick={() => setSent(null)} icon="refresh">
            Use a different email
          </Button>
          <Button to="/login" variant="ghost" block>
            Back to log in
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <AuthHeading eyebrow="Password reset" title="Forgot your password?">
        Enter the email on your account and we will send a link to set a new one.
      </AuthHeading>

      <form onSubmit={submit} className="u-stack" style={{ gap: 'var(--sp-4)' }} noValidate>
        <FormError>{errors.form}</FormError>

        <Field label="Email" error={errors.email}>
          {(props) => (
            <Input
              {...props}
              className="input auth__email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              enterKeyHint="send"
            />
          )}
        </Field>

        <Button type="submit" size="lg" block loading={busy} icon="mail">
          Send reset link
        </Button>
      </form>

      <p className="u-small u-muted" style={{ textAlign: 'center' }}>
        Remembered it?{' '}
        <Link to="/login" className="auth__link">
          Back to log in
        </Link>
      </p>
    </>
  )
}
