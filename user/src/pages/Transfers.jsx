import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Section, Callout, DefinitionList } from '../components/ui/Display'
import { SkeletonList } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { OrderCard } from '../components/cards/ServiceCard'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { PHOTO } from '../assets/images'
import { formatCurrency } from '../utils/format'

export default function Transfers() {
  useDocumentTitle('Airport transfers')
  const { data, loading, error, reload } = useAsync(() => api.getTransfers(), [])
  const airports = useAsync(() => api.getAirports(), [])
  const AIRPORTS = airports.data ?? []

  const transfers = (data ?? []).map((t) => ({
    ...t,
    kind: 'transfer',
    title: 'Airport Transfer',
    amount: t.payment?.amount ?? t.quotedPrice,
    link: `/transfers/${t.id}`,
  }))

  const upcoming = transfers.filter((t) => !['completed', 'cancelled'].includes(t.status))
  const past = transfers.filter((t) => ['completed', 'cancelled'].includes(t.status))

  return (
    <div className="page">
      <PageHeader
        title="Airport transfers"
        subtitle="Private black-car pickup from ECP, VPS, and PNS."
        back
        backTo="/services"
        breadcrumbs={[{ label: 'Services', to: '/services' }, { label: 'Transfers' }]}
        actions={
          <Button to="/transfers/new" icon="plus" size="sm">
            New transfer
          </Button>
        }
      />

      <div className="card" style={{ overflow: 'hidden' }}>
        <SmartImage photoId={PHOTO.blackCar} alt="A black SUV waiting outside a coastal home" ratio="21x9" width={1200} />
        <div className="card--pad">
          <h2 style={{ fontSize: '1.15rem' }}>Met at baggage claim, tracked to the door</h2>
          <p className="u-small u-muted" style={{ marginTop: 6, maxWidth: '58ch' }}>
            Your driver watches your flight, meets you inside with a sign, and handles the bags. Car
            seats are complimentary on request. Nothing is charged until we confirm a vehicle.
          </p>
          <div className="section" style={{ marginTop: 'var(--sp-4)' }}>
            <DefinitionList
              rows={AIRPORTS.map((airport) => ({
                key: `${airport.code} · ${airport.city} · ${airport.driveTime}`,
                value: `from ${formatCurrency(airport.basePrice)}`,
              }))}
            />
          </div>
          <Button to="/transfers/new" icon="car">
            Request a transfer
          </Button>
        </div>
      </div>

      {loading && (
        <Section title="Your transfers">
          <SkeletonList count={2} />
        </Section>
      )}
      {error && (
        <Section title="Your transfers">
          <ErrorState error={error} onRetry={reload} />
        </Section>
      )}

      {!loading && !error && (
        <>
          <Section title="Upcoming">
            {upcoming.length === 0 ? (
              <EmptyState
                icon="car"
                title="No transfers booked"
                message="Tell us your flight and we’ll have a driver waiting when you land."
                actionLabel="Request a transfer"
                actionTo="/transfers/new"
              />
            ) : (
              <div className="u-stack">
                {upcoming.map((transfer) => (
                  <OrderCard key={transfer.id} order={transfer} />
                ))}
              </div>
            )}
          </Section>

          {past.length > 0 && (
            <Section title="Past rides">
              <div className="u-stack">
                {past.map((transfer) => (
                  <OrderCard key={transfer.id} order={transfer} />
                ))}
              </div>
            </Section>
          )}
        </>
      )}

      <Callout icon="info" className="section">
        We authorise your card once a vehicle is confirmed — a hold, not a charge. The final amount is
        captured after the ride, so a flight change never costs you a cancellation fee.
      </Callout>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
