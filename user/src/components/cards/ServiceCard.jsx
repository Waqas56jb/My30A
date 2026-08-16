import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import Icon from '../ui/Icon'
import StatusBadge, { Badge } from '../ui/StatusBadge'
import { formatCurrency, formatShortDate } from '../../utils/format'

/**
 * Concierge service tile. `fulfilment` distinguishes what My30A delivers
 * itself from what a partner delivers — the guest should always know who
 * they are actually transacting with.
 */
export default function ServiceCard({ service }) {
  return (
    <Link to={service.to} className="card place-card" aria-label={service.name}>
      <div className="place-card__media">
        <SmartImage photoId={service.image} alt={service.name} ratio="3x2" width={640} zoom />
        <div className="place-card__badges">
          <Badge tone={service.fulfilment === 'my30a' ? 'dark' : 'glass'}>
            {service.fulfilment === 'my30a' ? 'Concierge service' : 'Local partner'}
          </Badge>
        </div>
      </div>
      <div className="place-card__body">
        <h3 className="place-card__title">{service.name}</h3>
        <p className="place-card__desc u-clamp-2">{service.blurb}</p>
        <div className="place-card__foot">
          <span className="u-xs u-muted">{service.priceNote}</span>
          <Icon name="arrowRight" style={{ width: 16, height: 16, color: 'var(--sea-700)' }} />
        </div>
      </div>
    </Link>
  )
}

/** Row in "My Services" — one shape for groceries, transfers, and partners. */
export function OrderCard({ order }) {
  const icon = order.kind === 'grocery' ? 'bag' : order.kind === 'transfer' ? 'car' : 'sparkles'
  const isPartner = order.kind === 'partner'

  return (
    <Link to={order.link} className="card order-card" aria-label={`${order.title} ${order.id}`}>
      <span className="order-card__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="u-grow" style={{ minWidth: 0 }}>
        <span className="order-card__title">{order.title}</span>
        <span className="order-card__meta">
          {order.id} · {order.date ? formatShortDate(order.date) : 'Date to confirm'}
          {order.kind === 'grocery' && order.store ? ` · ${order.store}` : ''}
          {order.kind === 'transfer' && order.airport ? ` · ${order.airport}` : ''}
        </span>
        {isPartner && <span className="order-card__meta">{order.note}</span>}
      </span>
      <span className="order-card__right">
        {isPartner ? (
          <Badge tone="sand">{order.statusLabel}</Badge>
        ) : (
          <StatusBadge kind={order.kind} status={order.status} short />
        )}
        {order.amount ? (
          <span className="u-xs u-muted">{formatCurrency(order.amount)}</span>
        ) : null}
      </span>
    </Link>
  )
}
