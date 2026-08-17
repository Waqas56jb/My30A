import Icon from './Icon'
import Button from './Button'
import { cx } from '../../utils/format'

/** Empty state — never leave a screen blank. */
export function EmptyState({
  icon = 'compass',
  title,
  message,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  secondaryTo,
  plain = false,
  className,
}) {
  return (
    <div className={cx('state', plain && 'state--plain', className)}>
      <span className="state__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <h3 className="state__title">{title}</h3>
      {message && <p className="state__msg">{message}</p>}
      {(actionLabel || secondaryLabel) && (
        <div className="u-row u-wrap" style={{ justifyContent: 'center', marginTop: 4 }}>
          {actionLabel && (
            <Button size="sm" to={actionTo} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && (
            <Button size="sm" variant="secondary" to={secondaryTo}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

/** Error state with a retry affordance. */
export function ErrorState({ error, onRetry, title = 'Something went wrong', className }) {
  return (
    <div className={cx('state', className)} role="alert">
      <span className="state__icon" aria-hidden="true" style={{ color: 'var(--danger)' }}>
        <Icon name="alert" />
      </span>
      <h3 className="state__title">{title}</h3>
      <p className="state__msg">
        {error?.message ?? 'We could not load this right now. Please try again in a moment.'}
      </p>
      {onRetry && (
        <Button size="sm" variant="secondary" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

/** Success confirmation panel used after form submissions. */
export function SuccessState({ title, message, children, className }) {
  return (
    <div className={cx('state', className)} style={{ background: 'var(--ok-bg)', borderColor: 'rgba(47,122,91,.24)' }}>
      <span className="state__icon" aria-hidden="true" style={{ color: 'var(--ok)' }}>
        <Icon name="checkCircle" />
      </span>
      <h3 className="state__title">{title}</h3>
      {message && <p className="state__msg">{message}</p>}
      {children}
    </div>
  )
}
