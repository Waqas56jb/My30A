import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import { SearchBar, FilterChips, Select, Segmented } from '../components/ui/Form'
import { Section } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { RestaurantCard } from '../components/cards/PlaceCard'
import MapPanel from '../components/map/MapPanel'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useIsDesktop } from '../hooks/useMediaQuery'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'

const FILTERS = ['All', 'Walkable', 'Family friendly', 'Seafood', 'Breakfast', 'Live music', 'Date night']

const SORTS = [
  { value: 'featured', label: 'Featured first' },
  { value: 'distance', label: 'Closest first' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'name', label: 'A–Z' },
]

export default function Restaurants() {
  const { property } = useApp()
  const isDesktop = useIsDesktop()
  useDocumentTitle('Restaurants')

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('featured')
  const [view, setView] = useState('list')

  const { data, loading, error, reload } = useAsync(
    () => api.getRestaurants({ search: query, sort }),
    [query, sort],
  )

  const results = useMemo(() => {
    const list = data ?? []
    if (filter === 'All') return list
    if (filter === 'Walkable') return list.filter((r) => r.walkable)
    if (filter === 'Family friendly') return list.filter((r) => r.goodForKids)
    if (filter === 'Seafood') return list.filter((r) => /seafood/i.test(r.cuisine))
    if (filter === 'Breakfast') return list.filter((r) => r.services?.includes('Breakfast'))
    return list.filter((r) => r.tags?.includes(filter))
  }, [data, filter])

  return (
    <div className="page">
      <PageHeader
        title="Restaurants"
        subtitle="From a two-minute walk to the drive that’s worth it."
        back
        backTo="/explore"
        breadcrumbs={[{ label: 'Explore', to: '/explore' }, { label: 'Restaurants' }]}
        actions={
          <Segmented
            value={view}
            onChange={(next) => {
              setView(next)
              if (next === 'map') track(ANALYTICS_EVENTS.MAP_OPENED, { scope: 'restaurants' })
            }}
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
          placeholder="Search by name, cuisine, or town"
          label="Search restaurants"
        />
        <label className="sr-only" htmlFor="restaurant-sort">
          Sort restaurants
        </label>
        <Select
          id="restaurant-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div style={{ marginTop: 'var(--sp-3)' }}>
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} label="Filter restaurants" />
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
        <Section
          title={`${results.length} restaurant${results.length === 1 ? '' : 's'}`}
          subtitle={filter !== 'All' ? filter : 'Distances measured from your property'}
        >
          {results.length === 0 ? (
            <EmptyState
              icon="utensils"
              title="No restaurants matched"
              message="Try clearing the filters, or ask Vitoria — she can usually find a table somewhere."
              actionLabel="Ask Vitoria"
              actionTo="/vitoria"
            />
          ) : view === 'map' ? (
            <div className="map-layout">
              <div className="map-layout__map">
                <MapPanel
                  entities={results}
                  property={property}
                  className={isDesktop ? undefined : 'map-mobile'}
                />
              </div>
              <div className="map-layout__list">
                {results.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} item={restaurant} layout="row" />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid--3">
              {results.map((restaurant, i) => (
                <RestaurantCard key={restaurant.id} item={restaurant} eager={i < 3} />
              ))}
            </div>
          )}
        </Section>
      )}

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
