import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { SearchBar, FilterChips } from '../components/ui/Form'
import { EmptyState, ErrorState } from '../components/ui/States'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { PropertyStatusBadge } from '../components/HostUI'
import { useWorkspace } from '../context/WorkspaceContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { setupProgress } from '../data/properties'

const FILTERS = ['All', 'Published', 'Draft', 'Paused']

export default function Properties() {
  const { properties, status, error, loadProperties, recommendationCount, setActivePropertyId } =
    useWorkspace()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  useDocumentTitle('My properties')

  const visible = useMemo(
    () =>
      properties
        .filter((property) => filter === 'All' || property.status === filter.toLowerCase())
        .filter((property) => {
          if (!search.trim()) return true
          const needle = search.trim().toLowerCase()
          return [property.name, property.city, property.type]
            .join(' ')
            .toLowerCase()
            .includes(needle)
        }),
    [properties, filter, search],
  )

  const open = (property) => {
    setActivePropertyId(property.id)
    navigate(`/host/properties/${property.id}`)
  }

  return (
    <div className="hpage">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>My properties</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            {properties.length} propert{properties.length === 1 ? 'y' : 'ies'} ·{' '}
            {properties.filter((p) => p.status === 'published').length} published
          </p>
        </div>
        <Button to="/host/properties/new" icon="plus">
          Add property
        </Button>
      </header>

      <div className="hrow" style={{ marginBottom: 'var(--sp-3)' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search properties"
          label="Search properties"
          className="u-grow"
        />
      </div>

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} label="Filter by status" wrap />

      <div style={{ marginTop: 'var(--sp-5)' }}>
        {status === 'loading' && <SkeletonGrid count={3} columns="hgrid hgrid--3" />}
        {status === 'error' && <ErrorState error={error} onRetry={loadProperties} />}

        {status !== 'loading' && visible.length === 0 && (
          <EmptyState
            icon="building"
            title={properties.length === 0 ? 'No properties yet' : 'Nothing matched'}
            message={
              properties.length === 0
                ? 'Add your first property and we will generate the guest link once it is set up.'
                : 'Try a different search or status filter.'
            }
            actionLabel={properties.length === 0 ? 'Add a property' : undefined}
            actionTo={properties.length === 0 ? '/host/properties/new' : undefined}
          />
        )}

        {status !== 'loading' && visible.length > 0 && (
          <div className="hgrid hgrid--3">
            {visible.map((property) => {
              const progress = setupProgress(property, recommendationCount(property.id))
              return (
                <button
                  key={property.id}
                  type="button"
                  className="panel"
                  style={{ textAlign: 'left', padding: 0, cursor: 'pointer' }}
                  onClick={() => open(property)}
                >
                  <SmartImage photoId={property.coverImage} alt={property.name} ratio="16x9" width={520} />
                  <div style={{ padding: 'var(--sp-4)' }}>
                    <div className="u-between" style={{ gap: 8 }}>
                      <h2 style={{ fontSize: '1.05rem', minWidth: 0 }}>{property.name}</h2>
                      <PropertyStatusBadge status={property.status} />
                    </div>

                    <p className="u-xs u-muted" style={{ marginTop: 4 }}>
                      {property.type} · {property.city}, {property.state}
                    </p>

                    <div className="u-row" style={{ gap: 'var(--sp-4)', marginTop: 'var(--sp-3)' }}>
                      <span className="u-xs u-muted">
                        <Icon name="users" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                        {property.stats.activeGuests} active
                      </span>
                      <span className="u-xs u-muted">
                        <Icon name="sparkles" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                        {property.stats.conversations}
                      </span>
                      {property.stats.satisfaction && (
                        <span className="u-xs u-muted">
                          <Icon name="star" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                          {property.stats.satisfaction}
                        </span>
                      )}
                    </div>

                    <div className="setup__bar" style={{ marginBottom: 6 }}>
                      <span className="setup__fill" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <span className="u-xs u-muted">
                      Setup {progress.percent}% · {progress.done}/{progress.total} sections
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-6)' }}>
        Managing several rentals? Switch between them from the selector at the top of the sidebar —
        every page follows the property you pick.{' '}
        <Link to="/host/help" style={{ color: 'var(--sea-700)' }}>
          How this works
        </Link>
      </p>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
