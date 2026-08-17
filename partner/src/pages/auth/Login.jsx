import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { Field, Input, Checkbox } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import { StatusPill } from '../../components/PartnerUI'
import { usePartner } from '../../context/PartnerContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { DEMO_ACCOUNTS } from '../../data/partners'
import { PHOTO } from '../../assets/images'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthed } = usePartner()
  useDocumentTitle('Sign in')

  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showAccounts, setShowAccounts] = useState(false)

  const redirectTo = location.state?.from ?? '/partner/dashboard'

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

  if (isAuthed) return <Navigate to={redirectTo} replace />

  return (
    <AuthShell image={PHOTO.golfCartOcean} quote="Be the business guests are told about before they arrive.">
      <div>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Sign in</h1>
        <p className="u-small u-muted" style={{ marginTop: 6 }}>
          Manage your listing and see the interest My30A sends your way.
        </p>
      </div>

      <form onSubmit={submit} className="pstack" style={{ gap: 'var(--sp-4)' }} noValidate>
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
              placeholder="you@yourbusiness.com"
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
            Remember me
          </Checkbox>
          <Link to="/partner/forgot-password" className="u-small" style={{ color: 'var(--sea-700)' }}>
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" block loading={busy}>
          Sign in
        </Button>
      </form>

      <div className="divider">Don&apos;t have a partner account?</div>

      <Button to="/partner/register" variant="secondary" block icon="plus">
        Become a Partner
      </Button>

      <Callout icon="info">
        Prototype build — no real authentication. Any password works.{' '}
        <button
          type="button"
          onClick={() => setShowAccounts((v) => !v)}
          style={{ color: 'var(--sea-700)', textDecoration: 'underline', fontWeight: 600 }}
        >
          {showAccounts ? 'Hide demo accounts' : 'Show demo accounts'}
        </button>
      </Callout>

      {showAccounts && (
        <div className="pstack" style={{ gap: 'var(--sp-2)' }}>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.id}
              type="button"
              className="setting-row"
              style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-md)' }}
              onClick={() => setForm((f) => ({ ...f, email: account.email, password: 'demo1234' }))}
            >
              <span className="setting-row__icon" aria-hidden="true">
                <Icon name="building" />
              </span>
              <span className="setting-row__text">
                <span className="setting-row__title">{account.businessName}</span>
                <span className="setting-row__sub">{account.email}</span>
              </span>
              <StatusPill status={account.status} />
            </button>
          ))}
          <p className="u-xs u-muted">
            Each demo business is in a different state, so you can see approved, pending, rejected and
            suspended listings.
          </p>
        </div>
      )}
    </AuthShell>
  )
}
