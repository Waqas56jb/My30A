import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { Kpi, Panel, SetupChecklist, ActivityList, QuickAction, PropertyStatusBadge } from '../components/HostUI'
import { RankBars, TrendChart } from '../components/charts/Charts'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as guestService from '../services/guestService'
import * as analyticsService from '../services/analyticsService'
import * as vitoriaService from '../services/vitoriaService'
import { setupProgress } from '../data/properties'
import { formatDate } from '../utils/format'

const greeting = (date = new Date()) => {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { host } = useAuth()
  const { activeProperty, recommendationCount, properties } = useWorkspace()
  const navigate = useNavigate()
  useDocumentTitle('Dashboard')

  const propertyId = activeProperty?.id

  const activity = useAsync(() => guestService.getRecentActivity({ propertyId, limit: 6 }), [propertyId])
  const analytics = useAsync(() => analyticsService.getAnalytics(propertyId, '7d'), [propertyId])
  const vitoria = useAsync(() => vitoriaService.getVitoriaSummary(propertyId), [propertyId])

  const progress = useMemo(
    () => (activeProperty ? setupProgress(activeProperty, recommendationCount(activeProperty.id)) : null),
    [activeProperty, recommendationCount],
  )

  if (properties.length === 0) {
    return (
      <div className="hpage">
        <EmptyState
          icon="building"
          title="Add your first property"
          message="Once you have entered your property details, we generate the link your guests use to unlock everything."
          actionLabel="Add a property"
          actionTo="/host/properties/new"
        />
      </div>
    )
  }

  if (!activeProperty) return null
  const stats = activeProperty.stats

  return (
    <div className="hpage">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="u-between u-wrap" style={{ marginBottom: 'var(--sp-5)', gap: 'var(--sp-4)' }}>
        <div style={{ minWidth: 0 }}>
          <p className="u-eyebrow">{formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 4 }}>
            {greeting()}, {host?.firstName ?? 'there'}.
          </h1>
          <div className="u-row" style={{ marginTop: 8 }}>
            <span className="u-small" style={{ fontWeight: 600 }}>
              {activeProperty.name}
            </span>
            <PropertyStatusBadge status={activeProperty.status} />
          </div>
        </div>

        <div className="hrow">
          <Button variant="secondary" to={`/host/properties/${activeProperty.id}/preview`} icon="play">
            Preview as guest
          </Button>
          <Button to={`/host/properties/${activeProperty.id}/guest-access`} icon="qr">
            Guest access
          </Button>
        </div>
      </header>

      {/* -------------------------------- KPIs ------------------------------ */}
      <div className="kpi-grid">
        <Kpi icon="users" label="Active guests" value={stats.activeGuests} />
        <Kpi icon="key" label="Guest sessions" value={stats.guestSessions} delta={analytics.data?.totals?.guestSessions?.delta} />
        <Kpi icon="sparkles" label="Vitoria conversations" value={stats.conversations} delta={analytics.data?.totals?.conversations?.delta} />
        <Kpi icon="star" label="Guest satisfaction" value={stats.satisfaction ?? '—'} suffix={stats.satisfaction ? '★' : ''} hint={stats.satisfaction ? 'Average across rated stays' : 'No ratings yet'} />
        <Kpi icon="eye" label="Property views" value={stats.propertyViews} delta={analytics.data?.totals?.propertyViews?.delta} />
        <Kpi icon="globe" label="Experience clicks" value={stats.experienceClicks} delta={analytics.data?.totals?.experienceClicks?.delta} />
      </div>

      {/* ------------------------- Main + aside grid ------------------------ */}
      <div className="hgrid hgrid--main-aside hsection">
        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel
            title="Recent guest activity"
            subtitle={`What has happened at ${activeProperty.name}`}
            action={
              <Link to="/host/activity" className="u-small" style={{ color: 'var(--sea-700)', fontWeight: 600 }}>
                See all
              </Link>
            }
            flush
          >
            {activity.loading && (
              <div style={{ padding: 'var(--sp-4)' }}>
                <SkeletonList count={3} />
              </div>
            )}
            {activity.error && (
              <div style={{ padding: 'var(--sp-4)' }}>
                <ErrorState error={activity.error} onRetry={activity.reload} />
              </div>
            )}
            {!activity.loading && !activity.error && (
              <ActivityList
                items={activity.data ?? []}
                emptyLabel="No guest activity yet. Once your guests start using their property experience, it will appear here."
              />
            )}
          </Panel>

          <Panel
            title="What guests are asking Vitoria"
            subtitle="The questions your property information has to answer"
            action={
              <Link to="/host/vitoria" className="u-small" style={{ color: 'var(--sea-700)', fontWeight: 600 }}>
                Open Vitoria
              </Link>
            }
          >
            {vitoria.loading && <SkeletonList count={3} />}
            {vitoria.error && <ErrorState error={vitoria.error} onRetry={vitoria.reload} />}
            {!vitoria.loading && !vitoria.error && (
              <>
                <RankBars
                  data={(vitoria.data?.topQuestions ?? []).slice(0, 5).map((item) => ({
                    label: item.question,
                    value: item.count,
                    tone: item.answered ? undefined : 'sand',
                  }))}
                />
                {(vitoria.data?.escalated ?? 0) > 0 && (
                  <div
                    className="u-row"
                    style={{
                      marginTop: 'var(--sp-4)',
                      padding: 'var(--sp-3)',
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--warn-bg)',
                    }}
                  >
                    <Icon name="alert" size={17} style={{ color: 'var(--warn)', flex: 'none' }} />
                    <span className="u-small" style={{ minWidth: 0 }}>
                      {vitoria.data.escalated} question{vitoria.data.escalated === 1 ? '' : 's'} Vitoria
                      could not answer — usually a gap in your property information.
                    </span>
                    <Button size="sm" variant="secondary" to="/host/vitoria" style={{ marginLeft: 'auto' }}>
                      Review
                    </Button>
                  </div>
                )}
              </>
            )}
          </Panel>

          <Panel title="Conversations this week" subtitle="Guest questions per day">
            {analytics.loading && <SkeletonGrid count={1} columns="hgrid--2" />}
            {!analytics.loading && !analytics.error && (
              <TrendChart data={analytics.data?.conversations ?? []} label="Conversations this week" />
            )}
          </Panel>
        </div>

        {/* --------------------------- Aside --------------------------- */}
        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel
            title="Property setup"
            subtitle={progress.percent === 100 ? 'Everything is in place' : 'Finish these and guests stop having to ask'}
          >
            <SetupChecklist progress={progress} propertyId={activeProperty.id} />
            {progress.percent < 100 && (
              <Button
                block
                style={{ marginTop: 'var(--sp-4)' }}
                onClick={() => {
                  const nextItem = progress.items.find((item) => !item.done)
                  navigate(`/host/properties/${activeProperty.id}/${nextItem.route}`)
                }}
              >
                Complete setup
              </Button>
            )}
          </Panel>

          <Panel title="Quick actions">
            <div className="hgrid hgrid--3" style={{ gap: 'var(--sp-2)' }}>
              <QuickAction icon="wifi" label="Update WiFi" to={`/host/properties/${activeProperty.id}/wifi`} />
              <QuickAction icon="key" label="Check-in info" to={`/host/properties/${activeProperty.id}/check-in`} />
              <QuickAction icon="shield" label="House rules" to={`/host/properties/${activeProperty.id}/rules`} />
              <QuickAction
                icon="sparkles"
                label="Add a recommendation"
                to={`/host/properties/${activeProperty.id}/recommendations`}
              />
              <QuickAction icon="qr" label="Guest QR code" to={`/host/properties/${activeProperty.id}/guest-access`} />
              <QuickAction icon="play" label="Preview as guest" to={`/host/properties/${activeProperty.id}/preview`} />
            </div>
          </Panel>

          <Panel title="Your property" flush>
            <SmartImage photoId={activeProperty.coverImage} alt={activeProperty.name} ratio="16x9" width={640} />
            <div style={{ padding: 'var(--sp-4)' }}>
              <div className="u-between">
                <span className="u-small" style={{ fontWeight: 600 }}>
                  {activeProperty.name}
                </span>
                <PropertyStatusBadge status={activeProperty.status} />
              </div>
              <p className="u-xs u-muted" style={{ marginTop: 4 }}>
                {activeProperty.city}, {activeProperty.state} · {activeProperty.bedrooms} bed ·{' '}
                {activeProperty.bathrooms} bath · sleeps {activeProperty.maxGuests}
              </p>
              <Button
                size="sm"
                variant="secondary"
                block
                style={{ marginTop: 'var(--sp-4)' }}
                to={`/host/properties/${activeProperty.id}`}
              >
                Manage property
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
