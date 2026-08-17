import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import Button from '../../components/ui/Button'
import { Field, Input, Checkbox } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import Icon from '../../components/ui/Icon'
import { useAuth } from '../../context/AuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { DEMO_CREDENTIALS } from '../../data/host'
import { PHOTO } from '../../assets/images'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthed } = useAuth()
  useDocumentTitle('Sign in')

  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const redirectTo = location.state?.from ?? '/host/dashboard'

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      await login(form)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrors({ [error.field ?? 'form']: error.message })
    } finally {
      setBusy(false)
    }
  }

  const useDemo = () => setForm((f) => ({ ...f, ...DEMO_CREDENTIALS }))

  // Already signed in — do not show the form again.
  if (isAuthed) return <Navigate to={redirectTo} replace />

  return (
    <AuthShell
      image={PHOTO.houseWhite}
      quote="Everything your guests need, answered before they have to ask."
    >
      <div>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Sign in</h1>
        <p className="u-small u-muted" style={{ marginTop: 6 }}>
          Manage your property information and see how guests are using it.
        </p>
      </div>

      <form onSubmit={submit} className="hstack" style={{ gap: 'var(--sp-4)' }} noValidate>
        {errors.form && (
          <Callout icon="alert" tone="danger">
            {errors.form}
          </Callout>
        )}

        <Field label="Email" required error={errors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={form.email}
              autoComplete="email"
              placeholder="you@example.com"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}
        </Field>

        <Field label="Password" required error={errors.password}>
          {(props) => (
            <div style={{ position: 'relative' }}>
              <Input
                {...props}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                autoComplete="current-password"
                style={{ paddingRight: 52 }}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 2, top: 2 }}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          )}
        </Field>

        <div className="u-between u-wrap">
          <Checkbox
            checked={form.remember}
            onChange={(value) => setForm((f) => ({ ...f, remember: value }))}
          >
            Keep me signed in
          </Checkbox>
          <Link to="/host/forgot-password" className="u-small" style={{ color: 'var(--sea-700)' }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" block loading={busy}>
          Sign in
        </Button>
      </form>

      <div className="divider">New to My30A?</div>

      <Button to="/host/signup" variant="secondary" block>
        Create a host account
      </Button>

      <Callout icon="info">
        Prototype build — no real authentication. Use{' '}
        <button
          type="button"
          onClick={useDemo}
          style={{ color: 'var(--sea-700)', textDecoration: 'underline', fontWeight: 600 }}
        >
          the demo account
        </button>{' '}
        ({DEMO_CREDENTIALS.email}) with any password.
      </Callout>
    </AuthShell>
  )
}
