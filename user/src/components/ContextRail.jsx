import { Link } from 'react-router-dom'
import Icon from './ui/Icon'
import StatusBadge from './ui/StatusBadge'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/mockApi'
import { EMPTY_CONDITIONS } from '../services/liveApi'
import { formatShortDate, formatDateRange } from '../utils/format'

/**
 * Contextual right rail for wide desktops (≥1360px): today's conditions, the
 * stay at a glance, and anything currently in flight. Never shown on mobile —
 * the same information appears inline there.
 */
export default function ContextRail({ activeOrders = [] }) {
  const { guest, property } = useApp()
  const conditions = useAsync(() => api.getWeather(), [])
  const { weather, water, beachFlag, sunset, sunrise, tide } = conditions.data ?? EMPTY_CONDITIONS

  return (
    <aside className="rail" aria-label="Trip context">
      <div className="rail-card">
        <span className="rail-card__title">Today on 30A</span>
        <div className="weather">
          <span className="weather__icon" aria-hidden="true">
            <Icon name="sun" />
          </span>
          <div>
            <div className="weather__temp">{weather.tempF}°</div>
            <div className="u-xs u-muted">
              {weather.condition} · H {weather.high}° / L {weather.low}°
            </div>
          </div>
        </div>
        <div className="flag-row">
          <span className="flag-swatch" style={{ background: beachFlag.color }} aria-hidden="true" />
          <div>
            <div className="u-small" style={{ fontWeight: 600 }}>
              {beachFlag.label}
            </div>
            <div className="u-xs u-muted">{beachFlag.meaning}</div>
          </div>
        </div>
        <div className="u-xs u-muted">
          Water {water.tempF}° · {water.surf}
          <br />
          Sunrise {sunrise} · Sunset {sunset}
          <br />
          {tide}
        </div>
      </div>

      <div className="rail-card">
        <span className="rail-card__title">Your stay</span>
        <div className="u-small" style={{ fontWeight: 600 }}>
          {property?.name}
        </div>
        <div className="u-xs u-muted">
          {guest?.stay && formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)} ·{' '}
          {guest?.stay?.nights} nights
        </div>
        <Link to="/my-stay" className="btn btn--secondary btn--sm">
          <Icon name="key" />
          Door code & WiFi
        </Link>
      </div>

      <div className="rail-card">
        <span className="rail-card__title">In progress</span>
        {activeOrders.length === 0 ? (
          <p className="u-xs u-muted">
            Nothing in flight right now. Ask Vitoria to stock the kitchen or arrange a ride.
          </p>
        ) : (
          activeOrders.slice(0, 3).map((order) => (
            <Link
              key={order.id}
              to={order.link}
              className="u-between"
              style={{ padding: '8px 0', borderBottom: '1px solid var(--line-soft)' }}
            >
              <span style={{ minWidth: 0 }}>
                <span className="u-small" style={{ fontWeight: 600, display: 'block' }}>
                  {order.title}
                </span>
                <span className="u-xs u-muted">
                  {order.id} · {order.date ? formatShortDate(order.date) : '—'}
                </span>
              </span>
              <StatusBadge kind={order.kind} status={order.status} short />
            </Link>
          ))
        )}
        <Link to="/services" className="section__link" style={{ padding: 0 }}>
          All services →
        </Link>
      </div>

      <div className="rail-card" style={{ background: 'var(--surface-ink)', borderColor: 'transparent' }}>
        <span className="rail-card__title" style={{ color: 'rgba(246,241,232,.6)' }}>
          Vitoria
        </span>
        <p className="u-small" style={{ color: 'var(--on-dark-soft)' }}>
          “Sunset is at {sunset} tonight. Want me to hold a rooftop table before it fills up?”
        </p>
        <Link to="/vitoria" className="btn btn--sand btn--sm">
          <Icon name="sparkles" />
          Ask Vitoria
        </Link>
      </div>
    </aside>
  )
}
