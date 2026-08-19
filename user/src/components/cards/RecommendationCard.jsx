import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import Icon from '../ui/Icon'
import { Badge } from '../ui/StatusBadge'
import { formatDistance } from '../../utils/format'

const routeFor = (kind, id) => {
  switch (kind) {
    case 'restaurant':
      return `/restaurants/${id}`
    case 'beach':
      return `/beaches/${id}`
    case 'event':
      return `/events/${id}`
    default:
      return `/partners/${id}`
  }
}

/**
 * A personalised pick from Vitoria. The `reason` line is the whole point —
 * it is what makes the recommendation feel like memory rather than a listing.
 */
export default function RecommendationCard({ recommendation }) {
  if (!recommendation) return null
  const id = recommendation.refId ?? recommendation.id
  const name = recommendation.name ?? recommendation.title
  if (!id || !name) return null
  const kind = recommendation.kind ?? recommendation.type ?? 'partner'

  return (
    <Link
      to={routeFor(kind, id)}
      className="card"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      aria-label={`${name}${recommendation.tag ? ` — ${recommendation.tag}` : ''}`}
    >
      <div style={{ position: 'relative' }}>
        <SmartImage photoId={recommendation.image} alt={name} ratio="3x2" width={620} zoom />
        {recommendation.tag ? (
          <div className="place-card__badges">
            <Badge tone="glass">
              <Icon name="sparkles" style={{ width: 12, height: 12 }} />
              {recommendation.tag}
            </Badge>
          </div>
        ) : null}
      </div>
      <div className="place-card__body">
        <h3 className="place-card__title u-clamp-2">{name}</h3>
        {recommendation.reason ? (
          <p className="place-card__desc u-clamp-3" style={{ fontStyle: 'italic' }}>
            “{recommendation.reason}”
          </p>
        ) : recommendation.shortDescription ? (
          <p className="place-card__desc u-clamp-3">{recommendation.shortDescription}</p>
        ) : null}
        <div className="place-card__foot">
          <span className="u-xs u-muted">
            {recommendation.distance !== undefined
              ? formatDistance(recommendation.distance)
              : recommendation.location ?? recommendation.category}
          </span>
          <Icon name="arrowRight" style={{ width: 16, height: 16, color: 'var(--sea-700)' }} />
        </div>
      </div>
    </Link>
  )
}
