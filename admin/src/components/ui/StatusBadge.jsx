import { cx } from '../../utils/format'

/**
 * Generic status pill. Host-specific meanings (property status, guest access
 * status) map onto these tones in `HostUI.jsx` so the vocabulary lives with
 * the data rather than in the component.
 */
export function Badge({ tone = 'neutral', children, dot = false, pulse = false, className }) {
  return (
    <span
      className={cx('badge', tone !== 'neutral' && `badge--${tone}`, pulse && 'badge--pulse', className)}
    >
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  )
}

export default Badge
