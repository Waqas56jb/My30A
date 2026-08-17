import { useState } from 'react'
import Button from '../../components/ui/Button'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { PageHeader, Panel, Grid, Stat, InlineEmpty } from '../../components/common/AdminUI'
import { TrendChart, Donut, RankBars } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { vitoriaSummary, topicBreakdown } from '../../data/conversations'
import { series } from '../../data/analytics'
import { formatNumber } from '../../utils/format'

/**
 * Vitoria's overview.
 *
 * The headline number is not "how many conversations" — it is how many she
 * finished without a human. An escalation is not a failure; it is her
 * correctly deciding a person should answer. The copy says so, because the
 * alternative is someone reading 3.6% as a defect rate.
 */
export default function VitoriaOverview() {
  useDocumentTitle('Vitoria AI')
  const [range, setRange] = useState('30d')
  const { data, loading, error, reload } = useLoad(() => api.getAllConversations(), [])

  if (loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const summary = vitoriaSummary(data)
  const topics = topicBreakdown(data)

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

      <Callout icon="info">
        Nothing in this build calls a language model. Replies come from scripted fixtures so the
        shape of the product can be reviewed before an AI provider is connected.
      </Callout>

      <div className="astats">
        <Stat label="Conversations" value={summary.total} icon="message" tone="sea" />
        <Stat label="Messages" value={summary.messages} icon="send" tone="info" />
        <Stat label="Active now" value={summary.active} icon="circle" tone="gold" />
        <Stat label="Resolved" value={summary.resolved} icon="checkCircle" tone="success" />
        <Stat
          label="Handled automatically"
          value={`${(summary.automatedRate * 100).toFixed(1)}%`}
          icon="sparkles"
          tone="success"
        />
        <Stat
          label="Escalated"
          value={`${(summary.escalationRate * 100).toFixed(1)}%`}
          icon="alert"
          tone="danger"
          hint="Handed to a human on purpose"
        />
        <Stat
          label="Average response"
          value={`${summary.avgResponse.toFixed(1)}s`}
          icon="clock"
          tone="info"
        />
        <Stat
          label="Guest satisfaction"
          value={summary.satisfaction.toFixed(2)}
          suffix=" / 5"
          icon="star"
          tone="gold"
        />
      </div>

      <Panel
        title="Conversation volume"
        actions={<RangeFilter value={range} onChange={setRange} />}
      >
        <TrendChart data={series('conversations', range)} label="Vitoria conversations" height={200} />
        <ChartNote>
          Conversations started per {range === 'today' ? 'hour' : range === '90d' ? 'week' : range === '12m' ? 'month' : 'day'}.
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
            centerValue={`${(summary.automatedRate * 100).toFixed(1)}%`}
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
