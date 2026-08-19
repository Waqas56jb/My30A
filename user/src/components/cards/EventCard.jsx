import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import { MetaRow } from '../ui/Display'
import { Badge } from '../ui/StatusBadge'
import { formatDate, toDate, cx } from '../../utils/format'
import { eventCover } from '../../utils/listingImages'

/** Event card — date block on the left, image above on the stacked variant. */
export default function EventCard({ event, layout = 'row', className }) {
  const date = toDate(event.date)
  const month = date?.toLocaleDateString('en-US', { month: 'short' })
  const day = date?.getDate()

  if (layout === 'stack') {
    return (
      <Link to={`/events/${event.id}`} className={cx('card place-card', className)} aria-label={event.title}>
        <div className="place-card__media">
          <SmartImage photoId={eventCover(event)} alt={event.title} ratio="3x2" width={640} zoom />
          <div className="place-card__badges">
            <Badge tone="glass">{formatDate(event.date, { weekday: 'short', month: 'short', day: 'numeric' })}</Badge>
            {event.price === 'Free' && <Badge tone="ok">Free</Badge>}
          </div>
        </div>
        <div className="place-card__body">
          <h3 className="place-card__title u-clamp-2">{event.title}</h3>
          <MetaRow items={[{ icon: 'clock', text: event.time }, { icon: 'mapPin', text: event.location }]} />
          <p className="place-card__desc u-clamp-2">{event.shortDescription}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to={`/events/${event.id}`}
      className={cx('card', className)}
      style={{ display: 'flex', gap: 'var(--sp-3)', padding: 'var(--sp-3)', alignItems: 'center' }}
      aria-label={event.title}
    >
      <span className="event-date" aria-hidden="true">
        <span className="event-date__m">{month}</span>
        <span className="event-date__d">{day}</span>
      </span>
      <span className="u-grow" style={{ minWidth: 0 }}>
        <span className="place-card__title u-clamp-2" style={{ display: 'block', fontSize: '1rem' }}>
          {event.title}
        </span>
        <MetaRow items={[event.time, event.location]} />
      </span>
      <SmartImage
        photoId={eventCover(event)}
        alt=""
        ratio="1x1"
        width={200}
        style={{ width: 64, borderRadius: 'var(--r-sm)', flex: 'none' }}
      />
    </Link>
  )
}
