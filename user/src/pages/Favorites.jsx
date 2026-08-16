import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import { FilterChips } from '../components/ui/Form'
import { Section } from '../components/ui/Display'
import { EmptyState } from '../components/ui/States'
import PlaceCard from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { resolveEntity } from '../services/mockApi'

const FILTERS = ['All', 'Restaurants', 'Beaches', 'Partners', 'Events']

const kindOf = (entity) => {
  if (entity.type === 'restaurant') return 'Restaurants'
  if (entity.type === 'beach') return 'Beaches'
  if (entity.title) return 'Events'
  return 'Partners'
}

const routeFor = (entity) => {
  switch (kindOf(entity)) {
    case 'Restaurants':
      return `/restaurants/${entity.id}`
    case 'Beaches':
      return `/beaches/${entity.id}`
    case 'Events':
      return `/events/${entity.id}`
    default:
      return `/partners/${entity.id}`
  }
}

/** Saved places — works for public visitors too, stored on the device. */
export default function Favorites() {
  const { savedIds } = useApp()
  const [filter, setFilter] = useState('All')
  useDocumentTitle('Saved places')

  const saved = useMemo(() => savedIds.map(resolveEntity).filter(Boolean), [savedIds])
  const visible = useMemo(
    () => (filter === 'All' ? saved : saved.filter((entity) => kindOf(entity) === filter)),
    [saved, filter],
  )

  return (
    <div className="page">
      <PageHeader
        title="Saved places"
        subtitle={
          saved.length
            ? `${saved.length} ${saved.length === 1 ? 'place' : 'places'} saved on this device`
            : 'Tap the heart on anything you want to come back to'
        }
        back
        backTo="/explore"
      />

      {saved.length > 0 && (
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} label="Filter saved places" />
      )}

      {saved.length === 0 ? (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <EmptyState
            icon="heart"
            title="Nothing saved yet"
            message="As you browse restaurants, beaches, and local partners, tap the heart and they will collect here for the rest of your trip."
            actionLabel="Explore 30A"
            actionTo="/explore"
            secondaryLabel="Ask Vitoria"
            secondaryTo="/vitoria"
          />
        </div>
      ) : visible.length === 0 ? (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <EmptyState
            icon="search"
            title={`Nothing saved under ${filter}`}
            message="Try another filter."
            plain
          />
        </div>
      ) : (
        <Section title={filter === 'All' ? 'Everything you saved' : filter}>
          <div className="grid grid--3">
            {visible.map((entity) =>
              kindOf(entity) === 'Events' ? (
                <EventCard key={entity.id} event={entity} layout="stack" />
              ) : (
                <PlaceCard key={entity.id} item={entity} to={routeFor(entity)} />
              ),
            )}
          </div>
        </Section>
      )}

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
