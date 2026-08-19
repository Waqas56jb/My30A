import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { FilterChips } from '../ui/Form'

const MIN_ZOOM = 1
const MAX_ZOOM = 4
const ZOOM_STEP = 0.35

/**
 * Zoomable illustrated coastline maps. Pins sit in a list because the
 * source images are artwork, not a georeferenced tile layer.
 */
export default function AreaMap({
  areaLabel,
  maps = [],
  mapHint,
  zoomInLabel,
  zoomOutLabel,
  resetLabel,
  accessTitle,
  accessSubtitle,
  accessAllLabel,
  accessPublicLabel,
  accessPrivateLabel,
  accessPublicShort,
  accessPrivateShort,
  accessLimitedLabel,
  accessLimitedShort,
  accessPoints = [],
  locationsTitle,
  locations = [],
}) {
  const [activeId, setActiveId] = useState(maps[0]?.id)
  const [accessFilter, setAccessFilter] = useState('all')
  const [scale, setScale] = useState(1)
  const [origin, setOrigin] = useState({ x: 0, y: 0 })
  const frameRef = useRef(null)
  const dragRef = useRef(null)
  const pinchRef = useRef(null)

  const activeMap = maps.find((map) => map.id === activeId) ?? maps[0]

  const clampOrigin = useCallback((next, nextScale) => {
    const frame = frameRef.current
    if (!frame) return next
    const { clientWidth: w, clientHeight: h } = frame
    const extraX = Math.max(0, (w * nextScale - w) / 2)
    const extraY = Math.max(0, (h * nextScale - h) / 2)
    return {
      x: Math.min(extraX, Math.max(-extraX, next.x)),
      y: Math.min(extraY, Math.max(-extraY, next.y)),
    }
  }, [])

  const applyZoom = useCallback(
    (nextScale) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale))
      setScale(clamped)
      setOrigin((prev) => (clamped <= 1 ? { x: 0, y: 0 } : clampOrigin(prev, clamped)))
    },
    [clampOrigin],
  )

  const onPointerDown = (event) => {
    if (event.pointerType === 'touch' && event.target.hasPointerCapture?.(event.pointerId)) {
      /* pinch is handled separately */
    }
    frameRef.current?.setPointerCapture?.(event.pointerId)
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: origin.x,
      oy: origin.y,
    }
  }

  const onPointerMove = (event) => {
    if (!dragRef.current || pinchRef.current) return
    const dx = event.clientX - dragRef.current.x
    const dy = event.clientY - dragRef.current.y
    setOrigin(clampOrigin({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }, scale))
  }

  const onPointerUp = () => {
    dragRef.current = null
  }

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return undefined
    const onWheel = (event) => {
      event.preventDefault()
      applyZoom(scale + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP))
    }
    frame.addEventListener('wheel', onWheel, { passive: false })
    return () => frame.removeEventListener('wheel', onWheel)
  }, [applyZoom, scale])

  const onTouchStart = (event) => {
    if (event.touches.length === 2) {
      const [a, b] = event.touches
      pinchRef.current = {
        distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        scale,
      }
      dragRef.current = null
    }
  }

  const onTouchMove = (event) => {
    if (event.touches.length !== 2 || !pinchRef.current) return
    event.preventDefault()
    const [a, b] = event.touches
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    applyZoom(pinchRef.current.scale * (distance / pinchRef.current.distance))
  }

  const onTouchEnd = (event) => {
    if (event.touches.length < 2) pinchRef.current = null
  }

  const filteredAccess = accessPoints.filter((point) => {
    if (accessFilter === 'all') return true
    return point.type === accessFilter
  })

  return (
    <section className="area-map" aria-labelledby="area-map-heading">
      <header className="area-map__head">
        <p className="area-map__kicker">Scenic Highway 30A</p>
        <h2 id="area-map-heading">{areaLabel}</h2>
        {mapHint ? <p className="area-map__hint">{mapHint}</p> : null}
      </header>

      {maps.length > 1 && (
        <div className="area-map__tabs" role="tablist" aria-label={areaLabel}>
          {maps.map((map) => (
            <button
              key={map.id}
              type="button"
              role="tab"
              aria-selected={map.id === activeMap?.id}
              className={map.id === activeMap?.id ? 'area-map__tab is-active' : 'area-map__tab'}
              onClick={() => {
                setActiveId(map.id)
                applyZoom(1)
              }}
            >
              {map.label}
            </button>
          ))}
        </div>
      )}

      <div className="area-map__stage">
        <div
          ref={frameRef}
          className="area-map__frame"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {activeMap ? (
            <img
              src={activeMap.src}
              alt={activeMap.alt}
              draggable={false}
              className="area-map__image"
              style={{
                transform: `translate(${origin.x}px, ${origin.y}px) scale(${scale})`,
              }}
            />
          ) : null}
        </div>
        <div className="area-map__zoom">
          <IconButton label={zoomInLabel} icon="plus" onClick={() => applyZoom(scale + ZOOM_STEP)} />
          <IconButton label={zoomOutLabel} icon="minus" onClick={() => applyZoom(scale - ZOOM_STEP)} />
          <IconButton label={resetLabel} icon="refresh" onClick={() => applyZoom(1)} />
        </div>
      </div>

      {locations.length > 0 && (
        <div className="area-map__locs">
          <h3>{locationsTitle}</h3>
          <div className="area-map__loc-row">
            {locations.map((item) => (
              <Button key={item.id} to={item.to} variant="ghost" size="sm" icon={item.icon}>
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="area-map__access">
        <div className="area-map__access-head">
          <div>
            <h3>{accessTitle}</h3>
            {accessSubtitle ? <p>{accessSubtitle}</p> : null}
          </div>
          <FilterChips
            wrap
            value={accessFilter}
            onChange={(next) => setAccessFilter(next === 'All' ? 'all' : next)}
            label={accessTitle}
            options={[
              { value: 'all', label: accessAllLabel },
              { value: 'public', label: accessPublicShort || accessPublicLabel },
              { value: 'limited', label: accessLimitedShort || accessLimitedLabel },
              { value: 'private', label: accessPrivateShort || accessPrivateLabel },
            ]}
          />
        </div>
        <ul className="area-map__list">
          {filteredAccess.map((point) => (
            <li key={point.id} className={`area-map__point area-map__point--${point.type}`}>
              <span className="area-map__badge">
                <Icon name={point.type === 'public' ? 'umbrella' : point.type === 'limited' ? 'info' : 'key'} />
                {point.type === 'public'
                  ? accessPublicLabel
                  : point.type === 'limited'
                    ? accessLimitedLabel
                    : accessPrivateLabel}
              </span>
              <strong>{point.name}</strong>
              <span className="area-map__community">{point.community}</span>
              {point.note ? <p>{point.note}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function IconButton({ label, icon, onClick }) {
  return (
    <button type="button" className="area-map__zoom-btn" onClick={onClick} aria-label={label}>
      <Icon name={icon} />
    </button>
  )
}
