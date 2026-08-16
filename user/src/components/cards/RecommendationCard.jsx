import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import Icon from '../ui/Icon'
import { Badge } from '../ui/StatusBadge'
import { resolveEntity } from '../../services/mockApi'
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
  const entity = resolveEntity(recommendation.refId)
  if (!entity) return null
  const name = entity.name ?? entity.title

  return (
    <Link
      to={routeFor(recommendation.kind, recommendation.refId)}
      className="card"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      aria-label={`${name} — ${recommendation.tag}`}
    >
      <div style={{ position: 'relative' }}>
        <SmartImage photoId={entity.image} alt={name} ratio="3x2" width={620} zoom />
        <div className="place-card__badges">
          <Badge tone="glass">
            <Icon name="sparkles" style={{ width: 12, height: 12 }} />
            {recommendation.tag}
          </Badge>
        </div>
      </div>
      <div className="place-card__body">
        <h3 className="place-card__title u-clamp-2">{name}</h3>
        <p className="place-card__desc u-clamp-3" style={{ fontStyle: 'italic' }}>
          “{recommendation.reason}”
        </p>
        <div className="place-card__foot">
          <span className="u-xs u-muted">
            {entity.distance !== undefined ? formatDistance(entity.distance) : entity.location}
          </span>
          <Icon name="arrowRight" style={{ width: 16, height: 16, color: 'var(--sea-700)' }} />
        </div>
      </div>
    </Link>
  )
}
