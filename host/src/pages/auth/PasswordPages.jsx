import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthShell from './AuthShell'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { Field, Input } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import { SuccessState } from '../../components/ui/States'
import { useAuth } from '../../context/AuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as authService from '../../services/authService'
import { PHOTO } from '../../assets/images'

/* ------------------------------ Forgot ---------------------------------- */

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Reset your password')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await authService.requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image={PHOTO.beachGrass}
      back={{ to: '/host/login', label: 'Back to sign in' }}
      quote="One property, one link, every question answered."
    >
      {sent ? (
        <>
          <SuccessState
            title="Check your email"
            message={`If an account exists for ${email}, a reset link is on its way. It expires in 30 minutes.`}
          />
          <Callout icon="info">
            Prototype build — no email is actually sent. Continue to the reset screen to see it.
          </Callout>
          <Button to="/host/reset-password?token=demo" block>
            Continue to reset
          </Button>
          <Button to="/host/login" variant="ghost" block>
            Back to sign in
          </Button>
        </>
      ) : (
        <>
          <div>
            <h1 style={{ fontSize: 'var(--fs-h1)' }}>Reset your password</h1>
            <p className="u-small u-muted" style={{ marginTop: 6 }}>
              Enter the email on your host account and we will send you a link.
            </p>
          </div>

          <form onSubmit={submit} className="hstack" style={{ gap: 'var(--sp-4)' }} noValidate>
            <Field label="Email" required error={error}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
            <Button type="submit" size="lg" block loading={busy}>
              Send reset link
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}

/* ------------------------------- Reset ---------------------------------- */

export function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token')
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [show, setShow] = useState(false)
  useDocumentTitle('Choose a new password')

  const submit = async (event) => {
    event.preventDefault()
    const next = {}
    const problem = authService.validatePassword(form.password)
    if (problem) next.password = problem
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await authService.resetPassword({ token, password: form.password })
      setDone(true)
    } catch (err) {
      setErrors({ [err.field ?? 'form']: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      image={PHOTO.interiorBedroom}
      back={{ to: '/host/login', label: 'Back to sign in' }}
      quote="Your property, set up once and always up to date."
    >
      {done ? (
        <>
          <SuccessState title="Password updated" message="You can sign in with your new password now." />
          <Button size="lg" block onClick={() => navigate('/host/login')}>
            Go to sign in
          </Button>
        </>
      ) : (
        <>
          <div>
            <h1 style={{ fontSize: 'var(--fs-h1)' }}>Choose a new password</h1>
            <p className="u-small u-muted" style={{ marginTop: 6 }}>
              Make it something you have not used elsewhere.
            </p>
          </div>

          {!token && (
            <Callout icon="alert" tone="danger">
              This reset link is missing its token.{' '}
              <Link to="/host/forgot-password" style={{ textDecoration: 'underline' }}>
                Request a new one
              </Link>
              .
            </Callout>
          )}

          <form onSubmit={submit} className="hstack" style={{ gap: 'var(--sp-4)' }} noValidate>
            {errors.form && (
              <Callout icon="alert" tone="danger">
                {errors.form}
              </Callout>
            )}

            <Field
              label="New password"
              required
              error={errors.password}
              hint="At least 8 characters, with a letter and a number."
            >
              {(props) => (
                <div style={{ position: 'relative' }}>
                  <Input
                    {...props}
                    type={show ? 'text' : 'password'}
                    value={form.password}
                    autoComplete="new-password"
                    style={{ paddingRight: 52 }}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => setShow((v) => !v)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: 2, top: 2 }}
                  >
                    <Icon name={show ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
              )}
            </Field>

            <Field label="Confirm new password" required error={errors.confirm}>
              {(props) => (
                <Input
                  {...props}
                  type="password"
                  value={form.confirm}
                  autoComplete="new-password"
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                />
              )}
            </Field>

            <Button type="submit" size="lg" block loading={busy} disabled={!token}>
              Update password
            </Button>
          </form>
        </>
      )}
    </AuthShell>
  )
}

/* --------------------------- Verify email -------------------------------- */

export function VerifyEmail() {
  const navigate = useNavigate()
  const { host } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)
  useDocumentTitle('Verify your email')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await authService.verifyEmail(code)
      navigate('/host/onboarding', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell image={PHOTO.duneWalkover} quote="Almost there. Then we set your property up.">
      <div>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Verify your email</h1>
        <p className="u-small u-muted" style={{ marginTop: 6 }}>
          We sent a 6-digit code to <strong>{host?.email ?? 'your inbox'}</strong>.
        </p>
      </div>

      <form onSubmit={submit} className="hstack" style={{ gap: 'var(--sp-4)' }} noValidate>
        <Field label="Verification code" required error={error}>
          {(props) => (
            <Input
              {...props}
              value={code}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={7}
              style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.2rem' }}
              onChange={(e) => setCode(e.target.value)}
            />
          )}
        </Field>

        <Button type="submit" size="lg" block loading={busy}>
          Verify and continue
        </Button>
      </form>

      <div className="u-row" style={{ justifyContent: 'center', gap: 6 }}>
        <span className="u-small u-muted">Did not get it?</span>
        <button
          type="button"
          className="u-small"
          style={{ color: 'var(--sea-700)', fontWeight: 600 }}
          onClick={() => setResent(true)}
        >
          Resend code
        </button>
      </div>
      {resent && (
        <Callout icon="checkCircle" tone="ok">
          A new code is on its way.
        </Callout>
      )}

      <Callout icon="info">
        Prototype build — any 6 digits will verify. Try <strong>123456</strong>.
      </Callout>

      <Button to="/host/dashboard" variant="ghost" block>
        Skip for now
      </Button>
    </AuthShell>
  )
}
