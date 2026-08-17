import { useState } from 'react'
import Icon from '../components/ui/Icon'
import { FilterChips, Checkbox } from '../components/ui/Form'
import { EmptyState, ErrorState } from '../components/ui/States'
import { SkeletonList } from '../components/ui/Skeleton'
import { Panel, ActivityList, Kpi } from '../components/HostUI'
import { RankBars } from '../components/charts/Charts'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as guestService from '../services/guestService'
import * as analyticsService from '../services/analyticsService'

const TYPES = [
  { value: 'All', label: 'Everything' },
  { value: 'vitoria', label: 'Vitoria' },
  { value: 'property', label: 'Property info' },
  { value: 'partner', label: 'Local partners' },
  { value: 'service', label: 'Services' },
  { value: 'access', label: 'Access' },
  { value: 'feedback', label: 'Feedback' },
]

/** A single feed of what guests are doing, plus what they look at most. */
export default function Activity() {
  const { activeProperty } = useWorkspace()
  const [type, setType] = useState('All')
  const [thisPropertyOnly, setThisPropertyOnly] = useState(true)
  useDocumentTitle('Guest activity')

  const propertyId = thisPropertyOnly ? activeProperty?.id : null

  const feed = useAsync(
    () => guestService.getRecentActivity({ propertyId, limit: 40 }),
    [propertyId],
  )
  const analytics = useAsync(
    () => analyticsService.getAnalytics(activeProperty?.id, '30d'),
    [activeProperty?.id],
  )
  const partners = useAsync(
    () => analyticsService.getPartnerEngagement(activeProperty?.id),
    [activeProperty?.id],
  )

  const items = (feed.data ?? []).filter((item) => type === 'All' || item.type === type)
  const totals = analytics.data?.totals

  return (
    <div className="hpage">
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Guest activity</h1>
        <p className="u-small u-muted" style={{ marginTop: 4 }}>
          How guests are actually using the experience you set up.
        </p>
      </header>

      <div className="kpi-grid">
        <Kpi icon="key" label="Guest sessions" value={totals?.guestSessions?.value ?? '—'} delta={totals?.guestSessions?.delta} />
        <Kpi icon="sparkles" label="Conversations" value={totals?.conversations?.value ?? '—'} delta={totals?.conversations?.delta} />
        <Kpi icon="eye" label="Property views" value={totals?.propertyViews?.value ?? '—'} delta={totals?.propertyViews?.delta} />
        <Kpi icon="compass" label="Experience clicks" value={totals?.experienceClicks?.value ?? '—'} delta={totals?.experienceClicks?.delta} />
      </div>

      <div className="hgrid hgrid--main-aside hsection">
        <Panel title="Recent activity" flush>
          <div style={{ padding: 'var(--sp-4)' }}>
            <div className="u-between u-wrap" style={{ gap: 'var(--sp-3)' }}>
              <FilterChips options={TYPES} value={type} onChange={setType} label="Filter activity" wrap />
              {activeProperty && (
                <Checkbox checked={thisPropertyOnly} onChange={setThisPropertyOnly}>
                  {activeProperty.name} only
                </Checkbox>
              )}
            </div>
          </div>

          {feed.loading && (
            <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
              <SkeletonList count={4} />
            </div>
          )}
          {feed.error && (
            <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
              <ErrorState error={feed.error} onRetry={feed.reload} />
            </div>
          )}
          {!feed.loading && items.length === 0 && (
            <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
              <EmptyState
                icon="list"
                title={type === 'All' ? 'No guest activity yet' : 'Nothing of that kind yet'}
                message={
                  type === 'All'
                    ? 'Once your guests start using their property experience, activity will appear here.'
                    : 'Try another filter.'
                }
                plain
              />
            </div>
          )}
          {!feed.loading && items.length > 0 && <ActivityList items={items} />}
        </Panel>

        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel title="Most viewed property info" subtitle="Last 30 days">
            {analytics.loading && <SkeletonList count={2} />}
            {!analytics.loading && (analytics.data?.propertyViews ?? []).length > 0 && (
              <RankBars data={analytics.data.propertyViews} valueLabel="views" />
            )}
            {!analytics.loading && (analytics.data?.propertyViews ?? []).length === 0 && (
              <EmptyState icon="eye" title="Nothing viewed yet" message="This fills in once guests arrive." plain />
            )}
          </Panel>

          <Panel title="What guests explored" subtitle="Public 30A content, last 30 days">
            {!analytics.loading && (analytics.data?.experiences ?? []).length > 0 && (
              <RankBars data={analytics.data.experiences} valueLabel="clicks" />
            )}
            {!analytics.loading && (analytics.data?.experiences ?? []).length === 0 && (
              <EmptyState icon="compass" title="No exploring yet" message="This fills in once guests arrive." plain />
            )}
          </Panel>

          <Panel title="Local partner interest" subtitle="Views and outbound clicks">
            {(partners.data ?? []).length === 0 ? (
              <EmptyState icon="globe" title="No partner activity yet" message="This fills in once guests arrive." plain />
            ) : (
              <div className="hstack" style={{ gap: 'var(--sp-3)' }}>
                {(partners.data ?? []).slice(0, 4).map((partner) => (
                  <div key={partner.partner}>
                    <div className="u-between">
                      <span className="u-small" style={{ fontWeight: 600, minWidth: 0 }}>
                        {partner.partner}
                      </span>
                      <span className="u-xs u-muted">{partner.views} views</span>
                    </div>
                    <div className="u-row" style={{ gap: 'var(--sp-3)', marginTop: 2 }}>
                      <span className="u-xs u-muted">
                        <Icon name="globe" size={12} style={{ verticalAlign: '-1px', marginRight: 3 }} />
                        {partner.website} website
                      </span>
                      <span className="u-xs u-muted">
                        <Icon name="phone" size={12} style={{ verticalAlign: '-1px', marginRight: 3 }} />
                        {partner.phone} calls
                      </span>
                    </div>
                  </div>
                ))}
                <p className="u-xs u-muted" style={{ lineHeight: 1.6 }}>
                  We count views and outbound taps only. What happens on the partner&apos;s own site is
                  not something we can see, so we never report it as a booking.
                </p>
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
