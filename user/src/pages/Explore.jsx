import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import { SearchBar, FilterChips, Segmented } from '../components/ui/Form'
import { Section, ScrollRow } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import CategoryCard from '../components/cards/CategoryCard'
import PlaceCard from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import MapPanel from '../components/map/MapPanel'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useIsDesktop } from '../hooks/useMediaQuery'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { exploreCategories } from '../data/mockCategories'

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

const CATEGORY_OPTIONS = ['All', ...exploreCategories.map((c) => c.label)]

/** Maps a category tile label onto the entity fields it should match. */
const matchesCategory = (entity, label) => {
  if (label === 'All') return true
  const category = exploreCategories.find((c) => c.label === label)
  const filter = category?.filter ?? label
  if (filter === 'Events') return entity.kind === 'event'
  if (filter === 'Beaches') return entity.kind === 'beach'
  if (filter === 'Restaurants') return entity.kind === 'restaurant'
  return entity.category === filter
}

export default function Explore() {
  const { property } = useApp()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  useDocumentTitle('Explore 30A')

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [view, setView] = useState('list')
  const [activePin, setActivePin] = useState(null)

  const { data, loading, error, reload } = useAsync(() => api.getMapEntities(), [])

  const entities = data ?? []

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return entities
      .filter((entity) => matchesCategory(entity, category))
      .filter((entity) => {
        if (!needle) return true
        return [entity.name, entity.category, entity.cuisine, entity.location, entity.shortDescription]
          .concat(entity.tags ?? [])
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle))
      })
      .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99))
  }, [entities, query, category])

  const featured = useMemo(() => entities.filter((e) => e.featured).slice(0, 6), [entities])
  const isFiltering = query.trim().length > 0 || category !== 'All'

  const onSearch = (value) => {
    if (value?.trim()) track(ANALYTICS_EVENTS.SEARCH_PERFORMED, { query: value, scope: 'explore' })
  }

  const onViewChange = (next) => {
    setView(next)
    if (next === 'map') track(ANALYTICS_EVENTS.MAP_OPENED, { scope: 'explore' })
  }

  return (
    <div className="page">
      <PageHeader
        title="Explore 30A"
        subtitle="Everything worth your time between Inlet Beach and Dune Allen."
        actions={
          <Segmented
            value={view}
            onChange={onViewChange}
            options={[
              { value: 'list', label: 'List', icon: 'list' },
              { value: 'map', label: 'Map', icon: 'map' },
            ]}
          />
        }
      />

      <div className="explore-toolbar">
        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={onSearch}
          placeholder="Search restaurants, beaches, activities…"
          label="Search 30A"
        />
      </div>

      <div style={{ marginTop: 'var(--sp-3)' }}>
        <FilterChips
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
          label="Filter by category"
        />
      </div>

      {loading && (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <SkeletonGrid count={6} columns="grid--3" />
        </div>
      )}

      {error && (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <ErrorState error={error} onRetry={reload} />
        </div>
      )}

      {!loading && !error && (
        <>
          {view === 'map' ? (
            <div className="map-layout" style={{ marginTop: 'var(--sp-5)' }}>
              <div className="map-layout__map">
                <MapPanel
                  entities={results}
                  property={property}
                  activeId={activePin?.id}
                  onSelect={(pin) => {
                    setActivePin(pin)
                    if (pin.kind !== 'property' && !isDesktop) navigate(routeFor(pin))
                  }}
                  className={isDesktop ? undefined : 'map-mobile'}
                />
              </div>
              <div className="map-layout__list">
                <p className="results-count">
                  {results.length} place{results.length === 1 ? '' : 's'} shown
                </p>
                {results.slice(0, 20).map((entity) =>
                  entity.kind === 'event' ? (
                    <EventCard key={entity.id} event={entity} />
                  ) : (
                    <PlaceCard key={entity.id} item={entity} to={routeFor(entity)} layout="row" />
                  ),
                )}
              </div>
            </div>
          ) : isFiltering ? (
            <Section
              title={`${results.length} result${results.length === 1 ? '' : 's'}`}
              subtitle={category !== 'All' ? category : undefined}
            >
              {results.length === 0 ? (
                <EmptyState
                  icon="search"
                  title="Nothing matched that"
                  message="Try a different search, or ask Vitoria — she knows things that aren’t in a listing."
                  actionLabel="Ask Vitoria"
                  actionTo="/vitoria"
                  secondaryLabel="Clear filters"
                  secondaryTo="/explore"
                />
              ) : (
                <div className="grid grid--3">
                  {results.map((entity) =>
                    entity.kind === 'event' ? (
                      <EventCard key={entity.id} event={entity} layout="stack" />
                    ) : (
                      <PlaceCard key={entity.id} item={entity} to={routeFor(entity)} />
                    ),
                  )}
                </div>
              )}
            </Section>
          ) : (
            <>
              <Section title="Browse by category" id="categories">
                <div className="grid grid--4">
                  {exploreCategories.map((cat) => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      count={entities.filter((e) => matchesCategory(e, cat.label)).length}
                    />
                  ))}
                </div>
              </Section>

              <Section title="Featured on 30A" subtitle="Hand-picked by our local team" id="featured">
                <ScrollRow label="Featured places">
                  {featured.map((entity) => (
                    <PlaceCard key={entity.id} item={entity} to={routeFor(entity)} />
                  ))}
                </ScrollRow>
              </Section>

              <Section
                title="Closest to your door"
                subtitle="Sorted by distance from your property"
                id="closest"
              >
                <div className="grid grid--3">
                  {results.slice(0, 9).map((entity) =>
                    entity.kind === 'event' ? (
                      <EventCard key={entity.id} event={entity} layout="stack" />
                    ) : (
                      <PlaceCard key={entity.id} item={entity} to={routeFor(entity)} />
                    ),
                  )}
                </div>
              </Section>
            </>
          )}
        </>
      )}

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
