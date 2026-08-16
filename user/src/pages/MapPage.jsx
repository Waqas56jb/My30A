import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import { FilterChips } from '../components/ui/Form'
import { BottomSheet } from '../components/ui/Modal'
import { EmptyState, ErrorState } from '../components/ui/States'
import Skeleton from '../components/ui/Skeleton'
import Button from '../components/ui/Button'
import MapPanel from '../components/map/MapPanel'
import PlaceCard from '../components/cards/PlaceCard'
import { MetaRow } from '../components/ui/Display'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useIsDesktop } from '../hooks/useMediaQuery'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { formatDistance } from '../utils/format'

const LAYERS = [
  { value: 'All', label: 'Everything' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'beach', label: 'Beaches' },
  { value: 'partner', label: 'Partners' },
  { value: 'event', label: 'Events' },
]

const routeFor = (entity) => {
  switch (entity.kind) {
    case 'restaurant':
      return `/restaurants/${entity.id}`
    case 'beach':
      return `/beaches/${entity.id}`
    case 'event':
      return `/events/${entity.id}`
    default:
      return `/partners/${entity.id}`
  }
}

export default function MapPage() {
  const { property } = useApp()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const [layer, setLayer] = useState('All')
  const [selected, setSelected] = useState(null)
  useDocumentTitle('Map')

  const { data, loading, error, reload } = useAsync(() => api.getMapEntities(), [])

  useEffect(() => {
    track(ANALYTICS_EVENTS.MAP_OPENED, { scope: 'map-page' })
  }, [])

  const entities = useMemo(
    () => (data ?? []).filter((e) => layer === 'All' || e.kind === layer),
    [data, layer],
  )

  return (
    <div className="page">
      <PageHeader
        title="Map"
        subtitle="Your property, and everything worth knowing around it."
        back
        backTo="/explore"
        breadcrumbs={[{ label: 'Explore', to: '/explore' }, { label: 'Map' }]}
      />

      <FilterChips
        options={LAYERS}
        value={layer}
        onChange={(next) => setLayer(next === 'All' ? 'All' : next)}
        label="Map layers"
      />

      {loading && <Skeleton variant="media" style={{ marginTop: 'var(--sp-4)', minHeight: 320 }} />}
      {error && (
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <ErrorState error={error} onRetry={reload} />
        </div>
      )}

      {!loading && !error && (
        <div className="map-layout" style={{ marginTop: 'var(--sp-4)' }}>
          <div className="map-layout__map">
            <MapPanel
              entities={entities}
              property={property}
              activeId={selected?.id}
              onSelect={(pin) => setSelected(pin.kind === 'property' ? null : pin)}
              className={isDesktop ? undefined : 'map-mobile'}
            />
          </div>

          <div className="map-layout__list">
            <p className="results-count">
              {entities.length} place{entities.length === 1 ? '' : 's'} on this layer
            </p>
            {entities.length === 0 ? (
              <EmptyState
                icon="map"
                title="Nothing on this layer"
                message="Switch layers to see more of 30A."
                plain
              />
            ) : (
              entities
                .slice(0, 24)
                .map((entity) => (
                  <PlaceCard key={entity.id} item={entity} to={routeFor(entity)} layout="row" />
                ))
            )}
          </div>
        </div>
      )}

      {/* Tapping a pin on mobile opens a preview sheet rather than navigating away. */}
      <BottomSheet
        open={!!selected && !isDesktop}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected && (
          <div className="u-stack">
            <MetaRow
              items={[
                selected.category ?? selected.cuisine,
                formatDistance(selected.distance),
                selected.location,
              ].filter(Boolean)}
            />
            <p className="u-small u-muted">{selected.shortDescription}</p>
            <Button block onClick={() => navigate(routeFor(selected))} iconRight="arrowRight">
              View details
            </Button>
          </div>
        )}
      </BottomSheet>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
