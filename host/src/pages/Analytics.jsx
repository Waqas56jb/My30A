import { useState } from 'react'
import Icon from '../components/ui/Icon'
import { Segmented } from '../components/ui/Form'
import { EmptyState, ErrorState } from '../components/ui/States'
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeleton'
import { Panel, Kpi } from '../components/HostUI'
import DataTable from '../components/DataTable'
import { TrendChart, BarChart, RankBars, StarBreakdown } from '../components/charts/Charts'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as analyticsService from '../services/analyticsService'
import { RANGES } from '../data/analytics'

export default function Analytics() {
  const { activeProperty } = useWorkspace()
  const [range, setRange] = useState('30d')
  useDocumentTitle('Analytics')

  const propertyId = activeProperty?.id
  const analytics = useAsync(() => analyticsService.getAnalytics(propertyId, range), [propertyId, range])
  const satisfaction = useAsync(() => analyticsService.getSatisfaction(propertyId), [propertyId])
  const partners = useAsync(() => analyticsService.getPartnerEngagement(propertyId), [propertyId])

  const data = analytics.data
  const totals = data?.totals
  const hasData = (totals?.guestSessions?.value ?? 0) > 0

  const partnerColumns = [
    { key: 'category', header: 'Category', render: (row) => row.category },
    { key: 'views', header: 'Views', primary: true, render: (row) => <strong>{row.views}</strong> },
    { key: 'website', header: 'Website clicks', render: (row) => row.website },
    { key: 'phone', header: 'Phone clicks', render: (row) => row.phone },
  ]

  return (
    <div className="hpage hpage--wide">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Analytics</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            {activeProperty?.name ?? 'Your property'} · what guests did and what they asked for.
          </p>
        </div>
        <Segmented
          value={range}
          onChange={setRange}
          label="Date range"
          options={RANGES.map((option) => ({ value: option.value, label: option.label }))}
        />
      </header>

      {analytics.error && <ErrorState error={analytics.error} onRetry={analytics.reload} />}

      {analytics.loading && <SkeletonGrid count={4} columns="hgrid hgrid--3" />}

      {!analytics.loading && !analytics.error && !hasData && (
        <EmptyState
          icon="chart"
          title="No data for this property yet"
          message="Analytics start filling in as soon as your first guest opens their link. Publish the property and share the QR code to get going."
          actionLabel={activeProperty ? 'Guest access' : undefined}
          actionTo={activeProperty ? `/host/properties/${activeProperty.id}/guest-access` : undefined}
        />
      )}

      {!analytics.loading && !analytics.error && hasData && (
        <>
          <div className="kpi-grid">
            <Kpi icon="key" label="Guest sessions" value={totals.guestSessions.value} delta={totals.guestSessions.delta} />
            <Kpi icon="sparkles" label="Conversations" value={totals.conversations.value} delta={totals.conversations.delta} />
            <Kpi icon="eye" label="Property views" value={totals.propertyViews.value} delta={totals.propertyViews.delta} />
            <Kpi icon="compass" label="Experience clicks" value={totals.experienceClicks.value} delta={totals.experienceClicks.delta} />
            <Kpi icon="globe" label="Partner clicks" value={totals.partnerClicks.value} delta={totals.partnerClicks.delta} />
            <Kpi
              icon="star"
              label="Satisfaction"
              value={totals.satisfaction.value ?? '—'}
              suffix={totals.satisfaction.value ? '★' : ''}
              delta={totals.satisfaction.value ? totals.satisfaction.delta : undefined}
            />
          </div>

          <div className="hgrid hgrid--2 hsection">
            <Panel title="Conversations over time" subtitle={RANGES.find((r) => r.value === range)?.label}>
              <TrendChart data={data.conversations} label="Conversations over time" />
            </Panel>

            <Panel title="Guest sessions" subtitle="Each time a guest opened their stay">
              <BarChart data={data.sessions} label="Guest sessions" />
            </Panel>
          </div>

          <div className="hgrid hgrid--2 hsection">
            <Panel title="Most viewed property information">
              <RankBars data={data.propertyViews} valueLabel="views" />
              <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-4)', lineHeight: 1.6 }}>
                A section nobody views is usually one you have not filled in — or one guests never
                needed. Worth a look either way.
              </p>
            </Panel>

            <Panel title="What guests explored on 30A">
              <RankBars data={data.experiences} valueLabel="clicks" />
            </Panel>
          </div>

          <div className="hgrid hgrid--2 hsection">
            <Panel title="Guest satisfaction" subtitle={`${satisfaction.data?.responses ?? 0} ratings`}>
              {satisfaction.loading && <SkeletonList count={2} />}
              {!satisfaction.loading && (satisfaction.data?.responses ?? 0) === 0 && (
                <EmptyState icon="star" title="No ratings yet" message="Guests are asked to rate their stay at check-out." plain />
              )}
              {!satisfaction.loading && (satisfaction.data?.responses ?? 0) > 0 && (
                <>
                  <div className="u-row" style={{ gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', lineHeight: 1 }}>
                      {satisfaction.data.average}
                    </span>
                    <div>
                      <div className="u-row" style={{ gap: 2 }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Icon
                            key={i}
                            name="star"
                            size={15}
                            style={{ color: i < Math.round(satisfaction.data.average) ? 'var(--gold)' : 'var(--line-strong)' }}
                          />
                        ))}
                      </div>
                      <span className="u-xs u-muted">{satisfaction.data.responses} responses</span>
                    </div>
                  </div>
                  <StarBreakdown breakdown={satisfaction.data.breakdown} total={satisfaction.data.responses} />
                </>
              )}
            </Panel>

            <Panel title="Local partner engagement" subtitle="Views and outbound taps only" flush>
              {(partners.data ?? []).length === 0 ? (
                <div style={{ padding: 'var(--sp-5)' }}>
                  <EmptyState icon="globe" title="No partner activity yet" message="This fills in once guests arrive." plain />
                </div>
              ) : (
                <>
                  <DataTable
                    rows={partners.data}
                    columns={partnerColumns}
                    rowKey={(row) => row.partner}
                    cardTitle={(row) => row.partner}
                    caption="Local partner engagement"
                  />
                  <p className="u-xs u-muted" style={{ padding: 'var(--sp-4)', lineHeight: 1.6 }}>
                    <Icon name="info" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                    We can see that a guest tapped through to a business. We cannot see whether they
                    booked — that happens on the partner&apos;s own site — so this is engagement, not
                    revenue.
                  </p>
                </>
              )}
            </Panel>
          </div>
        </>
      )}

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
