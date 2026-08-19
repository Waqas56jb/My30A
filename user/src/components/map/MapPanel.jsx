import { useEffect, useMemo, useState } from 'react'
import Icon from '../ui/Icon'
import { Badge } from '../ui/StatusBadge'
import { cx, formatDistance } from '../../utils/format'
import {
  coordsOf,
  googleDirectionsUrl,
  googleEmbedUrl,
  googlePlaceUrl,
  haversineMiles,
  isNearby,
} from '../../utils/geo'
import { useLiveLocation } from '../../hooks/useLiveLocation'

const KIND_ICON = {
  restaurant: 'utensils',
  beach: 'umbrella',
  partner: 'sparkles',
  event: 'ticket',
  property: 'home',
}

/**
 * Live Google Map for a place's GPS coordinates.
 *
 * Uses the public Google Maps embed (no frontend API key). Device GPS is
 * watched so guests on 30A see live distance; far-away developer locations
 * do not reroute the map away from the venue.
 */
export default function MapPanel({
  entities = [],
  property,
  activeId,
  onSelect,
  className,
  style,
  showLegend = true,
}) {
  const { coords: userCoords, status: gpsStatus } = useLiveLocation()
  const [focusId, setFocusId] = useState(activeId)

  useEffect(() => {
    if (activeId) setFocusId(activeId)
  }, [activeId])

  const points = useMemo(() => {
    const all = [
      ...(coordsOf(property)
        ? [{ id: property.id, name: property.name, kind: 'property', coordinates: coordsOf(property) }]
        : []),
      ...entities
        .map((entity) => ({
          ...entity,
          kind: entity.kind ?? entity.type,
          coordinates: coordsOf(entity),
        }))
        .filter((entity) => entity.coordinates || entity.name),
    ]
    return all
  }, [entities, property])

  const focus =
    points.find((point) => point.id === focusId) ??
    points.find((point) => point.kind !== 'property') ??
    points[0] ??
    property

  const milesFromYou = haversineMiles(userCoords, focus)
  const guestIsNearby = isNearby(userCoords, focus)
  const embedSrc = googleEmbedUrl(focus)
  const placeUrl = googlePlaceUrl(focus)
  const directionsUrl = googleDirectionsUrl(focus)

  return (
    <div
      className={cx('mappanel', className)}
      style={style}
      role="region"
      aria-label={focus?.name ? `Google Map of ${focus.name}` : 'Google Map'}
    >
      {embedSrc ? (
        <iframe
          className="mappanel__frame"
          title={focus?.name ? `Google Map of ${focus.name}` : 'Google Map'}
          src={embedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow="geolocation; fullscreen; accelerometer; gyroscope"
        />
      ) : (
        <div className="mappanel__empty">Map location is not available yet.</div>
      )}

      <span className="mappanel__note">
        {gpsStatus === 'live' && guestIsNearby
          ? `Live GPS · ${formatDistance(milesFromYou)}`
          : 'Google Maps · venue GPS'}
      </span>

      {points.length > 0 && (showLegend || onSelect || points.length > 1) && (
        <div className="mappanel__pins" role="list">
          {points.map((point) => (
            <button
              key={point.id ?? point.name}
              type="button"
              className={cx(
                'mappin',
                point.kind === 'property' && 'mappin--home',
                (focusId ?? activeId) === point.id && 'mappin--active',
              )}
              onClick={() => {
                setFocusId(point.id)
                onSelect?.(point)
              }}
              aria-label={`${point.name}${point.kind === 'property' ? ' — your property' : ''}`}
            >
              <span className="mappin__dot" aria-hidden="true">
                <Icon name={KIND_ICON[point.kind] ?? 'mapPin'} />
              </span>
              {((focusId ?? activeId) === point.id || point.kind === 'property' || points.length <= 3) && (
                <span className="mappin__label">{point.name}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mappanel__actions">
        <a className="mappanel__link" href={placeUrl} target="_blank" rel="noopener noreferrer">
          Open in Google Maps
        </a>
        <a className="mappanel__link" href={directionsUrl} target="_blank" rel="noopener noreferrer">
          Directions
        </a>
      </div>

      {showLegend && (
        <div className="mappanel__legend">
          {property ? (
            <Badge tone="glass">
              <span className="badge__dot" style={{ background: 'var(--coral)' }} />
              Your stay
            </Badge>
          ) : null}
          <Badge tone="glass">
            <span className="badge__dot" style={{ background: 'var(--surface-ink)' }} />
            {entities.length} nearby
          </Badge>
        </div>
      )}
    </div>
  )
}
