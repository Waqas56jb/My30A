import { useState } from 'react'
import Icon from '../ui/Icon'
import { Field, Input } from '../ui/Form'
import { passwordStrength } from '../../services/authService'
import { cx } from '../../utils/format'

/**
 * Password field with a reveal toggle.
 *
 * Letting people see what they typed cuts failed sign-ins more than any error
 * message does, especially on a phone keyboard at the beach.
 */
export function PasswordField({
  label = 'Password',
  value,
  onChange,
  error,
  hint,
  autoComplete = 'current-password',
  placeholder = '••••••••',
  name,
}) {
  const [shown, setShown] = useState(false)

  return (
    <Field label={label} error={error} hint={hint}>
      {(props) => (
        <span className="pw">
          <Input
            {...props}
            name={name}
            className="input pw__input"
            type={shown ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            spellCheck="false"
          />
          <button
            type="button"
            className="pw__toggle"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'Hide password' : 'Show password'}
            aria-pressed={shown}
            tabIndex={-1}
          >
            <Icon name={shown ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </span>
      )}
    </Field>
  )
}

/** Three-step strength bar. Guidance, never a blocker. */
export function StrengthMeter({ password }) {
  const { score, label } = passwordStrength(password)
  if (!password) return null

  return (
    <div className="pw-meter" aria-live="polite">
      <span className="pw-meter__track" aria-hidden="true">
        {[1, 2, 3].map((step) => (
          <span key={step} className={cx('pw-meter__seg', step <= score && `is-${score}`)} />
        ))}
      </span>
      <span className="pw-meter__label">{label}</span>
    </div>
  )
}

/** Heading block shared by all four auth screens. */
export function AuthHeading({ eyebrow, title, children }) {
  return (
    <div>
      {eyebrow && <p className="u-eyebrow">{eyebrow}</p>}
      <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: eyebrow ? 6 : 0 }}>{title}</h1>
      {children && (
        <p className="u-small u-muted" style={{ marginTop: 8, maxWidth: '46ch' }}>
          {children}
        </p>
      )}
    </div>
  )
}

/** Server-side / form-wide failure, as opposed to a per-field one. */
export function FormError({ children }) {
  if (!children) return null
  return (
    <p className="form-error" role="alert">
      <Icon name="alert" size={16} />
      <span>{children}</span>
    </p>
  )
}
