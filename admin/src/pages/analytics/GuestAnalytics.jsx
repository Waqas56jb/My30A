import { useState } from 'react'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { PageHeader, Panel, Grid, Stat, ReferralNote } from '../../components/common/AdminUI'
import { TrendChart, BarChart } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { topicBreakdown } from '../../data/conversations'
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

const sumSeries = (rows) => (rows ?? []).reduce((total, point) => total + (Number(point.value) || 0), 0)

export default function GuestAnalytics() {
  useDocumentTitle('Guest analytics')
  const [range, setRange] = useState('30d')

  const overview = useLoad(() => api.getOverview(), [])
  const convos = useLoad(() => api.getAllConversations(), [])
  const orders = useLoad(() => api.getOrders({ pageSize: 500 }), [])
  const transfers = useLoad(() => api.getTransfers({ pageSize: 500 }), [])
  const visitSeries = useLoad(() => api.getInsightSeries('visits', range), [range])
  const convoSeries = useLoad(() => api.getInsightSeries('conversations', range), [range])
  const clickSeries = useLoad(() => api.getInsightSeries('partnerClicks', range), [range])
  const requestSeries = useLoad(() => api.getInsightSeries('requests', range), [range])

  const loading = [overview, convos, orders, transfers].some((item) => item.loading)
  if (loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />

  const t = overview.data?.totals ?? {}
  const conversations = convos.data ?? []
  const grocery = orders.data?.rows ?? []
  const rides = transfers.data?.rows ?? []

  const guestFunnel = [
    { label: 'Guests with an active stay', value: t.activeGuests ?? 0 },
    { label: 'Talked to Vitoria', value: conversations.length },
    { label: 'Partner interactions', value: t.partnerClicks ?? 0 },
    { label: 'Service requests', value: grocery.length + rides.length, terminal: true },
  ]

  const serviceFunnel = [
    { label: 'Talked to Vitoria', value: conversations.length },
    { label: 'Created a service request', value: grocery.length + rides.length },
    { label: 'Request confirmed', value: [...grocery, ...rides].filter((r) => !['pending', 'cancelled', 'no_show'].includes(r.status)).length },
    { label: 'Service completed', value: grocery.filter((r) => r.status === 'delivered').length + rides.filter((r) => r.status === 'completed').length },
    { label: 'Left a tip', value: [...grocery, ...rides].filter((r) => Number(r.tipAmount) > 0).length, terminal: true },
  ]

  const topics = topicBreakdown(conversations)

  return (
    <div className="apage">
      <PageHeader
        title="Guest analytics"
        subtitle="What guests actually do: browse the destination, talk to Vitoria, click through to local businesses, and request the services we run ourselves."
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <div className="astats">
        <Stat label="App visits" value={sumSeries(visitSeries.data) || t.guests} icon="eye" tone="sea" />
        <Stat label="Conversations" value={sumSeries(convoSeries.data) || conversations.length} icon="message" tone="gold" />
        <Stat label="Partner interactions" value={sumSeries(clickSeries.data) || t.partnerClicks} icon="navigation" tone="info" />
        <Stat label="Service requests" value={sumSeries(requestSeries.data) || grocery.length + rides.length} icon="clock" tone="success" />
      </div>

      <Grid cols={2}>
        <Panel title="App visits">
          <TrendChart data={visitSeries.data ?? []} label="Visits" height={180} />
          <ChartNote>Recorded guest app events in this range. Empty until the guest app posts analytics events.</ChartNote>
        </Panel>
        <Panel title="Vitoria conversations">
          <TrendChart data={convoSeries.data ?? []} label="Conversations" height={180} />
        </Panel>
      </Grid>

      <Grid cols={2}>
        <Panel
          title="Discovery funnel"
          subtitle="From arriving in the app to leaving it for a local business."
        >
          <Funnel
            steps={guestFunnel}
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
            steps={serviceFunnel}
            note="These are services My30A runs itself, so every step is observable — including whether the guest tipped."
          />
        </Panel>
      </Grid>

      <Panel title="What guests ask Vitoria" subtitle="Topics inferred from live conversation messages.">
        {topics.length === 0 ? (
          <ChartNote>No conversations yet.</ChartNote>
        ) : (
          <BarChart data={topics} label="Conversation topics" height={200} />
        )}
      </Panel>
    </div>
  )
}
