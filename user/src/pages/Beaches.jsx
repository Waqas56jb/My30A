import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import { SearchBar } from '../components/ui/Form'
import { Section, Callout } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { BeachCard } from '../components/cards/PlaceCard'
import MapPanel from '../components/map/MapPanel'
import Icon from '../components/ui/Icon'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { mockLocalConditions } from '../data/mockRecommendations'

export default function Beaches() {
  const { property } = useApp()
  const [query, setQuery] = useState('')
  useDocumentTitle('Beach guide')

  const { data, loading, error, reload } = useAsync(() => api.getBeaches({ search: query }), [query])
  const beaches = data ?? []
  const { beachFlag, water, sunset } = mockLocalConditions

  return (
    <div className="page">
      <PageHeader
        title="Beach guide"
        subtitle="Where to go, where to park, and which access will actually be quiet."
        back
        backTo="/explore"
        breadcrumbs={[{ label: 'Explore', to: '/explore' }, { label: 'Beaches' }]}
      />

      <div className="card card--pad" style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div className="u-row" style={{ gap: 'var(--sp-3)' }}>
          <span className="flag-swatch" style={{ background: beachFlag.color }} aria-hidden="true" />
          <div>
            <div className="u-small" style={{ fontWeight: 600 }}>
              {beachFlag.label} flying today
            </div>
            <div className="u-xs u-muted">{beachFlag.meaning}</div>
          </div>
        </div>
        <div className="u-row" style={{ gap: 'var(--sp-3)', marginLeft: 'auto' }}>
          <span className="weather__icon" aria-hidden="true">
            <Icon name="waves" />
          </span>
          <div>
            <div className="u-small" style={{ fontWeight: 600 }}>
              Water {water.tempF}°
            </div>
            <div className="u-xs u-muted">
              {water.surf} · Sunset {sunset}
            </div>
          </div>
        </div>
      </div>

      <div className="explore-toolbar" style={{ marginTop: 'var(--sp-4)' }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search beach accesses"
          label="Search beaches"
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

      {!loading && !error && (
        <>
          <Section title="Your closest access" subtitle={property?.beachAccess?.note}>
            {beaches.length === 0 ? (
              <EmptyState
                icon="umbrella"
                title="No beaches matched"
                message="Try a different search term."
              />
            ) : (
              <div className="grid grid--2">
                {beaches.slice(0, 2).map((beach, i) => (
                  <BeachCard key={beach.id} item={beach} eager={i === 0} />
                ))}
              </div>
            )}
          </Section>

          {beaches.length > 2 && (
            <Section title="Every access along 30A">
              <div className="grid grid--3">
                {beaches.slice(2).map((beach) => (
                  <BeachCard key={beach.id} item={beach} />
                ))}
              </div>
            </Section>
          )}

          <Section title="On the map">
            <MapPanel
              entities={beaches.map((b) => ({ ...b, kind: 'beach' }))}
              property={property}
              style={{ minHeight: 320 }}
            />
          </Section>

          <Callout icon="alert" className="section">
            Beach flags are posted daily by South Walton Fire District. Double red means the water is
            closed — swimming when it flies carries a fine, and the currents are the reason.
          </Callout>
        </>
      )}

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
