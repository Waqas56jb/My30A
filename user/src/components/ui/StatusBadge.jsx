import { cx } from '../../utils/format'
import {
  GROCERY_STATUSES,
  TRANSFER_STATUSES,
  PAYMENT_STATES,
  getStatusMeta,
} from '../../data/statusConfig'

/** Generic pill. */
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

/**
 * Status pill for grocery/transfer orders. Reads its label and tone from the
 * shared status vocabulary so the whole app stays consistent.
 */
export default function StatusBadge({ kind = 'grocery', status, short = false, className }) {
  const list = kind === 'transfer' ? TRANSFER_STATUSES : GROCERY_STATUSES
  const meta = getStatusMeta(list, status)
  const live = ['shopping', 'on_the_way', 'scheduled'].includes(status)
  return (
    <Badge tone={meta.tone} dot pulse={live} className={className}>
      {short ? meta.short : meta.label}
    </Badge>
  )
}

/** Separate pill for the payment lifecycle (authorisation ≠ payment). */
export function PaymentBadge({ state, className }) {
  const meta = PAYMENT_STATES[state] ?? { label: state, tone: 'neutral' }
  if (!state || state === 'not_required') return null
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}
