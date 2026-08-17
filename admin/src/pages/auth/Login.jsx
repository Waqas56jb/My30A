import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Form'
import { useAdmin } from '../../context/AdminContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ROLE_LIST, DEMO_ADMIN_ACCOUNTS } from '../../data/adminUsers'
import { hero, PHOTO } from '../../assets/images'
import { cx } from '../../utils/format'

/**
 * Admin sign-in.
 *
 * The role picker is a demo affordance: it lets one account walk through every
 * permission set without five sets of credentials. A real system takes the
 * role from the account, never from the login form.
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logIn, isAuthed, pushToast } = useAdmin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
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
      const user = await logIn({ email, password, role })
      pushToast({ tone: 'success', title: `Welcome back, ${user.name.split(' ')[0]}` })
      navigate(from, { replace: true })
    } catch (error) {
      setErrors(error.field ? { [error.field]: error.message } : { form: error.message })
    } finally {
      setBusy(false)
    }
  }

  const useDemo = (account) => {
    setEmail(account.email)
    setPassword(account.password)
    setRole(account.role)
    setErrors({})
  }

  return (
    <div className="alogin">
      <div className="alogin__aside">
        <img src={hero(PHOTO.beachAerial)} alt="" />
        <p className="u-eyebrow" style={{ color: 'var(--sand-300)' }}>My30A</p>
        <h2 style={{ color: '#fff', fontSize: '1.9rem', maxWidth: '17ch', lineHeight: 1.12, marginTop: 6 }}>
          The whole ecosystem, from one screen.
        </h2>
        <p className="u-small" style={{ color: 'rgba(255,255,255,.78)', marginTop: 10, maxWidth: '46ch' }}>
          Guests, hosts, partners, properties, services, payments and Vitoria — the operations
          centre for everything happening on 30A today.
        </p>
      </div>

      <div className="alogin__panel">
        <div>
          <p className="u-eyebrow">Admin &amp; Operations</p>
          <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>Sign in</h1>
          <p className="u-small u-muted" style={{ marginTop: 8, maxWidth: '44ch' }}>
            This panel is for the My30A team. Access is per role — you will only see the sections
            your role covers.
          </p>
        </div>

        <form onSubmit={submit} className="u-stack" style={{ gap: 'var(--sp-4)' }} noValidate>
          {errors.form && (
            <p className="refnote refnote--compact" role="alert" style={{ color: '#8c3c28' }}>
              <Icon name="alert" size={14} />
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
                style={{ fontSize: 'max(16px, var(--fs-body))' }}
              />
            )}
          </Field>

          <Field label="Password" error={errors.password}>
            {(props) => (
              <span style={{ position: 'relative', display: 'block' }}>
                <Input
                  {...props}
                  className="input alogin__password"
                  type={shown ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: 46, fontSize: 'max(16px, var(--fs-body))' }}
                />
                <button
                  type="button"
                  onClick={() => setShown((s) => !s)}
                  aria-label={shown ? 'Hide password' : 'Show password'}
                  aria-pressed={shown}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                    width: 36, height: 36, display: 'grid', placeItems: 'center',
                    border: 0, background: 'transparent', color: 'var(--ink-400)', cursor: 'pointer',
                  }}
                >
                  <Icon name={shown ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </span>
            )}
          </Field>

          <div>
            <span className="field__label" style={{ display: 'block', marginBottom: 6 }}>
              Sign in as
            </span>
            <div className="rolepick">
              {ROLE_LIST.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={cx('rolepick__btn', role === r.id && 'is-active')}
                  aria-pressed={role === r.id}
                  onClick={() => setRole(role === r.id ? '' : r.id)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="u-xs u-muted" style={{ marginTop: 6 }}>
              Optional. Leave it unset to use the role on the account.
            </p>
          </div>

          <div className="u-row" style={{ justifyContent: 'space-between' }}>
            <Link to="/admin/forgot-password" className="u-small" style={{ color: 'var(--sea-700)' }}>
              Forgot password?
            </Link>
          </div>

          <Button type="submit" size="lg" block loading={busy} iconRight="arrowRight">
            Sign in
          </Button>
        </form>

        <div className="divider">Demo accounts</div>

        <div className="u-stack" style={{ gap: 'var(--sp-2)' }}>
          {DEMO_ADMIN_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className="rolepick__btn alogin__demo"
              onClick={() => useDemo(account)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}
            >
              <Icon name="shield" size={16} />
              <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                <span style={{ display: 'block' }}>{account.name}</span>
                <span className="u-xs u-muted" style={{ display: 'block', fontWeight: 400 }}>
                  {account.email} · {account.role.replace(/_/g, ' ')}
                </span>
              </span>
              <Icon name="arrowRight" size={16} style={{ color: 'var(--ink-400)' }} />
            </button>
          ))}
        </div>

        <p className="u-xs u-muted" style={{ textAlign: 'center' }}>
          Tapping an account fills the form — press Sign in to continue. Password for all of them is{' '}
          <code>admin1234</code>.
        </p>
      </div>
    </div>
  )
}
