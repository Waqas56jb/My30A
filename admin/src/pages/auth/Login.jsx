import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Form'
import { useAdmin } from '../../context/AdminContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { hero, PHOTO } from '../../assets/images'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logIn, isAuthed, pushToast } = useAdmin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useDocumentTitle('Sign in')

  const from = location.state?.from ?? '/admin/dashboard'
  if (isAuthed) return <Navigate to={from} replace />

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})
    setBusy(true)
    try {
      const user = await logIn({ email, password })
      pushToast({ tone: 'success', title: `Welcome back, ${user.name.split(' ')[0]}` })
      navigate(from, { replace: true })
    } catch (error) {
      setErrors(error.field ? { [error.field]: error.message } : { form: error.message })
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
        <img src={hero(PHOTO.beachAerial)} alt="" />
        <span className="alogin__mark" aria-hidden="true">
          <Icon name="waves" />
        </span>
        <p className="alogin__kicker">My30A Host</p>
        <h2>Operations for Scenic Highway 30A</h2>
        <p>
          Guests, hosts, partners, properties, and Vitoria — in one place for the team that runs
          the coast.
        </p>
      </aside>

      <div className="alogin__panel">
        <div className="alogin__copy">
          <p className="alogin__kicker alogin__kicker--ink">Admin</p>
          <h1>Sign in</h1>
          <p>Use your My30A work account.</p>
        </div>

        <form onSubmit={submit} className="alogin__form" noValidate>
          {errors.form && (
            <p className="alogin__error" role="alert">
              <Icon name="alert" size={16} />
              {errors.form}
            </p>
          )}

          <Field label="Work email" error={errors.email}>
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
              />
            )}
          </Field>

          <Field label="Password" error={errors.password}>
            {(props) => (
              <span className="alogin__secret">
                <Input
                  {...props}
                  className="input alogin__password"
                  type={shown ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="alogin__toggle"
                  onClick={() => setShown((s) => !s)}
                  aria-label={shown ? 'Hide password' : 'Show password'}
                  aria-pressed={shown}
                >
                  <Icon name={shown ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </span>
            )}
          </Field>

          <div className="alogin__row">
            <Link to="/admin/forgot-password">Forgot password?</Link>
          </div>

          <Button type="submit" size="lg" block loading={busy} iconRight="arrowRight">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
