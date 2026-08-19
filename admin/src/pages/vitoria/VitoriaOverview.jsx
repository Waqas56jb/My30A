import { useState } from 'react'
import Button from '../../components/ui/Button'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { PageHeader, Panel, Grid, Stat, InlineEmpty } from '../../components/common/AdminUI'
import { TrendChart, Donut, RankBars } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { vitoriaSummary, topicBreakdown } from '../../data/conversations'
import { formatNumber } from '../../utils/format'

/**
 * Vitoria's overview.
 *
 * The headline number is not "how many conversations" — it is how many she
 * finished without a human. An escalation is not a failure; it is her
 * correctly deciding a person should answer. The copy says so, because the
 * alternative is someone reading 3.6% as a defect rate.
 */
function formatAvgResponse(seconds) {
  const n = Number(seconds)
  if (!Number.isFinite(n) || n <= 0) return '—'
  if (n < 1) return `${n.toFixed(1)}s`
  if (n < 60) return `${Math.round(n)}s`
  return `${(n / 60).toFixed(1)}m`
}

function volumeFromConversations(conversations, range) {
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : range === '12m' ? 365 : 30
  const buckets = new Map()
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    buckets.set(key, 0)
  }
  for (const row of conversations) {
    const at = row.createdAt || row.created_at
    if (!at) continue
    const key = new Date(at).toISOString().slice(0, 10)
    if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1)
  }
  return [...buckets.entries()].map(([key, value]) => ({
    label: new Date(`${key}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value,
  }))
}

export default function VitoriaOverview() {
  useDocumentTitle('Vitoria AI')
  const [range, setRange] = useState('30d')
  const { data, loading, error, reload } = useLoad(() => api.getAllConversations(), [])
  const kpis = useLoad(() => api.getVitoriaKpis(), [])
  const volume = useLoad(() => api.getInsightSeries('conversations', range), [range])

  if (loading || kpis.loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const fromList = vitoriaSummary(data ?? [])
  const live = kpis.data
  const summary = {
    ...fromList,
    total: live?.conversations ?? fromList.total,
    messages: live?.messages ?? fromList.messages,
    active: live?.active ?? fromList.active,
    resolved: live?.resolved ?? fromList.resolved,
    escalated: live?.escalated ?? fromList.escalated,
    automatedRate: live?.automatedRate ?? fromList.automatedRate,
    escalationRate: live?.escalationRate ?? fromList.escalationRate,
    avgResponse: live?.avgResponse ?? fromList.avgResponse,
  }
  const topics = topicBreakdown(data ?? [])
  const chart = (volume.data && volume.data.length >= 2) ? volume.data : volumeFromConversations(data ?? [], range)

  return (
    <div className="apage">
      <PageHeader
        title="Vitoria AI"
        subtitle="The concierge behind the guest experience. She answers questions, and she raises real service requests that land in the operations queue."
        actions={
          <>
            <Button to="/admin/vitoria/conversations" icon="message">Conversations</Button>
            <Button to="/admin/vitoria/knowledge" variant="secondary" icon="info">Knowledge</Button>
          </>
        }
      />

      <div className="astats">
        <Stat label="Conversations" value={summary.total} icon="message" tone="sea" />
        <Stat label="Messages" value={Number(summary.messages) || 0} icon="send" tone="info" />
        <Stat label="Active now" value={summary.active} icon="circle" tone="gold" />
        <Stat label="Resolved" value={summary.resolved} icon="checkCircle" tone="success" />
        <Stat
          label="Handled automatically"
          value={`${(Number(summary.automatedRate) * 100 || 0).toFixed(1)}%`}
          icon="sparkles"
          tone="success"
        />
        <Stat
          label="Escalated"
          value={`${(Number(summary.escalationRate) * 100 || 0).toFixed(1)}%`}
          icon="alert"
          tone="danger"
          hint="Handed to a human on purpose"
        />
        <Stat
          label="Average response"
          value={formatAvgResponse(summary.avgResponse)}
          icon="clock"
          tone="info"
          hint="Time from the guest’s first message to Vitoria’s first reply"
        />
        <Stat
          label="Guest satisfaction"
          value={Number.isFinite(Number(summary.satisfaction)) ? Number(summary.satisfaction).toFixed(2) : '0.00'}
          suffix=" / 5"
          icon="star"
          tone="gold"
        />
      </div>

      <Panel
        title="Conversation volume"
        actions={<RangeFilter value={range} onChange={setRange} />}
      >
        <TrendChart data={chart} label="Vitoria conversations" height={200} />
        <ChartNote>
          Live conversations started per{' '}
          {range === 'today' ? 'hour' : range === '90d' ? 'week' : range === '12m' ? 'month' : 'day'}.
        </ChartNote>
      </Panel>

      <Grid cols={2}>
        <Panel title="Automated vs escalated">
          <Donut
            segments={[
              { label: 'Handled automatically', value: summary.total - summary.escalated, tone: 'sea' },
              { label: 'Escalated to the team', value: summary.escalated, tone: 'sand' },
            ]}
            centerLabel="Automated"
            centerValue={`${(Number(summary.automatedRate) * 100 || 0).toFixed(1)}%`}
          />
          <ChartNote>
            {formatNumber(summary.escalated)} conversations were handed to a person. Emergencies and
            anything needing a host decision are escalated by design.
          </ChartNote>
        </Panel>

        <Panel title="What guests ask about" subtitle="Topics across every conversation.">
          <RankBars data={topics.slice(0, 10)} valueLabel="conversations" />
        </Panel>
      </Grid>

      <Grid cols={2}>
        <Panel title="Requests she created" subtitle="Vitoria does not just answer — she raises work.">
          <div className="astats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))' }}>
            <Stat label="Requests created" value={summary.requestsCreated} icon="clock" tone="gold" />
            <Stat
              label="Conversion"
              value={`${((summary.requestsCreated / Math.max(1, summary.total)) * 100).toFixed(1)}%`}
              icon="chart"
              tone="sea"
              hint="Of all conversations"
            />
          </div>
          <ChartNote>
            A guest saying “I land at ECP Thursday at 2” becomes a transfer request in the operations
            queue with the airport, flight, time, passengers and bags already collected.
          </ChartNote>
        </Panel>

        <Panel title="Languages" subtitle="Detected from the guest's own messages.">
          {summary.languages.length === 0 ? (
            <InlineEmpty icon="globe" title="No conversations yet" />
          ) : (
            <div className="chiplist">
              {summary.languages.map((language) => (
                <span key={language} className="chip">{language}</span>
              ))}
            </div>
          )}
          <ChartNote>
            Vitoria replies in the language the guest writes in. Supported languages are configured
            in Settings → AI.
          </ChartNote>
        </Panel>
      </Grid>
    </div>
  )
}
