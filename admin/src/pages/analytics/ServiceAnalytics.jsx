import { useState } from 'react'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { PageHeader, Panel, Grid, Stat, Money } from '../../components/common/AdminUI'
import { TrendChart, BarChart, Donut, RankBars } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { series } from '../../data/analytics'
import { formatNumber } from '../../utils/format'

export default function ServiceAnalytics() {
  useDocumentTitle('Service analytics')
  const [range, setRange] = useState('30d')

  const orders = useLoad(() => api.getOrders({ pageSize: 500 }), [])
  const transfers = useLoad(() => api.getTransfers({ pageSize: 500 }), [])

  if (orders.loading || transfers.loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (orders.error) return <ErrorState error={orders.error} onRetry={orders.reload} />

  const o = orders.data?.rows ?? []
  const t = transfers.data?.rows ?? []

  const deliveredOrders = o.filter((x) => x.status === 'delivered')
  const cancelledOrders = o.filter((x) => x.status === 'cancelled')
  const completedTransfers = t.filter((x) => x.status === 'completed')
  const cancelledTransfers = t.filter((x) => ['cancelled', 'no_show'].includes(x.status))

  const orderValue = deliveredOrders.reduce(
    (sum, x) => sum + (Number(x.actualAmount ?? x.estimatedAmount) || 0) + (Number(x.serviceFee) || 0),
    0,
  )
  const transferValue = completedTransfers.reduce((sum, x) => sum + (Number(x.amount) || 0), 0)
  const tips =
    deliveredOrders.reduce((sum, x) => sum + (Number(x.tipAmount) || 0), 0) +
    completedTransfers.reduce((sum, x) => sum + (Number(x.tipAmount) || 0), 0)

  const completionRate =
    (deliveredOrders.length + completedTransfers.length) / Math.max(1, o.length + t.length)
  const cancellationRate =
    (cancelledOrders.length + cancelledTransfers.length) / Math.max(1, o.length + t.length)

  const airportSplit = ['ECP', 'VPS', 'PNS'].map((code) => ({
    label: code,
    value: t.filter((x) => x.airport === code).length,
  }))

  const groceryStatuses = [
    ['pending', 'Pending'],
    ['confirmed', 'Confirmed'],
    ['paid', 'Paid'],
    ['shopping', 'Shopping'],
    ['on_the_way', 'En route'],
    ['delivered', 'Delivered'],
    ['cancelled', 'Cancelled'],
  ].map(([status, label]) => ({
    label,
    value: o.filter((x) => x.status === status).length,
  }))

  return (
    <div className="apage">
      <PageHeader
        title="Service analytics"
        subtitle="Grocery delivery and airport transfers — the two services My30A runs itself, so every step is measurable."
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <div className="astats">
        <Stat label="Grocery requests" value={o.length} icon="bag" tone="sea" />
        <Stat label="Transfer requests" value={t.length} icon="car" tone="info" />
        <Stat
          label="Completed"
          value={deliveredOrders.length + completedTransfers.length}
          icon="checkCircle"
          tone="success"
        />
        <Stat
          label="Cancelled"
          value={cancelledOrders.length + cancelledTransfers.length}
          icon="x"
          tone="danger"
        />
        <Stat label="Service revenue" value={<Money amount={orderValue + transferValue} />} icon="dollar" tone="success" />
        <Stat
          label="Average order value"
          value={
            <Money
              amount={
                deliveredOrders.length ? Math.round(orderValue / deliveredOrders.length) : 0
              }
            />
          }
          icon="chart"
          tone="sea"
        />
        <Stat label="Tips" value={<Money amount={tips} />} icon="heart" tone="gold" />
        <Stat
          label="Completion rate"
          value={`${(completionRate * 100).toFixed(1)}%`}
          icon="checkCircle"
          tone="success"
          hint={`${(cancellationRate * 100).toFixed(1)}% cancelled`}
        />
      </div>

      <Panel title="Requests over time">
        <TrendChart data={series('requests', range)} label="Service requests" height={190} />
        <ChartNote>
          Grocery and transfer requests combined, per{' '}
          {range === 'today' ? 'hour' : range === '90d' ? 'week' : range === '12m' ? 'month' : 'day'}.
        </ChartNote>
      </Panel>

      <Grid cols={2}>
        <Panel title="Grocery orders by status">
          <BarChart data={groceryStatuses} label="Grocery orders by status" height={180} />
        </Panel>

        <Panel title="Completion vs cancellation">
          <Donut
            segments={[
              { label: 'Completed', value: deliveredOrders.length + completedTransfers.length, tone: 'sea' },
              { label: 'Cancelled', value: cancelledOrders.length + cancelledTransfers.length, tone: 'sand' },
              {
                label: 'In flight',
                value:
                  o.length + t.length -
                  (deliveredOrders.length + completedTransfers.length + cancelledOrders.length + cancelledTransfers.length),
              },
            ]}
            centerLabel="Completed"
            centerValue={`${(completionRate * 100).toFixed(0)}%`}
          />
        </Panel>
      </Grid>

      <Grid cols={2}>
        <Panel title="Transfers by airport">
          <RankBars data={airportSplit} valueLabel="transfers" />
          <ChartNote>ECP is the closest at about 45 minutes; PNS is a 1h40 drive.</ChartNote>
        </Panel>

        <Panel title="Service split">
          <RankBars
            data={[
              { label: 'Grocery delivery', value: o.length },
              { label: 'Airport transfers', value: t.length, tone: 'sand' },
            ]}
            valueLabel="requests"
          />
          <ChartNote>
            {formatNumber(t.filter((x) => x.createdBy === 'vitoria').length)} of the transfer
            requests were raised by Vitoria rather than filled in by the guest.
          </ChartNote>
        </Panel>
      </Grid>
    </div>
  )
}
