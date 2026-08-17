import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { PageHeader, Panel, Grid, Stat, ActivityList } from '../../components/common/AdminUI'
import { BarChart, TrendChart, RankBars, Donut } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { vitoriaSummary, topicBreakdown, CONVERSATION_STATUSES } from '../../data/conversations'
import { series } from '../../data/analytics'
import { formatRelative, formatNumber } from '../../utils/format'

/**
 * AI activity: the operational read on Vitoria rather than the executive one.
 *
 * Volume, topics, response times, and the escalations that still need a human.
 */
export default function Activity() {
  useDocumentTitle('AI activity')
  const [range, setRange] = useState('7d')
  const { data, loading, error, reload } = useLoad(() => api.getAllConversations(), [])

  if (loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const summary = vitoriaSummary(data)
  const topics = topicBreakdown(data)
  const escalations = data.filter((c) => c.status === 'escalated').slice(0, 12)
  const requests = data.filter((c) => c.createdRequest).slice(0, 12)

  /* Response-time buckets, computed from the conversations themselves. */
  const buckets = [
    { label: '0–2s', value: data.filter((c) => c.responseSeconds <= 2).length },
    { label: '3–4s', value: data.filter((c) => c.responseSeconds > 2 && c.responseSeconds <= 4).length },
    { label: '5–6s', value: data.filter((c) => c.responseSeconds > 4 && c.responseSeconds <= 6).length },
    { label: '7–9s', value: data.filter((c) => c.responseSeconds > 6).length },
  ]

  return (
    <div className="apage">
      <PageHeader
        title="AI activity"
        subtitle="What Vitoria has been doing: volume, subjects, speed, and everything she handed to a person."
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <div className="astats">
        <Stat label="Conversations" value={summary.total} icon="message" tone="sea" />
        <Stat label="Messages" value={summary.messages} icon="send" tone="info" />
        <Stat label="Requests created" value={summary.requestsCreated} icon="clock" tone="gold" />
        <Stat label="Open escalations" value={summary.escalated} icon="alert" tone="danger" />
      </div>

      <Panel title="Volume">
        <TrendChart data={series('conversations', range)} label="Conversations" height={190} />
        <ChartNote>
          {formatNumber(summary.total)} conversations in the fixture set. The series is the same
          history the dashboard draws from.
        </ChartNote>
      </Panel>

      <Grid cols={2}>
        <Panel title="Response time" subtitle="How long Vitoria takes to answer.">
          <BarChart data={buckets} label="Response time distribution" height={170} valueSuffix=" conversations" />
          <ChartNote>Average {summary.avgResponse.toFixed(1)} seconds across every conversation.</ChartNote>
        </Panel>

        <Panel title="Outcome">
          <Donut
            segments={[
              { label: 'Resolved', value: summary.resolved, tone: 'sea' },
              { label: 'Active', value: summary.active, tone: 'sand' },
              { label: 'Escalated', value: summary.escalated },
            ]}
            centerLabel="Resolved"
            centerValue={`${((summary.resolved / Math.max(1, summary.total)) * 100).toFixed(0)}%`}
          />
        </Panel>
      </Grid>

      <Panel title="Topics" subtitle="Every subject guests brought up, most common first.">
        <RankBars data={topics} valueLabel="conversations" />
      </Panel>

      <Grid cols={2}>
        <Panel
          title="Escalations waiting"
          subtitle="Vitoria handed these to a human on purpose. They need someone."
        >
          <ActivityList
            items={escalations.map((c) => ({
              id: c.id,
              icon: 'alert',
              title: (
                <Link to={`/admin/vitoria/conversations/${c.id}`} style={{ textDecoration: 'none' }}>
                  {c.guestName} · {c.topic}
                </Link>
              ),
              body: c.propertyName,
              meta: formatRelative(c.createdAt),
            }))}
            empty="No open escalations."
          />
        </Panel>

        <Panel
          title="Requests she raised"
          subtitle="Conversations that turned into real work in the operations queue."
        >
          <ActivityList
            items={requests.map((c) => ({
              id: c.id,
              icon: c.createdRequest.kind === 'transfer' ? 'car' : 'bag',
              title: (
                <Link to={`/admin/vitoria/conversations/${c.id}`} style={{ textDecoration: 'none' }}>
                  {c.createdRequest.label}
                </Link>
              ),
              body: `${c.guestName} · ${c.propertyName}`,
              meta: formatRelative(c.createdAt),
            }))}
            empty="No requests created yet."
          />
        </Panel>
      </Grid>
    </div>
  )
}
