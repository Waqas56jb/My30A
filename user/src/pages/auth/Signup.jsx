import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Field, Input, Checkbox } from '../../components/ui/Form'
import { AuthHeading, FormError, PasswordField, StrengthMeter } from '../../components/auth/AuthBits'
import { useApp } from '../../context/AppContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

const PERKS = [
  'Saved places and preferences that carry between stays',
  'Vitoria remembers what you liked last time',
  'Grocery and transfer requests tracked in one place',
]

/**
 * Create an account.
 *
 * Signing up does not require a booking — plenty of people find 30A before
 * they find a house. The account is created empty and the access code adds a
 * stay to it later.
 */
export default function Signup() {
  const navigate = useNavigate()
  const { signUp, isAuthed, pushToast } = useApp()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useDocumentTitle('Create your account')

  if (isAuthed) return <Navigate to="/discover" replace />

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})

    if (!accepted) {
      setErrors({ terms: 'Please accept the terms to create an account.' })
      return
    }

    setBusy(true)
    try {
      const account = await signUp(form)
      pushToast({
        tone: 'success',
        title: `Welcome to My30A, ${account.firstName}`,
        message: 'Add your access code whenever your host sends it.',
      })
      navigate('/discover', { replace: true })
    } catch (error) {
      setErrors(error.field ? { [error.field]: error.message } : { form: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AuthHeading eyebrow="Guest account" title="Create your account">
        It takes a minute, and you do not need a booking yet.
      </AuthHeading>

      <ul className="auth__perks">
        {PERKS.map((perk) => (
          <li key={perk}>
            <Icon name="check" size={15} />
            {perk}
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="u-stack" style={{ gap: 'var(--sp-4)' }} noValidate>
        <FormError>{errors.form}</FormError>

        <div className="auth__pair">
          <Field label="First name" error={errors.firstName}>
            {(props) => (
              <Input
                {...props}
                value={form.firstName}
                onChange={(e) => set('firstName')(e.target.value)}
                placeholder="Sarah"
                autoComplete="given-name"
                enterKeyHint="next"
              />
            )}
          </Field>
          <Field label="Last name" error={errors.lastName}>
            {(props) => (
              <Input
                {...props}
                value={form.lastName}
                onChange={(e) => set('lastName')(e.target.value)}
                placeholder="Whitmore"
                autoComplete="family-name"
                enterKeyHint="next"
              />
            )}
          </Field>
        </div>

        <Field label="Email" error={errors.email}>
          {(props) => (
            <Input
              {...props}
              className="input auth__email"
              type="email"
              value={form.email}
              onChange={(e) => set('email')(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              enterKeyHint="next"
            />
          )}
        </Field>

        <Field label="Mobile" hint="Optional — used only for delivery and driver updates">
          {(props) => (
            <Input
              {...props}
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone')(e.target.value)}
              placeholder="(404) 555-0188"
              autoComplete="tel"
              enterKeyHint="next"
            />
          )}
        </Field>

        <div>
          <PasswordField
            label="Password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="At least 8 characters, with a letter and a number"
            autoComplete="new-password"
          />
          <StrengthMeter password={form.password} />
        </div>

        <div>
          <Checkbox checked={accepted} onChange={setAccepted}>
            I agree to the terms and the privacy policy.
          </Checkbox>
          {errors.terms && (
            <span className="field__error" role="alert" style={{ marginTop: 6 }}>
              <Icon name="alert" style={{ width: 13, height: 13 }} />
              {errors.terms}
            </span>
          )}
        </div>

        <Button type="submit" size="lg" block loading={busy} iconRight="arrowRight">
          Create account
        </Button>
      </form>

      <p className="u-small u-muted" style={{ textAlign: 'center' }}>
        Already have one?{' '}
        <Link to="/login" className="auth__link">
          Log in
        </Link>
      </p>
    </>
  )
}
