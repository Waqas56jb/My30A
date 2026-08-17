import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from './AuthShell'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import { Field, Input, Checkbox } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import { useAuth } from '../../context/AuthContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { validateEmail, validatePassword } from '../../services/authService'
import { PHOTO } from '../../assets/images'

const BENEFITS = [
  'Your guests get WiFi, door codes and check-out steps without texting you',
  'Vitoria answers the routine questions, day or night',
  'You see what guests asked and what they could not find',
]

export default function Signup() {
  const navigate = useNavigate()
  const { signUp, isAuthed } = useAuth()
  useDocumentTitle('Create your account')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    terms: false,
  })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const validate = () => {
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'Enter your first name.'
    if (!form.lastName.trim()) next.lastName = 'Enter your last name.'
    if (!validateEmail(form.email)) next.email = 'Enter a valid email address.'
    if (!form.phone.trim()) next.phone = 'We need a number in case a guest has an emergency.'
    const passwordProblem = validatePassword(form.password)
    if (passwordProblem) next.password = passwordProblem
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match.'
    if (!form.terms) next.terms = 'Please accept the terms to continue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      await signUp(form)
      navigate('/host/verify-email', { replace: true })
    } catch (error) {
      setErrors({ form: error.message })
    } finally {
      setBusy(false)
    }
  }

  if (isAuthed) return <Navigate to="/host/dashboard" replace />

  return (
    <AuthShell
      image={PHOTO.interiorLiving}
      quote="Set the property up once. Every guest after that arrives knowing everything."
    >
      <div>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Create your host account</h1>
        <p className="u-small u-muted" style={{ marginTop: 6 }}>
          Free for hosts. No card, no subscription — you only need an account so your property
          details stay private.
        </p>
      </div>

      <ul className="hstack" style={{ gap: 8 }}>
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="u-row" style={{ alignItems: 'flex-start', gap: 10 }}>
            <Icon name="check" size={16} style={{ color: 'var(--sea-500)', flex: 'none', marginTop: 3 }} />
            <span className="u-small u-muted">{benefit}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="hstack" style={{ gap: 'var(--sp-4)' }} noValidate>
        {errors.form && (
          <Callout icon="alert" tone="danger">
            {errors.form}
          </Callout>
        )}

        <div className="field-row field-row--2">
          <Field label="First name" required error={errors.firstName}>
            {(props) => (
              <Input
                {...props}
                value={form.firstName}
                autoComplete="given-name"
                onChange={(e) => set({ firstName: e.target.value })}
              />
            )}
          </Field>
          <Field label="Last name" required error={errors.lastName}>
            {(props) => (
              <Input
                {...props}
                value={form.lastName}
                autoComplete="family-name"
                onChange={(e) => set({ lastName: e.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label="Email" required error={errors.email}>
          {(props) => (
            <Input
              {...props}
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(e) => set({ email: e.target.value })}
            />
          )}
        </Field>

        <Field label="Phone" required error={errors.phone} hint="Shown to guests only if you choose to.">
          {(props) => (
            <Input
              {...props}
              type="tel"
              value={form.phone}
              autoComplete="tel"
              placeholder="(850) 555-0100"
              onChange={(e) => set({ phone: e.target.value })}
            />
          )}
        </Field>

        <Field
          label="Password"
          required
          error={errors.password}
          hint="At least 8 characters, with a letter and a number."
        >
          {(props) => (
            <div style={{ position: 'relative' }}>
              <Input
                {...props}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                autoComplete="new-password"
                style={{ paddingRight: 52 }}
                onChange={(e) => set({ password: e.target.value })}
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

        <Field label="Confirm password" required error={errors.confirm}>
          {(props) => (
            <Input
              {...props}
              type="password"
              value={form.confirm}
              autoComplete="new-password"
              onChange={(e) => set({ confirm: e.target.value })}
            />
          )}
        </Field>

        <div>
          <Checkbox checked={form.terms} onChange={(value) => set({ terms: value })}>
            I agree to the My30A host terms and understand that property information I enter is shown
            to guests who have my access link.
          </Checkbox>
          {errors.terms && (
            <span className="field__error" role="alert" style={{ paddingLeft: 12 }}>
              <Icon name="alert" size={13} />
              {errors.terms}
            </span>
          )}
        </div>

        <Button type="submit" size="lg" block loading={busy}>
          Create account
        </Button>
      </form>

      <p className="u-small u-muted" style={{ textAlign: 'center' }}>
        Already have an account?{' '}
        <Link to="/host/login" style={{ color: 'var(--sea-700)', fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
