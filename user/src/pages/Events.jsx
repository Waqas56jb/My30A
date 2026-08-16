import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import { SearchBar, FilterChips } from '../components/ui/Form'
import { Section } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import EventCard from '../components/cards/EventCard'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { formatLongDate, toDate, formatDateRange } from '../utils/format'

const CATEGORIES = ['All', 'Live Music', 'Market', 'Wellness', 'Arts', 'Food & Drink', 'Family']

export default function Events() {
  const { guest } = useApp()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  useDocumentTitle('Events')

  const { data, loading, error, reload } = useAsync(
    () => api.getEvents({ search: query, category }),
    [query, category],
  )

  const events = data ?? []
  const featured = events.filter((e) => e.featured)

  /** Group by calendar day so the list reads like an itinerary. */
  const days = useMemo(() => {
    const map = new Map()
    events.forEach((event) => {
      const key = event.date
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(event)
    })
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [events])

  return (
    <div className="page">
      <PageHeader
        title="Events"
        subtitle={
          guest?.stay
            ? `What’s on between ${formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)}`
            : 'What’s on along 30A'
        }
        back
        backTo="/explore"
        breadcrumbs={[{ label: 'Explore', to: '/explore' }, { label: 'Events' }]}
      />

      <div className="explore-toolbar">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search events"
          label="Search events"
        />
      </div>

      <div style={{ marginTop: 'var(--sp-3)' }}>
        <FilterChips
          options={CATEGORIES}
          value={category}
          onChange={setCategory}
          label="Filter events by category"
        />
      </div>

      {loading && (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <SkeletonGrid count={4} columns="grid--2" />
        </div>
      )}
      {error && (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <ErrorState error={error} onRetry={reload} />
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <EmptyState
            icon="ticket"
            title="No events matched"
            message="Nothing on the calendar for that filter. Vitoria hears about things before they’re listed — worth asking."
            actionLabel="Ask Vitoria"
            actionTo="/vitoria"
          />
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          {category === 'All' && featured.length > 0 && (
            <Section title="Worth planning around">
              <div className="grid grid--3">
                {featured.map((event) => (
                  <EventCard key={event.id} event={event} layout="stack" />
                ))}
              </div>
            </Section>
          )}

          <Section title="By day" subtitle={`${events.length} events during your stay`}>
            <div className="u-stack" style={{ gap: 'var(--sp-6)' }}>
              {days.map(([date, list]) => (
                <div key={date}>
                  <h3
                    className="u-eyebrow"
                    style={{ marginBottom: 'var(--sp-3)', color: 'var(--ink-500)' }}
                  >
                    {formatLongDate(date)}
                    {isToday(date) ? ' · today' : ''}
                  </h3>
                  <div className="u-stack">
                    {list.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}

const isToday = (date) => {
  const d = toDate(date)
  const now = new Date()
  return (
    d &&
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}
