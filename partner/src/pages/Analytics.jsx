import { useState } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Segmented } from '../components/ui/Form'
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { Panel, Stat, TrackingCard } from '../components/PartnerUI'
import { TrendChart, BarChart, RankBars, Donut } from '../components/charts/Charts'
import { usePartner } from '../context/PartnerContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as analyticsService from '../services/analyticsService'
import { RANGES, METRICS } from '../data/analytics'
import { formatNumber } from '../utils/format'

export default function Analytics() {
  const { partner } = usePartner()
  const [range, setRange] = useState('30d')
  const [metric, setMetric] = useState('views')
  useDocumentTitle('Analytics')

  const analytics = useAsync(() => analyticsService.getAnalytics(partner?.id, range), [partner?.id, range])
  const interest = useAsync(() => analyticsService.getInterest(partner?.id), [partner?.id])
  const referrers = useAsync(() => analyticsService.getReferrers(partner?.id), [partner?.id])

  if (!partner) return null

  const data = analytics.data
  const totals = data?.totals ?? {}
  const hasData = (totals.views ?? 0) > 0
  const engagement = analyticsService.totalEngagement(totals)
  const rate = analyticsService.connectRate(totals)

  return (
    <div className="ppage">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Analytics</h1>
          <p className="u-small u-muted" style={{ marginTop: 4, maxWidth: '60ch' }}>
            See how guests discover and connect with your business through My30A.
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
      {analytics.loading && <SkeletonGrid count={4} columns="pgrid pgrid--3" />}

      {!analytics.loading && !analytics.error && !hasData && (
        <>
          <EmptyState
            icon="chart"
            title="Not enough activity yet"
            message={
              partner.status === 'approved'
                ? 'Your listing is live, but we do not have enough activity yet. Numbers usually start moving within a few days — better photos and a filled-in description speed that up.'
                : 'Once your listing is approved, every view and every tap through to you will be counted here.'
            }
            actionLabel="Improve your listing"
            actionTo="/partner/profile"
          />
          <div className="psection">
            <TrackingCard />
          </div>
        </>
      )}

      {!analytics.loading && !analytics.error && hasData && (
        <>
          {/* ------------------------------ Totals ----------------------------- */}
          <div className="stat-grid">
            <Stat icon="eye" label="Profile views" value={totals.views} delta={data.deltas?.views} />
            <Stat icon="globe" label="Website clicks" value={totals.website} delta={data.deltas?.website} />
            <Stat icon="phone" label="Phone clicks" value={totals.phone} delta={data.deltas?.phone} />
            <Stat icon="navigation" label="Directions" value={totals.directions} delta={data.deltas?.directions} />
            <Stat
              icon="sparkles"
              label="Total engagement"
              value={engagement}
              hint="Every tap through to your business"
            />
          </div>

          {/* ------------------------------ Trends ----------------------------- */}
          <Panel
            title="Over time"
            subtitle={RANGES.find((r) => r.value === range)?.label}
            className="psection"
            action={
              <Segmented
                value={metric}
                onChange={setMetric}
                label="Metric"
                options={METRICS.map((m) => ({ value: m.key, label: m.label.replace(' clicks', '') }))}
              />
            }
          >
            <TrendChart
              data={data[metric] ?? []}
              label={`${METRICS.find((m) => m.key === metric)?.label} over time`}
            />
            <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)' }}>
              {METRICS.find((m) => m.key === metric)?.description}
            </p>
          </Panel>

          <div className="pgrid pgrid--2 psection">
            <Panel title="Website clicks" subtitle="Guests who tapped through to your site">
              <BarChart data={data.website ?? []} label="Website clicks" />
            </Panel>
            <Panel title="Phone clicks" subtitle="Guests who tapped to call you">
              <BarChart data={data.phone ?? []} label="Phone clicks" />
            </Panel>
          </div>

          <div className="pgrid pgrid--2 psection">
            <Panel title="Directions" subtitle="Guests who asked their maps app for a route">
              <BarChart data={data.directions ?? []} label="Directions requests" />
            </Panel>

            <Panel title="How the interest splits" subtitle="Of everyone who tapped through">
              <Donut
                segments={[
                  { label: 'Website', value: totals.website ?? 0, color: 'var(--sea-500)' },
                  { label: 'Phone', value: totals.phone ?? 0, color: 'var(--sand-500)' },
                  { label: 'Directions', value: totals.directions ?? 0, color: 'var(--sea-200)' },
                ]}
                centerValue={rate !== null ? `${rate}%` : '—'}
                centerLabel="of viewers"
              />
              <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)', lineHeight: 1.6 }}>
                {formatNumber(engagement)} of {formatNumber(totals.views)} guests who opened your
                listing went on to contact you.
              </p>
            </Panel>
          </div>

          {/* ----------------------------- Interest ---------------------------- */}
          <div className="pgrid pgrid--2 psection">
            <Panel title="Guest interest" subtitle="What guests were browsing when they found you">
              {interest.loading && <SkeletonList count={2} />}
              {!interest.loading && (interest.data ?? []).length === 0 && (
                <EmptyState icon="compass" title="Nothing yet" message="This fills in as guests browse." plain />
              )}
              {!interest.loading && (interest.data ?? []).length > 0 && (
                <RankBars data={interest.data} valueLabel="guests" />
              )}
            </Panel>

            <Panel title="Where they came from" subtitle="The part of My30A that sent them">
              {referrers.loading && <SkeletonList count={2} />}
              {!referrers.loading && (referrers.data ?? []).length > 0 && (
                <RankBars data={referrers.data} valueLabel="views" />
              )}
              {!referrers.loading && (referrers.data ?? []).length === 0 && (
                <EmptyState icon="map" title="Nothing yet" message="This fills in as guests browse." plain />
              )}
            </Panel>
          </div>

          <div className="psection">
            <TrackingCard />
          </div>

          <Panel title="A note on these numbers" className="psection">
            <p className="u-small u-muted" style={{ lineHeight: 1.68, maxWidth: '72ch' }}>
              Everything above is an action we can observe on My30A: a listing opened, a button
              tapped. The moment a guest taps through to your website or picks up the phone, they are
              yours — we cannot see what they bought, what you quoted, or whether they turned up, and
              we would rather show you an honest number than a flattering guess.
            </p>
            <Button variant="secondary" size="sm" to="/partner/preview" icon="eye" style={{ marginTop: 'var(--sp-4)' }}>
              See what a guest sees
            </Button>
          </Panel>
        </>
      )}

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
