import { useState } from 'react'
import { PageHeader, Panel, Grid, Stat, ReferralNote } from '../../components/common/AdminUI'
import { TrendChart, BarChart } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { series, seriesDelta, GUEST_FUNNEL, SERVICE_FUNNEL } from '../../data/analytics'
import { formatNumber } from '../../utils/format'
import { cx } from '../../utils/format'

/** Each step as a share of the first, so the drop-off is the visible thing. */
function Funnel({ steps, note }) {
  const top = steps[0]?.value || 1
  return (
    <>
      <div className="funnel">
        {steps.map((step) => (
          <div className={cx('funnel__row', step.terminal && 'funnel__row--terminal')} key={step.label}>
            <div className="funnel__head">
              <span className="funnel__label">{step.label}</span>
              <span className="funnel__value">
                {formatNumber(step.value)}
                <span className="funnel__pct">{((step.value / top) * 100).toFixed(0)}%</span>
              </span>
            </div>
            <div className="funnel__track">
              <span className="funnel__fill" style={{ width: `${Math.max(2, (step.value / top) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      {note && <ChartNote>{note}</ChartNote>}
    </>
  )
}

export default function GuestAnalytics() {
  useDocumentTitle('Guest analytics')
  const [range, setRange] = useState('30d')

  const visits = seriesDelta('visits', range)
  const conversations = seriesDelta('conversations', range)
  const clicks = seriesDelta('partnerClicks', range)
  const requests = seriesDelta('requests', range)

  return (
    <div className="apage">
      <PageHeader
        title="Guest analytics"
        subtitle="What guests actually do: browse the destination, talk to Vitoria, click through to local businesses, and request the services we run ourselves."
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <div className="astats">
        <Stat label="App visits" value={visits.now} change={visits.change} icon="eye" tone="sea" />
        <Stat label="Conversations" value={conversations.now} change={conversations.change} icon="message" tone="gold" />
        <Stat label="Partner interactions" value={clicks.now} change={clicks.change} icon="navigation" tone="info" />
        <Stat label="Service requests" value={requests.now} change={requests.change} icon="clock" tone="success" />
      </div>

      <Grid cols={2}>
        <Panel title="App visits">
          <TrendChart data={series('visits', range)} label="Visits" height={180} />
        </Panel>
        <Panel title="Vitoria conversations">
          <TrendChart data={series('conversations', range)} label="Conversations" height={180} />
        </Panel>
      </Grid>

      <Grid cols={2}>
        <Panel
          title="Discovery funnel"
          subtitle="From arriving in the app to leaving it for a local business."
        >
          <Funnel
            steps={GUEST_FUNNEL}
            note="The funnel stops at the outbound click on purpose. What happens on the partner's phone line or website is not ours to measure."
          />
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <ReferralNote compact />
          </div>
        </Panel>

        <Panel
          title="Service funnel"
          subtitle="From a question to a completed job with a tip and a review."
        >
          <Funnel
            steps={SERVICE_FUNNEL}
            note="These are services My30A runs itself, so every step is observable — including whether the guest tipped and rated."
          />
        </Panel>
      </Grid>

      <Panel title="Local Guide views by section">
        <BarChart
          data={[
            { label: 'Restaurants', value: 4820 },
            { label: 'Beaches', value: 4210 },
            { label: 'Golf carts', value: 3640 },
            { label: 'Bikes', value: 2910 },
            { label: 'Bonfires', value: 2380 },
            { label: 'Boating', value: 1940 },
            { label: 'Family', value: 1620 },
            { label: 'Wellness', value: 1180 },
            { label: 'Photography', value: 940 },
            { label: 'Events', value: 780 },
          ]}
          label="Local Guide section views"
          height={200}
        />
        <ChartNote>Screen views inside the guest app, not outbound clicks.</ChartNote>
      </Panel>
    </div>
  )
}
