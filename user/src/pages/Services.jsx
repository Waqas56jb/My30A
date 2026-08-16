import { useMemo, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import { Segmented } from '../components/ui/Form'
import { Section, Callout } from '../components/ui/Display'
import { SkeletonGrid, SkeletonList } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import ServiceCard, { OrderCard } from '../components/cards/ServiceCard'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { conciergeServices } from '../data/mockCategories'

const ACTIVE = ['pending', 'confirmed', 'shopping', 'on_the_way', 'payment_required', 'scheduled', 'external']

/**
 * Services hub: what My30A can arrange, plus everything the guest has already
 * requested. Partner referrals appear here too, clearly marked as external.
 */
export default function Services() {
  const [tab, setTab] = useState('active')
  useDocumentTitle('Services')

  const catalogue = useAsync(async () => conciergeServices, [])
  const orders = useAsync(() => api.getOrders(), [])

  const { active, past } = useMemo(() => {
    const list = orders.data ?? []
    return {
      active: list.filter((o) => ACTIVE.includes(o.status)),
      past: list.filter((o) => !ACTIVE.includes(o.status)),
    }
  }, [orders.data])

  const visible = tab === 'active' ? active : past

  return (
    <div className="page">
      <PageHeader
        title="Services"
        subtitle="Groceries, transfers, and the local partners we trust."
      />

      <Section title="Arrange something" subtitle="Requests go straight to our concierge team">
        {catalogue.loading ? (
          <SkeletonGrid count={4} columns="grid--3" />
        ) : (
          <div className="grid grid--3">
            {(catalogue.data ?? []).map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="My services"
        subtitle="Everything you’ve requested during this trip"
        linkTo="/notifications"
        linkLabel="Updates"
      >
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Segmented
            value={tab}
            onChange={setTab}
            label="Filter services"
            options={[
              { value: 'active', label: `Active (${active.length})` },
              { value: 'past', label: `Past (${past.length})` },
            ]}
          />
        </div>

        {orders.loading && <SkeletonList count={3} />}
        {orders.error && <ErrorState error={orders.error} onRetry={orders.reload} />}

        {!orders.loading && !orders.error && visible.length === 0 && (
          <EmptyState
            icon={tab === 'active' ? 'bell' : 'clock'}
            title={tab === 'active' ? 'Nothing in progress' : 'No past services yet'}
            message={
              tab === 'active'
                ? 'Ask Vitoria to stock the kitchen or arrange your airport pickup and it will show up here.'
                : 'Once a request is completed it moves here so you can find the receipt.'
            }
            actionLabel="Stock the kitchen"
            actionTo="/groceries/new"
            secondaryLabel="Ask Vitoria"
            secondaryTo="/vitoria"
          />
        )}

        {!orders.loading && !orders.error && visible.length > 0 && (
          <div className="u-stack">
            {visible.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </Section>

      <Callout icon="info" className="section">
        Grocery delivery and airport transfers are fulfilled by My30A. Everything marked{' '}
        <strong>local partner</strong> is booked and paid directly with that business — we only make
        the introduction.
      </Callout>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
