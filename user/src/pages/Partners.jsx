import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import { SearchBar, FilterChips } from '../components/ui/Form'
import { Section, Callout } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { PartnerCard } from '../components/cards/PlaceCard'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'

/**
 * Local partner directory. Every listing exists to connect the guest with the
 * business — there is no internal booking flow, by design.
 */
export default function Partners() {
  const [params, setParams] = useSearchParams()
  const categories = useAsync(() => api.getCategories(), [])
  const OPTIONS = ['All', ...(categories.data ?? []).map((c) => c.name)]
  const initial = params.get('category') ?? 'All'
  const [category, setCategory] = useState(initial)
  const [query, setQuery] = useState('')

  useDocumentTitle(category === 'All' ? 'Local partners' : category)

  useEffect(() => {
    const next = params.get('category') ?? 'All'
    if ((OPTIONS.includes(next) || next === 'All') && next !== category) setCategory(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const onCategoryChange = (next) => {
    setCategory(next)
    if (next === 'All') setParams({}, { replace: true })
    else setParams({ category: next }, { replace: true })
  }

  const { data, loading, error, reload } = useAsync(
    () => api.getPartners({ search: query, category, sort: 'featured' }),
    [query, category],
  )

  const results = data ?? []
  const grouped = useMemo(() => results.filter((p) => p.featured), [results])

  return (
    <div className="page">
      <PageHeader
        title={category === 'All' ? 'Local partners' : category}
        subtitle="Independent businesses we know and trust along 30A."
        back
        backTo="/explore"
        breadcrumbs={[
          { label: 'Explore', to: '/explore' },
          ...(category === 'All'
            ? [{ label: 'Partners' }]
            : [{ label: 'Partners', to: '/partners' }, { label: category }]),
        ]}
      />

      <div className="explore-toolbar">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search bikes, boats, spa, sitters…"
          label="Search partners"
        />
      </div>

      <div style={{ marginTop: 'var(--sp-3)' }}>
        <FilterChips
          options={OPTIONS}
          value={category}
          onChange={onCategoryChange}
          label="Filter by partner category"
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
          {category === 'All' && grouped.length > 0 && (
            <Section title="Guest favourites" subtitle="The partners our guests come back to">
              <div className="grid grid--3">
                {grouped.map((partner) => (
                  <PartnerCard key={partner.id} item={partner} />
                ))}
              </div>
            </Section>
          )}

          <Section
            title={`${results.length} partner${results.length === 1 ? '' : 's'}`}
            subtitle={category === 'All' ? 'All categories' : category}
          >
            {results.length === 0 ? (
              <EmptyState
                icon="sparkles"
                title="No partners in this category yet"
                message="We’re still adding businesses here. Ask Vitoria and she’ll find someone locally."
                actionLabel="Ask Vitoria"
                actionTo="/vitoria"
                secondaryLabel="See all partners"
                secondaryTo="/partners"
              />
            ) : (
              <div className="grid grid--3">
                {results.map((partner, i) => (
                  <PartnerCard key={partner.id} item={partner} eager={i < 3} />
                ))}
              </div>
            )}
          </Section>

          <Callout icon="info" className="section">
            My30A introduces you to these businesses. Bookings, availability, and payment are handled
            by the partner directly — we don’t take a cut of your booking or process it for them.
          </Callout>
        </>
      )}

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
