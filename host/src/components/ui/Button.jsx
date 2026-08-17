import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import { cx } from '../../utils/format'

/**
 * One button primitive with variant wrappers, so every call site gets the
 * same 46px touch target, focus ring, press state, and loading behaviour.
 * Renders as <a>, <Link>, or <button> depending on the props supplied.
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    block = false,
    to,
    href,
    className,
    type = 'button',
    disabled,
    ...rest
  },
  ref,
) {
  const classes = cx(
    'btn',
    variant !== 'primary' && `btn--${variant}`,
    size !== 'md' && `btn--${size}`,
    block && 'btn--block',
    loading && 'btn--loading',
    className,
  )

  const content = (
    <>
      {icon && <Icon name={icon} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
      {loading && (
        <span className="btn__spinner">
          <span className="spinner" />
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} aria-disabled={disabled || undefined} {...rest}>
        {content}
      </Link>
    )
  }

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={classes}
        target={rest.target ?? '_blank'}
        rel={rest.rel ?? 'noopener noreferrer'}
        {...rest}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  )
})

export default Button

export const PrimaryButton = (props) => <Button {...props} variant="primary" />
export const SecondaryButton = (props) => <Button {...props} variant="secondary" />
export const GhostButton = (props) => <Button {...props} variant="ghost" />
export const DangerButton = (props) => <Button {...props} variant="danger" />

/**
 * Icon-only control. `label` is required — it becomes the accessible name.
 */
export function IconButton({
  icon,
  label,
  to,
  href,
  onClick,
  variant,
  badge,
  className,
  ...rest
}) {
  const classes = cx('icon-btn', variant && `icon-btn--${variant}`, className)
  const inner = (
    <>
      <Icon name={icon} />
      {badge > 0 && (
        <span className="icon-btn__badge" aria-hidden="true">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={label} title={label} {...rest}>
        {inner}
      </Link>
    )
  }
  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={label}
        title={label}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {inner}
      </a>
    )
  }
  return (
    <button type="button" className={classes} aria-label={label} title={label} onClick={onClick} {...rest}>
      {inner}
    </button>
  )
}
