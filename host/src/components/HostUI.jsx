import { Link } from 'react-router-dom'
import Icon from './ui/Icon'
import { Badge } from './ui/StatusBadge'
import { cx, formatRelative } from '../utils/format'
import { PROPERTY_STATUSES } from '../data/properties'
import { ACCESS_STATUSES, ACTIVITY_ICONS } from '../data/guests'

/** Headline metric tile. `delta` is a percentage change, positive or negative. */
export function Kpi({ icon, label, value, suffix = '', delta, hint }) {
  const direction = delta === undefined || delta === null ? null : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'

  return (
    <div className="kpi">
      <div className="kpi__head">
        {icon && (
          <span className="kpi__icon" aria-hidden="true">
            <Icon name={icon} />
          </span>
        )}
        <span className="kpi__label">{label}</span>
      </div>
      <span className="kpi__value">
        {value ?? '—'}
        {value !== null && value !== undefined && suffix ? suffix : ''}
      </span>
      {direction && (
        <span className={cx('kpi__delta', `kpi__delta--${direction}`)}>
          <Icon name={direction === 'down' ? 'chevronDown' : direction === 'up' ? 'chevronUp' : 'minus'} />
          {direction === 'flat' ? 'No change' : `${Math.abs(delta)}% vs previous`}
        </span>
      )}
      {!direction && hint && <span className="u-xs u-muted">{hint}</span>}
    </div>
  )
}

export function PropertyStatusBadge({ status, className }) {
  const meta = PROPERTY_STATUSES[status] ?? PROPERTY_STATUSES.draft
  return (
    <Badge tone={meta.tone} dot pulse={status === 'published'} className={className}>
      {meta.label}
    </Badge>
  )
}

export function AccessBadge({ status, className }) {
  const meta = ACCESS_STATUSES[status] ?? ACCESS_STATUSES.expired
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}

/**
 * The setup checklist. Each incomplete row links straight to the page that
 * fixes it — a checklist you cannot act on is just a guilt trip.
 */
export function SetupChecklist({ progress, propertyId, limit }) {
  const items = limit ? progress.items.slice(0, limit) : progress.items

  return (
    <div>
      <div className="u-between">
        <span className="u-small" style={{ fontWeight: 600 }}>
          {progress.done} of {progress.total} complete
        </span>
        <span className="u-small" style={{ fontWeight: 700, color: 'var(--sea-700)' }}>
          {progress.percent}%
        </span>
      </div>

      <div
        className="setup__bar"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Property setup completion"
      >
        <span className="setup__fill" style={{ width: `${progress.percent}%` }} />
      </div>

      <div>
        {items.map((item) => (
          <Link
            key={item.key}
            to={`/host/properties/${propertyId}/${item.route}`}
            className={cx('setup__item', item.done && 'setup__item--done')}
          >
            <span className="setup__tick" aria-hidden="true">
              <Icon name="check" strokeWidth={3} />
            </span>
            <span className="setup__text">{item.label}</span>
            {!item.done && (
              <span className="u-xs" style={{ color: 'var(--sea-700)', fontWeight: 600, flex: 'none' }}>
                Add
              </span>
            )}
            <span className="sr-only">{item.done ? 'complete' : 'not complete'}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** Shared activity feed row. */
export function ActivityList({ items = [], emptyLabel = 'Nothing yet.' }) {
  if (items.length === 0) {
    return (
      <p className="u-small u-muted" style={{ padding: 'var(--sp-5)' }}>
        {emptyLabel}
      </p>
    )
  }

  return (
    <div>
      {items.map((item) => (
        <div className="activity-row" key={item.id}>
          <span className="activity-row__icon" aria-hidden="true">
            <Icon name={ACTIVITY_ICONS[item.type] ?? 'circle'} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div className="activity-row__title">{item.label}</div>
            <div className="activity-row__time">{formatRelative(item.at)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Dashboard quick-action tile. */
export function QuickAction({ icon, label, to, onClick }) {
  const inner = (
    <>
      <span className="qa-tile__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="qa-tile__label">{label}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className="qa-tile">
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" className="qa-tile" onClick={onClick}>
      {inner}
    </button>
  )
}

/** Section wrapper used across host pages. */
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
