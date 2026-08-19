import { useId, useState } from 'react'
import Icon from './Icon'
import { cx } from '../../utils/format'

/** Label + control + hint/error wrapper. Wires aria-describedby for you. */
export function Field({ label, hint, error, required, children, id: idProp, className }) {
  const auto = useId()
  const id = idProp ?? auto
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={cx('field', className)}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {required && (
            <span aria-hidden="true" style={{ color: 'var(--coral)' }}>
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {typeof children === 'function'
        ? children({ id, 'aria-describedby': cx(hintId, errorId) || undefined, 'aria-invalid': !!error })
        : children}
      {hint && !error && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          <Icon name="alert" style={{ width: 13, height: 13 }} />
          {error}
        </span>
      )}
    </div>
  )
}

export const Input = ({ className, ...props }) => (
  <input className={cx('input', className)} {...props} />
)

export const Textarea = ({ className, ...props }) => (
  <textarea className={cx('textarea', className)} {...props} />
)

export const Select = ({ className, children, ...props }) => (
  <select className={cx('select', className)} {...props}>
    {children}
  </select>
)

/** Search input with a clear button. */
export function SearchBar({ value, onChange, onSubmit, placeholder = 'Search', label = 'Search', className }) {
  return (
    <form
      className={cx('search', className)}
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.(value)
        e.currentTarget.querySelector('input')?.blur()
      }}
    >
      <Icon name="search" className="search__icon" />
      <input
        type="search"
        className="search__input"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        enterKeyHint="search"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className="search__clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <Icon name="x" style={{ width: 16, height: 16 }} />
        </button>
      )}
    </form>
  )
}

/** Horizontal, scrollable filter chips. */
export function FilterChips({ options, value, onChange, label = 'Filter', wrap = false, className }) {
  return (
    <div
      className={cx('chips', wrap && 'chips--wrap', className)}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const key = typeof option === 'string' ? option : option.value
        const text = typeof option === 'string' ? option : option.label
        const count = typeof option === 'string' ? null : option.count
        const active = value === key
        const reset = typeof options[0] === 'string' ? options[0] : options[0]?.value
        return (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={active}
            onClick={() => onChange(active && key !== reset ? reset : key)}
          >
            {text}
            {count !== null && count !== undefined && <span className="chip__count">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Segmented control (list / map, etc). */
export function Segmented({ options, value, onChange, label = 'View', className }) {
  return (
    <div className={cx('segmented', className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.icon && <Icon name={option.icon} />}
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Option tiles used as a radio group. */
export function OptionGrid({ options, value, onChange, label, columns, className }) {
  return (
    <div
      className={cx('optiongrid', className)}
      role="radiogroup"
      aria-label={label}
      style={columns ? { gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))` } : undefined}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          aria-pressed={value === option.value}
          className="option"
          onClick={() => onChange(option.value)}
        >
          <span className="option__title">{option.label}</span>
          {option.sub && <span className="option__sub">{option.sub}</span>}
        </button>
      ))}
    </div>
  )
}

/** Numeric stepper with a 44px touch target on each control. */
export function Stepper({ value, onChange, min = 0, max = 20, label }) {
  return (
    <div className="stepper">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        <Icon name="minus" style={{ width: 16, height: 16 }} />
      </button>
      <span className="stepper__value" aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
      >
        <Icon name="plus" style={{ width: 16, height: 16 }} />
      </button>
    </div>
  )
}

export function Checkbox({ checked, onChange, children, name }) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="checkbox__text">{children}</span>
    </label>
  )
}

export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="switch"
      onClick={() => onChange(!checked)}
    />
  )
}

/** Star input for post-service ratings. */
export function RatingInput({ value, onChange, size = 'lg', labels }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div>
      <div
        className={cx('stars', 'stars--input', size === 'lg' && 'stars--lg')}
        role="radiogroup"
        aria-label="Rating"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            data-on={star <= active}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(star)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.8l6.5-.9z" />
            </svg>
          </button>
        ))}
      </div>
      {labels && <p className="rating-panel__label">{active ? labels[active - 1] : ' '}</p>}
    </div>
  )
}
