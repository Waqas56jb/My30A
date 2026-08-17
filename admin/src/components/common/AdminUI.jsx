import { Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { Badge } from '../ui/StatusBadge'
import { cx, formatNumber, formatCurrency } from '../../utils/format'

/* ------------------------------ Page header ------------------------------ */

export function PageHeader({ title, subtitle, back, actions, children }) {
  return (
    <header className="apage__head">
      <div style={{ minWidth: 0 }}>
        {back && (
          <Link to={back.to} className="apage__back">
            <Icon name="arrowLeft" size={16} />
            {back.label}
          </Link>
        )}
        <h1 className="apage__title">{title}</h1>
        {subtitle && <p className="apage__sub">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="apage__actions">{actions}</div>}
    </header>
  )
}

/* -------------------------------- Panels --------------------------------- */

export function Panel({ title, subtitle, actions, children, className, flush = false, id }) {
  return (
    <section className={cx('panel', className)} id={id}>
      {(title || actions) && (
        <div className="panel__head">
          <div style={{ minWidth: 0 }}>
            {title && <h2 className="panel__title">{title}</h2>}
            {subtitle && <p className="panel__sub">{subtitle}</p>}
          </div>
          {actions && <div className="panel__actions">{actions}</div>}
        </div>
      )}
      <div className={cx('panel__body', flush && 'panel__body--flush')}>{children}</div>
    </section>
  )
}

export const Grid = ({ cols = 2, children, className }) => (
  <div className={cx('agrid', `agrid--${cols}`, className)}>{children}</div>
)

/* ------------------------------- Stat cards ------------------------------ */

/**
 * A number with its meaning attached. `change` is a fraction, not a
 * percentage — the component formats it so no call site has to remember.
 */
export function Stat({ label, value, change, hint, icon, tone = 'sea', to, prefix = '', suffix = '' }) {
  const body = (
    <>
      <span className={cx('stat__icon', `stat__icon--${tone}`)} aria-hidden="true">
        <Icon name={icon} size={18} />
      </span>
      <span className="stat__label">{label}</span>
      <span className="stat__value">
        {prefix}
        {typeof value === 'number' ? formatNumber(value) : value}
        {suffix}
      </span>
      {typeof change === 'number' && (
        <span className={cx('stat__change', change >= 0 ? 'is-up' : 'is-down')}>
          <Icon name={change >= 0 ? 'chevronUp' : 'chevronDown'} size={13} />
          {Math.abs(change * 100).toFixed(1)}%
          <span className="stat__change-note">vs previous period</span>
        </span>
      )}
      {hint && <span className="stat__hint">{hint}</span>}
    </>
  )

  return to ? (
    <Link to={to} className="stat stat--link">{body}</Link>
  ) : (
    <div className="stat">{body}</div>
  )
}

/* ------------------------------ Status pills ----------------------------- */

/**
 * Renders a status from any of the status maps in `data/`. Keeping the map
 * with the data means a new status shows up correctly everywhere at once.
 */
export function StatusPill({ map, value, dot = true }) {
  const entry = map?.[value]
  if (!entry) return <Badge>{String(value ?? '—').replace(/_/g, ' ')}</Badge>
  return <Badge tone={entry.tone} dot={dot}>{entry.label}</Badge>
}

/* ------------------------------ Key / value ------------------------------ */

export function Facts({ items, columns = 2 }) {
  return (
    <dl className={cx('facts', `facts--${columns}`)}>
      {items.filter(Boolean).map((item) => (
        <div key={item.label} className="facts__row">
          <dt className="facts__key">{item.label}</dt>
          <dd className="facts__value">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

/* -------------------------------- Money ---------------------------------- */

export const Money = ({ amount, className }) => (
  <span className={cx('money', className)}>{formatCurrency(amount)}</span>
)

/* ------------------------------- Workflow -------------------------------- */

/**
 * The step rail on an order or a transfer. Reads the flow array from the data
 * layer so adding a step to the workflow updates every screen that shows it.
 */
export function StepRail({ flow, statuses, current, cancelled = false, cancelledLabel = 'Cancelled' }) {
  if (cancelled) {
    return (
      <div className="steprail steprail--stopped">
        <Icon name="x" size={16} />
        <span>{cancelledLabel} — the workflow stopped here.</span>
      </div>
    )
  }

  const index = flow.indexOf(current)

  return (
    <ol className="steprail">
      {flow.map((key, i) => (
        <li
          key={key}
          className={cx(
            'steprail__step',
            i < index && 'is-done',
            i === index && 'is-current',
          )}
        >
          <span className="steprail__dot" aria-hidden="true">
            {i < index ? <Icon name="check" size={12} /> : i + 1}
          </span>
          <span className="steprail__label">{statuses[key].label}</span>
        </li>
      ))}
    </ol>
  )
}

/* ------------------------------- Disclosure ------------------------------ */

/**
 * The partner honesty note.
 *
 * Every screen that shows partner numbers carries this, because a column
 * labelled "clicks" sitting next to a business name invites the reader to
 * assume it means sales. It does not, and saying so once at the top of the
 * page is cheaper than explaining it in a meeting later.
 */
export function ReferralNote({ compact = false }) {
  if (compact) {
    return (
      <p className="refnote refnote--compact">
        <Icon name="info" size={14} />
        Referral activity only — purchases made outside My30A are not tracked.
      </p>
    )
  }
  return (
    <div className="refnote">
      <span className="refnote__icon" aria-hidden="true"><Icon name="info" size={16} /></span>
      <div>
        <strong>Referral activity only.</strong> These are interactions that happened on My30A
        screens: the listing was seen, and the guest tapped through to a website, a phone number
        or directions. What happened next is between the guest and the business — My30A does not
        take the booking, does not take the payment, and has no way to know whether anything was
        bought.
      </div>
    </div>
  )
}

/** The same idea for the mock payment records. */
export function MockPaymentNote() {
  return (
    <p className="refnote refnote--compact">
      <Icon name="lock" size={14} />
      Mock payment records. No processor is connected and no card details exist — “•••• 4242” is a
      label, not a stored number.
    </p>
  )
}

/* -------------------------------- Empty ---------------------------------- */

export function InlineEmpty({ icon = 'search', title, body, action }) {
  return (
    <div className="inline-empty">
      <span className="inline-empty__icon" aria-hidden="true"><Icon name={icon} /></span>
      <p className="inline-empty__title">{title}</p>
      {body && <p className="inline-empty__body">{body}</p>}
      {action}
    </div>
  )
}

/* ------------------------------- Activity -------------------------------- */

export function ActivityList({ items, empty = 'Nothing yet.' }) {
  if (!items.length) return <InlineEmpty icon="clock" title={empty} />
  return (
    <ul className="activity">
      {items.map((item, i) => (
        <li className="activity__row" key={item.id ?? `${item.title}-${i}`}>
          <span className="activity__icon" aria-hidden="true">
            <Icon name={item.icon ?? 'circle'} size={15} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span className="activity__title">{item.title}</span>
            {item.body && <span className="activity__body">{item.body}</span>}
          </span>
          {item.meta && <span className="activity__meta">{item.meta}</span>}
        </li>
      ))}
    </ul>
  )
}
