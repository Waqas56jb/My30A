import { useState } from 'react'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import {
  PageHeader, Panel, Grid, Stat, Money, MockPaymentNote,
} from '../../components/common/AdminUI'
import { TrendChart, RankBars, Donut } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { PAYMENT_TYPES } from '../../data/payments'
import { series } from '../../data/analytics'
import { formatCurrency } from '../../utils/format'

/**
 * Revenue.
 *
 * Only captured payments count. An authorised-but-uncaptured transfer hold is
 * money we have permission to take, not money we have taken — counting it
 * would overstate every figure on this page.
 */
export default function RevenueAnalytics() {
  useDocumentTitle('Revenue analytics')
  const [range, setRange] = useState('30d')

  const payments = useLoad(() => api.getPayments({ pageSize: 1000 }), [])
  const refunds = useLoad(() => api.getRefunds({ pageSize: 500 }), [])

  if (payments.loading || refunds.loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (payments.error) return <ErrorState error={payments.error} onRetry={payments.reload} />

  const rows = payments.data.rows
  const captured = rows.filter((p) => p.status === 'captured')
  const authorised = rows.filter((p) => p.status === 'authorized')
  const failed = rows.filter((p) => p.status === 'failed')

  const gross = captured.reduce((sum, p) => sum + p.amount, 0)
  const refunded = refunds.data.rows
    .filter((r) => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0)
  const tips = captured.filter((p) => p.type === 'tip').reduce((sum, p) => sum + p.amount, 0)

  const byType = Object.keys(PAYMENT_TYPES).map((type) => ({
    label: PAYMENT_TYPES[type].label,
    value: captured.filter((p) => p.type === type).reduce((sum, p) => sum + p.amount, 0),
  })).sort((a, b) => b.value - a.value)

  return (
    <div className="apage">
      <PageHeader
        title="Revenue analytics"
        subtitle="Captured payments only. Card holds on upcoming transfers are excluded until the ride is completed."
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <MockPaymentNote />

      <div className="astats">
        <Stat label="Gross revenue" value={<Money amount={gross} />} icon="dollar" tone="success" />
        <Stat label="Refunds" value={<Money amount={refunded} />} icon="refresh" tone="danger" />
        <Stat label="Net revenue" value={<Money amount={gross - refunded} />} icon="checkCircle" tone="sea" />
        <Stat
          label="Tips"
          value={<Money amount={tips} />}
          icon="heart"
          tone="gold"
          hint="Passed to shoppers and drivers"
        />
      </div>

      <Panel title="Revenue over time">
        <TrendChart data={series('revenue', range)} label="Revenue" height={200} />
        <ChartNote>
          Captured payments per{' '}
          {range === 'today' ? 'hour' : range === '90d' ? 'week' : range === '12m' ? 'month' : 'day'}.
        </ChartNote>
      </Panel>

      <Grid cols={2}>
        <Panel title="Where revenue comes from">
          <RankBars
            data={byType.map((t) => ({ label: t.label, value: t.value }))}
            valueLabel=""
          />
          <ChartNote>
            {byType
              .filter((t) => t.value > 0)
              .map((t) => `${t.label} ${formatCurrency(t.value)}`)
              .join(' · ')}
          </ChartNote>
        </Panel>

        <Panel title="Payment states">
          <Donut
            segments={[
              { label: 'Captured', value: captured.length, tone: 'sea' },
              { label: 'Authorised (hold)', value: authorised.length, tone: 'sand' },
              { label: 'Failed', value: failed.length },
            ]}
            centerLabel="Captured"
            centerValue={`${((captured.length / Math.max(1, rows.length)) * 100).toFixed(0)}%`}
          />
          <ChartNote>
            A hold is not revenue. Transfers move from authorised to captured only when the ride is
            marked completed.
          </ChartNote>
        </Panel>
      </Grid>

      <Panel title="Breakdown" subtitle="Captured value by source.">
        <div className="astats">
          {byType.map((type) => (
            <div className="stat" key={type.label}>
              <span className="stat__label">{type.label}</span>
              <span className="stat__value">{formatCurrency(type.value)}</span>
              <span className="stat__hint">
                {gross ? ((type.value / gross) * 100).toFixed(1) : 0}% of gross
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
