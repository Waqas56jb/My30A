import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Callout } from '../../components/ui/Display'
import { AuthHeading, FormError, PasswordField, StrengthMeter } from '../../components/auth/AuthBits'
import { useApp } from '../../context/AppContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { resetPassword } from '../../services/authService'

/**
 * Password reset, step two.
 *
 * The token arrives in the query string. A missing or spent token is its own
 * state with a way forward — a dead-end here is how people give up on an
 * account entirely.
 */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { pushToast } = useApp()

  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useDocumentTitle('Set a new password')

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      await resetPassword({ token, password, confirmPassword })
      pushToast({
        tone: 'success',
        title: 'Password updated',
        message: 'Log in with your new password.',
      })
      navigate('/login', { replace: true })
    } catch (error) {
      setErrors(error.field ? { [error.field]: error.message } : { form: error.message })
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <>
        <span className="state__icon" aria-hidden="true">
          <Icon name="alert" />
        </span>
        <AuthHeading title="This link is not complete">
          A reset link carries a one-time code, and this one has none. Request a fresh link and it
          will work.
        </AuthHeading>
        <Button to="/forgot-password" size="lg" block icon="mail">
          Request a new link
        </Button>
        <Button to="/login" variant="ghost" block>
          Back to log in
        </Button>
      </>
    )
  }

  return (
    <>
      <AuthHeading eyebrow="Password reset" title="Set a new password">
        Choose something you have not used here before. You will be logged out on other devices.
      </AuthHeading>

      <form onSubmit={submit} className="u-stack" style={{ gap: 'var(--sp-4)' }} noValidate>
        <FormError>{errors.form}</FormError>

        {errors.token && (
          <Callout icon="alert" tone="warn">
            {errors.token}{' '}
            <Link to="/forgot-password" style={{ textDecoration: 'underline' }}>
              Request a new link
            </Link>
            .
          </Callout>
        )}

        <div>
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number"
            autoComplete="new-password"
          />
          <StrengthMeter password={password} />
        </div>

        <PasswordField
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirm}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" size="lg" block loading={busy} icon="lock">
          Save new password
        </Button>
      </form>

      <p className="u-small u-muted" style={{ textAlign: 'center' }}>
        <Link to="/login" className="auth__link">
          Back to log in
        </Link>
      </p>
    </>
  )
}
