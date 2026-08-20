import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Section, Callout } from '../components/ui/Display'
import { SkeletonList } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { OrderCard } from '../components/cards/ServiceCard'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { PHOTO } from '../assets/images'
import HostServiceContact from '../components/contact/HostServiceContact'
import { serviceBookingRevealsPhone } from '../config/contact'

export default function Groceries() {
  useDocumentTitle('Grocery delivery')
  const { data, loading, error, reload } = useAsync(() => api.getGroceryOrders(), [])

  const orders = (data ?? []).map((o) => ({
    ...o,
    kind: 'grocery',
    title: 'Grocery Delivery',
    date: o.deliveryDate,
    amount: o.payment?.amount ?? o.estimatedTotal,
    link: `/groceries/${o.id}`,
  }))

  const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const past = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status))
  const canTextHost = orders.some((o) => serviceBookingRevealsPhone(o.status))

  return (
    <div className="page">
      <PageHeader
        title="Grocery delivery"
        subtitle="Send a list. We shop it and stock the kitchen before you arrive."
        back
        backTo="/services"
        breadcrumbs={[{ label: 'Services', to: '/services' }, { label: 'Groceries' }]}
        actions={
          <Button to="/groceries/new" icon="plus" size="sm">
            New request
          </Button>
        }
      />

      <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr', overflow: 'hidden' }}>
        <SmartImage photoId={PHOTO.groceryKitchen} alt="A stocked vacation rental kitchen" ratio="21x9" width={1200} />
        <div className="card--pad">
          <h2 style={{ fontSize: '1.15rem' }}>Arrive to a full kitchen</h2>
          <p className="u-small u-muted" style={{ marginTop: 6, maxWidth: '58ch' }}>
            A local shopper takes your list to Publix, The Fresh Market, or Winn-Dixie, texts you about
            substitutions, and puts everything away — cold items first. Service fee from $39 plus the
            cost of the groceries.
          </p>
          <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-4)' }}>
            <Button to="/groceries/new" icon="bag">
              Start a request
            </Button>
            <Button variant="secondary" to="/vitoria" icon="sparkles">
              Ask Vitoria to do it
            </Button>
          </div>
        </div>
      </div>

      {canTextHost && (
        <div className="section">
          <HostServiceContact service="grocery" />
        </div>
      )}

      {loading && (
        <Section title="Your requests">
          <SkeletonList count={2} />
        </Section>
      )}
      {error && (
        <Section title="Your requests">
          <ErrorState error={error} onRetry={reload} />
        </Section>
      )}

      {!loading && !error && (
        <>
          <Section title="In progress">
            {active.length === 0 ? (
              <EmptyState
                icon="bag"
                title="No grocery requests yet"
                message="Tell us what you need and we’ll have it waiting when you walk in."
                actionLabel="Create a request"
                actionTo="/groceries/new"
              />
            ) : (
              <div className="u-stack">
                {active.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </Section>

          {past.length > 0 && (
            <Section title="Past deliveries">
              <div className="u-stack">
                {past.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      <Callout icon="info" className="section">
        Groceries are charged at cost with a photo of the receipt. The service fee and delivery fee are
        shown before you submit — nothing is charged until our team confirms your request.
      </Callout>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
