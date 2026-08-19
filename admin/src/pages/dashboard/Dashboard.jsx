import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { PageHeader, Panel, Grid, Stat, ActivityList, ReferralNote } from '../../components/common/AdminUI'
import { BarChart, TrendChart, Donut, RankBars } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { todaySnapshot, METRICS } from '../../data/analytics'
import { formatCurrency, formatNumber, formatRelative } from '../../utils/format'

/**
 * The executive view.
 *
 * Eight numbers, today's movement, seven charts and the queue. Deliberately
 * not everything — the daily work lives on /admin/operations, and mixing the
 * two makes both worse.
 */
export default function Dashboard() {
  const { user, attention } = useAdmin()
  const [range, setRange] = useState('30d')
  const [metric, setMetric] = useState('guests')

  useDocumentTitle('Dashboard')

  const overview = useLoad(() => api.getOverview(), [])
  const activity = useLoad(() => api.getRecentAudit(8), [])
  const chartLoad = useLoad(() => api.getInsightSeries(metric, range), [metric, range])

  if (overview.loading) return <SkeletonGrid count={8} columns="grid--4" />
  if (overview.error) return <ErrorState error={overview.error} onRetry={overview.reload} />

  const t = overview.data?.totals ?? {}
  const today = overview.data?.today ?? todaySnapshot()
  const chart = Array.isArray(chartLoad.data) ? chartLoad.data : []
  const first = chart[0]?.value ?? 0
  const last = chart[chart.length - 1]?.value ?? 0
  const delta = {
    now: chart.reduce((sum, p) => sum + (Number(p.value) || 0), 0),
    change: first ? (last - first) / Math.max(1, first) : 0,
  }

  const TODAY_ROWS = [
    { label: 'New guests', value: today.newGuests, icon: 'user' },
    { label: 'New hosts', value: today.newHosts, icon: 'building' },
    { label: 'New partners', value: today.newPartners, icon: 'sparkles' },
    { label: 'New requests', value: today.newRequests, icon: 'clock' },
    { label: 'Completed orders', value: today.completedOrders, icon: 'checkCircle' },
    { label: 'Payments', value: today.payments, icon: 'creditCard' },
    { label: 'Refunds', value: today.refunds, icon: 'refresh' },
  ]

  return (
    <div className="apage">
      <PageHeader
        title={`Good morning, ${user?.name?.split(' ')[0] ?? 'there'}`}
        subtitle={`Everything happening across guests, hosts, partners and services on 30A. ${
          attention.length
            ? `${attention.reduce((s, a) => s + a.count, 0)} things need a decision today.`
            : 'Nothing is waiting on you right now.'
        }`}
        actions={
          <>
            <Button to="/admin/operations" icon="compass">Operations</Button>
            <Button to="/admin/reports" variant="secondary" icon="upload">Reports</Button>
          </>
        }
      />

      {/* ------------------------- Headline numbers ------------------------ */}
      <div className="astats">
        <Stat label="Total guests" value={t.guests} icon="users" tone="sea" to="/admin/guests" hint={`${formatNumber(t.upcomingGuests)} arriving soon`} />
        <Stat label="Active guests" value={t.activeGuests} icon="user" tone="success" to="/admin/guests?status=active" hint="In residence right now" />
        <Stat label="Hosts" value={t.hosts} icon="building" tone="info" to="/admin/hosts" hint={`${t.activeHosts} active`} />
        <Stat label="Properties" value={t.properties} icon="key" tone="sea" to="/admin/properties" hint={`${t.activeProperties} live`} />
        <Stat label="Partners" value={t.partners} icon="sparkles" tone="gold" to="/admin/partners" hint={`${t.approvedPartners} approved`} />
        <Stat label="Active requests" value={t.activeRequests} icon="clock" tone="danger" to="/admin/service-requests" hint="Grocery + transfers in flight" />
        <Stat label="Revenue" value={formatCurrency(t.revenue)} icon="dollar" tone="success" to="/admin/analytics/revenue" hint={`${formatCurrency(t.netRevenue)} net of refunds`} />
        <Stat label="Conversations" value={t.conversations} icon="message" tone="gold" to="/admin/vitoria/conversations" hint={`${formatNumber(t.messages)} messages`} />
        <Stat label="Partner interactions" value={t.partnerClicks} icon="navigation" tone="gold" to="/admin/analytics/partners" hint="Referral activity only" />
      </div>

      {/* ---------------------------- Attention ---------------------------- */}
      {attention.length > 0 && (
        <Panel
          title="Needs your attention"
          subtitle="Each of these is a queue with work sitting in it."
          actions={<Button to="/admin/operations" size="sm" variant="secondary" iconRight="arrowRight">Open operations</Button>}
        >
          <div className="attention">
            {attention.map((item) => (
              <Link key={item.id} to={item.to} className={`attn attn--${item.tone}`}>
                <span className="attn__count">{item.count}</span>
                <span className="attn__label">{item.label}</span>
                <Icon name="chevronRight" size={16} className="attn__go" />
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {/* ------------------------------ Charts ----------------------------- */}
      <Panel
        title={METRICS[metric].label}
        subtitle="Pick a metric and a period. Every series is drawn from the same history, so zooming out never contradicts zooming in."
        actions={<RangeFilter value={range} onChange={setRange} />}
      >
        <div className="chiplist" style={{ marginBottom: 'var(--sp-4)' }}>
          {Object.entries(METRICS).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              className={`chip${metric === key ? ' chip--active' : ''}`}
              aria-pressed={metric === key}
              onClick={() => setMetric(key)}
            >
              {meta.label}
            </button>
          ))}
        </div>

        <div className="u-row u-wrap" style={{ gap: 'var(--sp-5)', marginBottom: 'var(--sp-4)' }}>
          <div>
            <span className="stat__label">Total in period</span>
            <span className="stat__value" style={{ display: 'block' }}>
              {METRICS[metric].prefix}
              {formatNumber(delta.now)}
            </span>
          </div>
          <div>
            <span className="stat__label">Change</span>
            <span
              className={`stat__change ${delta.change >= 0 ? 'is-up' : 'is-down'}`}
              style={{ display: 'flex', marginTop: 6 }}
            >
              <Icon name={delta.change >= 0 ? 'chevronUp' : 'chevronDown'} size={14} />
              {Math.abs(delta.change * 100).toFixed(1)}% vs previous {range}
            </span>
          </div>
        </div>

        {chart.length > 24 ? (
          <TrendChart data={chart} label={METRICS[metric].label} height={240} />
        ) : (
          <BarChart data={chart} label={METRICS[metric].label} height={240} />
        )}

        <ChartNote>
          {metric === 'partnerClicks'
            ? 'Outbound interactions with partner listings. Referral activity only — nothing after the click is measurable.'
            : metric === 'revenue'
              ? 'Captured payments only. Authorised-but-not-captured transfers are excluded until the ride is completed.'
              : `${METRICS[metric].label} per ${range === 'today' ? 'hour' : range === '90d' ? 'week' : range === '12m' ? 'month' : 'day'}.`}
        </ChartNote>
      </Panel>

      <Grid cols={2}>
        {/* --------------------------- Today ------------------------------ */}
        <Panel title="Today" subtitle={`Movement across the platform on ${today.date}.`}>
          <div className="astats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 120px), 1fr))' }}>
            {TODAY_ROWS.map((row) => (
              <div key={row.label} className="stat" style={{ padding: 'var(--sp-3)' }}>
                <span className="stat__label">{row.label}</span>
                <span className="stat__value" style={{ fontSize: '1.3rem' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* ------------------------- Vitoria split ------------------------- */}
        <Panel
          title="Vitoria today"
          subtitle="How much the concierge handled on her own."
          actions={<Button to="/admin/vitoria" size="sm" variant="ghost" iconRight="arrowRight">Details</Button>}
        >
          <Donut
            segments={[
              { label: 'Handled automatically', value: Math.round(t.conversations * 0.964), tone: 'sea' },
              { label: 'Escalated to the team', value: Math.round(t.conversations * 0.036), tone: 'sand' },
            ]}
            centerLabel="Automated"
            centerValue="96.4%"
          />
          <ChartNote>
            {formatNumber(t.conversations)} conversations in total. An escalation is not a failure —
            it is Vitoria correctly deciding a human should answer.
          </ChartNote>
        </Panel>
      </Grid>

      <Grid cols={2}>
        {/* ------------------------ Referral traffic ----------------------- */}
        <Panel title="Where guests are clicking through" subtitle="Top categories by outbound interaction.">
          <RankBars
            data={[
              { label: 'Golf carts', value: 2140 },
              { label: 'Restaurants', value: 1820 },
              { label: 'Bikes', value: 1465 },
              { label: 'Beach bonfires', value: 1180, tone: 'sand' },
              { label: 'Boating', value: 940 },
              { label: 'Photography', value: 610 },
            ]}
            valueLabel="interactions"
          />
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <ReferralNote compact />
          </div>
        </Panel>

        {/* ------------------------ Recent activity ------------------------ */}
        <Panel
          title="Recent activity"
          subtitle="What the team has been doing."
          actions={<Button to="/admin/audit" size="sm" variant="ghost" iconRight="arrowRight">Audit log</Button>}
        >
          <ActivityList
            items={(activity.data ?? []).map((row) => ({
              id: row.id,
              icon: row.status === 'failed' ? 'alert' : 'check',
              title: `${row.userName} · ${row.action}`,
              body: `${row.entity} ${row.entityId}`,
              meta: formatRelative(row.at),
            }))}
            empty="No admin activity recorded yet."
          />
        </Panel>
      </Grid>
    </div>
  )
}
