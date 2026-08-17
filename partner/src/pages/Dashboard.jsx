import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Segmented } from '../components/ui/Form'
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { Panel, Stat, StatusBanner, StatusPill, Journey, QuickAction, TrackingCard } from '../components/PartnerUI'
import { TrendChart, RankBars } from '../components/charts/Charts'
import ListingPreview from '../components/ListingPreview'
import { usePartner } from '../context/PartnerContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as analyticsService from '../services/analyticsService'
import * as partnerService from '../services/partnerService'
import { RANGES } from '../data/analytics'
import { profileCompleteness } from '../data/partners'
import { formatDate, formatNumber } from '../utils/format'

const greeting = (date = new Date()) => {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { partner, applyPartner, pushToast } = usePartner()
  const navigate = useNavigate()
  const [range, setRange] = useState('30d')
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Dashboard')

  const analytics = useAsync(
    () => analyticsService.getAnalytics(partner?.id, range),
    [partner?.id, range],
  )
  const interest = useAsync(() => analyticsService.getInterest(partner?.id), [partner?.id])

  const progress = useMemo(() => profileCompleteness(partner), [partner])
  const data = analytics.data
  const totals = data?.totals ?? {}
  const hasData = (totals.views ?? 0) > 0
  const live = partner?.status === 'approved'

  if (!partner) return null

  const resubmit = async () => {
    setBusy(true)
    try {
      applyPartner(await partnerService.resubmit(partner.id))
      pushToast({
        tone: 'success',
        title: 'Resubmitted for review',
        message: 'Our team will take another look shortly.',
      })
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="ppage">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div style={{ minWidth: 0 }}>
          <p className="u-eyebrow">
            {formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 4 }}>
            {greeting()}, {partner.businessName}
          </h1>
          <div className="u-row" style={{ marginTop: 8 }}>
            <StatusPill status={partner.status} />
            <span className="u-xs u-muted">{partner.category}</span>
          </div>
        </div>

        <div className="prow">
          <Button variant="secondary" to="/partner/preview" icon="eye">
            Preview listing
          </Button>
          <Button to="/partner/analytics" icon="chart">
            Analytics
          </Button>
        </div>
      </header>

      {/* --------------------------- Status banner -------------------------- */}
      <StatusBanner
        partner={partner}
        action={
          partner.status === 'rejected' ? (
            <div className="prow">
              <Button onClick={() => navigate('/partner/profile')} icon="edit">
                Update details
              </Button>
              <Button variant="secondary" onClick={resubmit} loading={busy}>
                Resubmit for review
              </Button>
            </div>
          ) : partner.status === 'suspended' ? (
            <Button onClick={() => navigate('/partner/profile')} icon="edit">
              Update your details
            </Button>
          ) : partner.status === 'pending' ? (
            <Button variant="secondary" onClick={() => navigate('/partner/photos')} icon="image">
              Add more photos while you wait
            </Button>
          ) : null
        }
      />

      {/* ------------------------------- Stats ------------------------------ */}
      <div className="psection">
        <div className="u-between u-wrap" style={{ marginBottom: 'var(--sp-4)', gap: 'var(--sp-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-h3)' }}>Profile performance</h2>
            <p className="u-xs u-muted">How guests found and connected with you</p>
          </div>
          <Segmented
            value={range}
            onChange={setRange}
            label="Date range"
            options={RANGES.map((option) => ({ value: option.value, label: option.label }))}
          />
        </div>

        {analytics.loading && <SkeletonGrid count={4} columns="pgrid pgrid--3" />}
        {analytics.error && <ErrorState error={analytics.error} onRetry={analytics.reload} />}

        {!analytics.loading && !analytics.error && !hasData && (
          <EmptyState
            icon="chart"
            title={live ? 'Not enough activity yet' : 'Analytics start once you are live'}
            message={
              live
                ? 'Your listing is live, but we do not have enough activity yet. Numbers usually start moving within a few days.'
                : 'As soon as your listing is approved, every view and tap will be counted here.'
            }
            actionLabel="See what we track"
            actionTo="/partner/analytics"
          />
        )}

        {!analytics.loading && !analytics.error && hasData && (
          <>
            <div className="stat-grid">
              <Stat icon="eye" label="Profile views" value={totals.views} delta={data.deltas?.views} />
              <Stat icon="globe" label="Website clicks" value={totals.website} delta={data.deltas?.website} />
              <Stat icon="phone" label="Phone clicks" value={totals.phone} delta={data.deltas?.phone} />
              <Stat
                icon="navigation"
                label="Directions"
                value={totals.directions}
                delta={data.deltas?.directions}
              />
            </div>

            <Panel
              title="Views over time"
              subtitle={RANGES.find((r) => r.value === range)?.label}
              className="psection"
            >
              <TrendChart data={data.views} label="Profile views over time" />
              <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-4)' }}>
                {formatNumber(analyticsService.totalEngagement(totals))} guests went on to contact you
                — that is {analyticsService.connectRate(totals)}% of everyone who opened your listing.
              </p>
            </Panel>
          </>
        )}
      </div>

      {/* ------------------------- Main + aside grid ------------------------ */}
      <div className="pgrid pgrid--main-aside psection">
        <div className="pstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel
            title="What guests were looking for"
            subtitle="The categories and searches that led them to you"
          >
            {interest.loading && <SkeletonList count={2} />}
            {!interest.loading && (interest.data ?? []).length === 0 && (
              <EmptyState
                icon="compass"
                title="Nothing to show yet"
                message="Once guests start browsing to your listing, we will show you how they got there."
                plain
              />
            )}
            {!interest.loading && (interest.data ?? []).length > 0 && (
              <RankBars data={interest.data} valueLabel="guests" />
            )}
          </Panel>

          <TrackingCard />
        </div>

        <div className="pstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel
            title="Listing strength"
            subtitle={
              progress.percent === 100
                ? 'Your listing is as complete as it gets'
                : 'A stronger listing gets more taps'
            }
          >
            <div className="u-between">
              <span className="u-small" style={{ fontWeight: 600 }}>
                {progress.done} of {progress.total} complete
              </span>
              <span className="u-small" style={{ fontWeight: 700, color: 'var(--sea-700)' }}>
                {progress.percent}%
              </span>
            </div>
            <div
              style={{
                height: 8,
                borderRadius: 999,
                background: 'var(--surface-3)',
                overflow: 'hidden',
                margin: 'var(--sp-3) 0 var(--sp-4)',
              }}
              role="progressbar"
              aria-valuenow={progress.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Listing completeness"
            >
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${progress.percent}%`,
                  background: 'linear-gradient(90deg, var(--sea-700), var(--sea-500))',
                }}
              />
            </div>

            <div className="pstack" style={{ gap: 4 }}>
              {progress.items.map((item) => (
                <div key={item.key} className="u-row" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <Icon
                    name={item.done ? 'checkCircle' : 'circle'}
                    size={16}
                    style={{
                      color: item.done ? 'var(--sea-500)' : 'var(--line-strong)',
                      flex: 'none',
                      marginTop: 2,
                    }}
                  />
                  <span
                    className="u-small"
                    style={{ color: item.done ? 'var(--ink-500)' : 'var(--ink-800)' }}
                  >
                    {item.label}
                    {item.optional && <span className="u-xs u-muted"> · optional</span>}
                  </span>
                </div>
              ))}
            </div>

            {progress.percent < 100 && (
              <Button block variant="secondary" style={{ marginTop: 'var(--sp-4)' }} to="/partner/profile">
                Improve your listing
              </Button>
            )}
          </Panel>

          <Panel title="Quick actions">
            <div className="pstack" style={{ gap: 'var(--sp-2)' }}>
              <QuickAction icon="building" label="Edit business details" to="/partner/profile" />
              <QuickAction icon="image" label="Manage photos" to="/partner/photos" />
              <QuickAction icon="eye" label="See your guest listing" to="/partner/preview" />
              <QuickAction icon="chart" label="Full analytics" to="/partner/analytics" />
            </div>
          </Panel>

          <Panel title="Where you are in the process">
            <Journey status={partner.status} />
          </Panel>
        </div>
      </div>

      {/* ------------------------- Listing at a glance ----------------------- */}
      <div className="psection">
        <div className="u-between u-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-h3)' }}>Your listing</h2>
            <p className="u-xs u-muted">Exactly how guests see you on My30A</p>
          </div>
          <Link to="/partner/preview" className="u-small" style={{ color: 'var(--sea-700)', fontWeight: 600 }}>
            Open full preview
          </Link>
        </div>
        <ListingPreview partner={partner} />
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
