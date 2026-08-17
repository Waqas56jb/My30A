import { useState } from 'react'
import Button from '../../components/ui/Button'
import { PageHeader, Panel, Grid, Stat } from '../../components/common/AdminUI'
import { TrendChart } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { series, seriesDelta, METRICS } from '../../data/analytics'
import { formatNumber, formatCurrency } from '../../utils/format'

const SECTIONS = [
  { to: '/admin/analytics/guests', label: 'Guest analytics', icon: 'users', blurb: 'Visits, conversations, browsing and the two conversion funnels.' },
  { to: '/admin/analytics/partners', label: 'Partner analytics', icon: 'sparkles', blurb: 'Referral traffic by partner and category. Views and clicks only.' },
  { to: '/admin/analytics/services', label: 'Service analytics', icon: 'bag', blurb: 'Grocery and transfer volume, completion, cancellation and value.' },
  { to: '/admin/analytics/revenue', label: 'Revenue analytics', icon: 'dollar', blurb: 'Gross, refunds, net and tips, broken down by source.' },
]

export default function AnalyticsOverview() {
  useDocumentTitle('Analytics')
  const [range, setRange] = useState('30d')

  const cards = ['guests', 'revenue', 'requests', 'partnerClicks'].map((metric) => ({
    metric,
    ...seriesDelta(metric, range),
  }))

  return (
    <div className="apage">
      <PageHeader
        title="Analytics"
        subtitle="Everything measurable across the platform. Each series is drawn from one shared history, so the numbers agree wherever they appear."
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <div className="astats">
        {cards.map((card) => (
          <Stat
            key={card.metric}
            label={METRICS[card.metric].label}
            value={
              card.metric === 'revenue' ? formatCurrency(card.now) : formatNumber(card.now)
            }
            change={card.change}
            icon={
              { guests: 'users', revenue: 'dollar', requests: 'clock', partnerClicks: 'navigation' }[card.metric]
            }
            tone={{ guests: 'sea', revenue: 'success', requests: 'info', partnerClicks: 'gold' }[card.metric]}
          />
        ))}
      </div>

      <Grid cols={2}>
        {['guests', 'revenue', 'requests', 'conversations'].map((metric) => (
          <Panel key={metric} title={METRICS[metric].label}>
            <TrendChart data={series(metric, range)} label={METRICS[metric].label} height={170} />
            <ChartNote>
              {metric === 'revenue'
                ? 'Captured payments only — transfer holds are excluded until the ride completes.'
                : `Per ${range === 'today' ? 'hour' : range === '90d' ? 'week' : range === '12m' ? 'month' : 'day'}.`}
            </ChartNote>
          </Panel>
        ))}
      </Grid>

      <Panel title="Go deeper">
        <Grid cols={2}>
          {SECTIONS.map((section) => (
            <div className="stat" key={section.to}>
              <span className="stat__label">{section.label}</span>
              <span className="stat__hint" style={{ marginBottom: 10 }}>{section.blurb}</span>
              <Button to={section.to} size="sm" variant="secondary" icon={section.icon}>
                Open
              </Button>
            </div>
          ))}
        </Grid>
      </Panel>
    </div>
  )
}
