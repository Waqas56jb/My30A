import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import { SearchBar, FilterChips } from '../components/ui/Form'
import { Section, ScrollRow } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import PlaceCard from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import ExperienceTile from '../components/cards/ExperienceTile'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { experiences } from '../data/mockExperiences'

const TYPES = ['All', 'Restaurants', 'Beaches', 'Partners', 'Events']

const SUGGESTIONS = [
  'Seafood',
  'Walkable',
  'Golf cart',
  'Bonfire',
  'Kids',
  'Sunset',
  'Bikes',
  'Coffee',
]

const typeOf = (entity) => {
  switch (entity.kind) {
    case 'restaurant':
      return 'Restaurants'
    case 'beach':
      return 'Beaches'
    case 'event':
      return 'Events'
    default:
      return 'Partners'
  }
}

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

/** Global search across every catalogue plus the experience pages. */
export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [type, setType] = useState('All')
  useDocumentTitle('Search')

  const { data, loading, error, reload } = useAsync(() => api.getMapEntities(), [])
  const entities = data ?? []

  const needle = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (!needle) return []
    return entities
      .filter((entity) => type === 'All' || typeOf(entity) === type)
      .filter((entity) =>
        [entity.name, entity.category, entity.cuisine, entity.location, entity.shortDescription]
          .concat(entity.tags ?? [])
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(needle)),
      )
      .sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99))
  }, [entities, needle, type])

  const matchedExperiences = useMemo(() => {
    if (!needle) return []
    return experiences.filter((experience) =>
      [experience.label, experience.tagline, experience.blurb]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    )
  }, [needle])

  const onSubmit = (value) => {
    if (!value?.trim()) return
    setParams({ q: value.trim() }, { replace: true })
    track(ANALYTICS_EVENTS.SEARCH_PERFORMED, { query: value, scope: 'global' })
  }

  return (
    <div className="page">
      <PageHeader title="Search" subtitle="Restaurants, beaches, partners, events, and experiences." />

      <SearchBar
        value={query}
        onChange={setQuery}
        onSubmit={onSubmit}
        placeholder="Try “bonfire”, “walkable dinner”, “golf cart”…"
        label="Search everything on 30A"
      />

      {needle ? (
        <>
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <FilterChips options={TYPES} value={type} onChange={setType} label="Filter results by type" />
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
              {matchedExperiences.length > 0 && type === 'All' && (
                <Section title="Experiences">
                  <div className="exp-grid">
                    {matchedExperiences.map((experience) => (
                      <ExperienceTile key={experience.slug} experience={experience} />
                    ))}
                  </div>
                </Section>
              )}

              <Section
                title={`${results.length} ${results.length === 1 ? 'place' : 'places'} for “${query.trim()}”`}
              >
                {results.length === 0 ? (
                  <EmptyState
                    icon="search"
                    title="Nothing matched that"
                    message="Vitoria knows things that are not in a listing — she is usually the faster way to an answer."
                    actionLabel="Ask Vitoria"
                    actionTo="/vitoria"
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
            </>
          )}
        </>
      ) : (
        <>
          <Section title="Try one of these">
            <FilterChips
              options={SUGGESTIONS}
              value={null}
              onChange={(value) => {
                setQuery(value)
                onSubmit(value)
              }}
              label="Suggested searches"
              wrap
            />
          </Section>

          <Section title="Or start with an experience">
            <div className="exp-grid">
              {experiences.slice(0, 6).map((experience) => (
                <ExperienceTile key={experience.slug} experience={experience} />
              ))}
            </div>
          </Section>
        </>
      )}

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
