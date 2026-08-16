import { useMemo } from 'react'
import Icon from '../ui/Icon'
import { Badge } from '../ui/StatusBadge'
import { cx } from '../../utils/format'

const KIND_ICON = {
  restaurant: 'utensils',
  beach: 'umbrella',
  partner: 'sparkles',
  event: 'ticket',
  property: 'home',
}

/**
 * Illustrative map.
 *
 * A real tile provider needs an API key, so this renders a stylised coastal
 * plan and projects each entity's real lat/lng into the panel. The component
 * API (entities, active pin, onSelect) is the same one a Mapbox/Google layer
 * would use, so swapping the canvas later is contained to this file.
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
  const points = useMemo(() => {
    const all = [
      ...(property?.coordinates
        ? [{ id: property.id, name: property.name, kind: 'property', coordinates: property.coordinates }]
        : []),
      ...entities.filter((e) => e.coordinates),
    ]
    if (all.length === 0) return []

    const lngs = all.map((e) => e.coordinates.lng)
    const lats = all.map((e) => e.coordinates.lat)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const spanLng = Math.max(maxLng - minLng, 0.004)
    const spanLat = Math.max(maxLat - minLat, 0.004)

    return all.map((entity) => {
      const x = 8 + ((entity.coordinates.lng - minLng) / spanLng) * 84
      // Latitude increases northward; the Gulf sits at the bottom of the panel.
      const y = 20 + (1 - (entity.coordinates.lat - minLat) / spanLat) * 42
      return { ...entity, x: clamp(x), y: clamp(y, 12, 74) }
    })
  }, [entities, property])

  return (
    <div className={cx('mappanel', className)} style={style} role="img" aria-label="Map of nearby places along 30A">
      <div className="mappanel__canvas" aria-hidden="true">
        <div className="mappanel__road" />
        <div className="mappanel__sand" />
        <div className="mappanel__water" />
        <span className="mappanel__label">Scenic Highway 30A</span>
      </div>

      <span className="mappanel__note">Illustrative map · no API key required</span>

      {points.map((point) => (
        <button
          key={point.id}
          type="button"
          className={cx(
            'mappin',
            point.kind === 'property' && 'mappin--home',
            activeId === point.id && 'mappin--active',
          )}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
          onClick={() => onSelect?.(point)}
          aria-label={`${point.name}${point.kind === 'property' ? ' — your property' : ''}`}
        >
          <span className="mappin__dot" aria-hidden="true">
            <Icon name={KIND_ICON[point.kind] ?? 'mapPin'} />
          </span>
          {(activeId === point.id || point.kind === 'property') && (
            <span className="mappin__label">{point.name}</span>
          )}
        </button>
      ))}

      {showLegend && (
        <div className="mappanel__legend">
          <Badge tone="glass">
            <span className="badge__dot" style={{ background: 'var(--coral)' }} />
            Your stay
          </Badge>
          <Badge tone="glass">
            <span className="badge__dot" style={{ background: 'var(--surface-ink)' }} />
            {entities.length} nearby
          </Badge>
        </div>
      )}
    </div>
  )
}

const clamp = (value, min = 6, max = 94) => Math.min(max, Math.max(min, value))
