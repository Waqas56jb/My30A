import { Link } from 'react-router-dom'
import Icon from './ui/Icon'
import { Badge } from './ui/StatusBadge'
import { cx, formatNumber } from '../utils/format'
import { PARTNER_STATUSES } from '../data/partners'
import { TRACKED, NOT_TRACKED } from '../data/analytics'

/** Section wrapper used across the portal. */
export function Panel({ title, subtitle, action, children, flush = false, className, id }) {
  return (
    <section className={cx('panel', className)} id={id}>
      {(title || action) && (
        <header className="panel__head">
          <div style={{ minWidth: 0 }}>
            {title && <h2 className="panel__title">{title}</h2>}
            {subtitle && <p className="panel__sub">{subtitle}</p>}
          </div>
          {action && <div className="panel__action">{action}</div>}
        </header>
      )}
      <div className={cx('panel__body', flush && 'panel__body--flush')}>{children}</div>
    </section>
  )
}

/** Headline engagement number. `delta` is a percentage change. */
export function Stat({ icon, label, value, delta, hint, spark }) {
  const direction = delta === undefined || delta === null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'

  return (
    <div className="stat">
      <span className="stat__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{typeof value === 'number' ? formatNumber(value) : (value ?? '—')}</span>

      {direction && (
        <span className={cx('stat__delta', `stat__delta--${direction}`)}>
          <Icon name={direction === 'down' ? 'chevronDown' : direction === 'up' ? 'chevronUp' : 'minus'} />
          {direction === 'flat' ? 'No change' : `${delta > 0 ? '+' : ''}${delta}% vs previous`}
        </span>
      )}
      {!direction && hint && <span className="u-xs u-muted">{hint}</span>}
      {spark && <div className="stat__spark">{spark}</div>}
    </div>
  )
}

export function StatusPill({ status, className }) {
  const meta = PARTNER_STATUSES[status] ?? PARTNER_STATUSES.pending
  return (
    <Badge tone={meta.tone} dot pulse={status === 'approved'} className={className}>
      {meta.label}
    </Badge>
  )
}

/**
 * The status banner. Each state says what is happening and, where the partner
 * can do something about it, offers the action rather than just the bad news.
 */
export function StatusBanner({ partner, action }) {
  const meta = PARTNER_STATUSES[partner?.status] ?? PARTNER_STATUSES.pending
  const reason =
    partner?.status === 'rejected'
      ? partner.rejectionReason
      : partner?.status === 'suspended'
        ? partner.suspensionReason
        : null

  return (
    <div className={cx('status-banner', `status-banner--${partner?.status ?? 'pending'}`)}>
      <span className="status-banner__icon" aria-hidden="true">
        <Icon name={meta.icon} />
      </span>
      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
        <h2 className="status-banner__title">{meta.title}</h2>
        <p className="status-banner__body">{meta.body}</p>
        {reason && (
          <p className="status-banner__body" style={{ marginTop: 8, fontStyle: 'italic' }}>
            “{reason}”
          </p>
        )}
        {action && <div style={{ marginTop: 'var(--sp-4)' }}>{action}</div>}
      </div>
    </div>
  )
}

/**
 * The honesty card. This is the platform's business model stated plainly: we
 * measure interest we can see, and we do not pretend to know what happens
 * once a guest leaves for the partner's own site or picks up the phone.
 */
export function TrackingCard({ compact = false }) {
  return (
    <Panel
      title="What we can and cannot see"
      subtitle="So the numbers below mean exactly what they say"
    >
      <div className="track-cols">
        <div>
          <p className="u-eyebrow" style={{ marginBottom: 'var(--sp-3)' }}>
            We track
          </p>
          <ul className="track-list track-list--yes">
            {TRACKED.map((item) => (
              <li key={item}>
                <Icon name="checkCircle" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="u-eyebrow" style={{ marginBottom: 'var(--sp-3)', color: 'var(--ink-400)' }}>
            We do not track
          </p>
          <ul className="track-list track-list--no">
            {NOT_TRACKED.map((item) => (
              <li key={item}>
                <Icon name="minus" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!compact && (
        <p
          className="u-small"
          style={{
            marginTop: 'var(--sp-5)',
            padding: 'var(--sp-4)',
            borderRadius: 'var(--r-sm)',
            background: 'var(--sea-50)',
            color: 'var(--sea-900)',
            lineHeight: 1.65,
          }}
        >
          Guests connect directly with your business — by phone, on your website, or by turning up.
          My30A does not sit in the middle of that, take a cut, or process your bookings. What we can
          show you is how much interest your listing generates.
        </p>
      )}
    </Panel>
  )
}

/** The partner journey, with the current step highlighted. */
export function Journey({ status }) {
  const order = ['created', 'submitted', 'review', 'live', 'discovered', 'connect']
  const reached = {
    pending: 2,
    approved: 6,
    rejected: 2,
    suspended: 3,
  }[status] ?? 1

  const steps = [
    { key: 'created', icon: 'edit', label: 'You create your business profile' },
    { key: 'submitted', icon: 'send', label: 'You submit it for approval' },
    { key: 'review', icon: 'eye', label: 'Our local team reviews it' },
    { key: 'live', icon: 'checkCircle', label: 'Your listing goes live on My30A' },
    { key: 'discovered', icon: 'compass', label: 'Guests exploring 30A discover you' },
    { key: 'connect', icon: 'phone', label: 'They call, visit your site, or drive over' },
  ]

  return (
    <div className="journey">
      {steps.map((step, i) => {
        const index = order.indexOf(step.key) + 1
        const done = index < reached
        const now = index === reached
        return (
          <div
            key={step.key}
            className={cx('journey__step', done && 'journey__step--done', now && 'journey__step--now')}
          >
            <span className="journey__dot" aria-hidden="true">
              {done ? <Icon name="check" strokeWidth={3} /> : <Icon name="circle" />}
            </span>
            <span style={{ minWidth: 0 }}>{step.label}</span>
            {now && (
              <span className="u-xs" style={{ marginLeft: 'auto', flex: 'none', fontWeight: 700 }}>
                You are here
              </span>
            )}
            <span className="sr-only">
              {done ? 'complete' : now ? 'current step' : 'not yet'}
              {i === steps.length - 1 ? '.' : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Small quick-action tile used on the dashboard. */
export function QuickAction({ icon, label, to, onClick }) {
  const inner = (
    <>
      <span className="stat__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="u-small" style={{ fontWeight: 600, color: 'var(--ink-900)' }}>
        {label}
      </span>
    </>
  )
  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-3)',
    padding: 'var(--sp-3)',
    borderRadius: 'var(--r-md)',
    border: '1px solid var(--line-soft)',
    background: 'var(--surface)',
    width: '100%',
    textAlign: 'left',
    minHeight: 62,
  }

  return to ? (
    <Link to={to} style={style}>
      {inner}
    </Link>
  ) : (
    <button type="button" style={style} onClick={onClick}>
      {inner}
    </button>
  )
}
