import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { Field, Input, Checkbox } from '../../components/ui/Form'
import { AuthHeading, FormError, PasswordField } from '../../components/auth/AuthBits'
import { useApp } from '../../context/AppContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

/**
 * Log in.
 *
 * Where the guest was heading is carried in `state.from` by RequireAuth, so
 * someone who deep-linked to /groceries lands back on /groceries afterwards
 * rather than on a generic home screen.
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logIn, isAuthed, pushToast } = useApp()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useDocumentTitle('Log in')

  const from = location.state?.from ?? '/discover'
  if (isAuthed) return <Navigate to={from} replace />

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      const account = await logIn({ email, password, remember })
      pushToast({
        tone: 'success',
        title: `Welcome back, ${account.firstName}`,
        message: account.guestSlug ? 'Your stay is ready.' : 'Enter your access code to add a stay.',
      })
      navigate(from, { replace: true })
    } catch (error) {
      setErrors(error.field ? { [error.field]: error.message } : { form: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AuthHeading eyebrow="Guest account" title="Log in">
        Your saved places, preferences and trips live on your account — so this stay picks up where
        the last one left off.
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
              enterKeyHint="next"
            />
          )}
        </Field>

        <PasswordField
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="auth__row">
          <Checkbox checked={remember} onChange={setRemember}>
            Keep me logged in
          </Checkbox>
          <Link to="/forgot-password" className="auth__link">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" block loading={busy} iconRight="arrowRight">
          Log in
        </Button>
      </form>

      <p className="u-small u-muted" style={{ textAlign: 'center' }}>
        New to My30A?{' '}
        <Link to="/signup" className="auth__link">
          Create an account
        </Link>
      </p>
    </>
  )
}
