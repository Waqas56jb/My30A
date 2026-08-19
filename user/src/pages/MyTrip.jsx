import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Segmented } from '../components/ui/Form'
import { Section, DefinitionList, Callout, Avatar } from '../components/ui/Display'
import { SkeletonList, SkeletonGrid } from '../components/ui/Skeleton'
import { EmptyState, ErrorState } from '../components/ui/States'
import { OrderCard } from '../components/cards/ServiceCard'
import PlaceCard from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import { RatingPanel } from '../components/service/PaymentPanel'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import {
  formatDateRange,
  formatLongDate,
  pluralize,
  stayPhase,
} from '../utils/format'

const ACTIVE = ['pending', 'confirmed', 'shopping', 'on_the_way', 'payment_required', 'scheduled', 'external']

const routeFor = (entity) => {
  if (!entity) return '/explore'
  if (entity.type === 'restaurant') return `/restaurants/${entity.id}`
  if (entity.type === 'beach') return `/beaches/${entity.id}`
  if (entity.title) return `/events/${entity.id}`
  return `/partners/${entity.id}`
}

/**
 * The guest's trip: stay summary, itinerary, saved places, preferences, and —
 * once the stay is over — a prompt to rate the overall experience.
 */
export default function MyTrip() {
  const { guest, property, savedIds, pushToast } = useApp()
  const [tab, setTab] = useState('upcoming')
  useDocumentTitle('My Trip')

  const orders = useAsync(() => api.getOrders(), [])
  const events = useAsync(() => api.getEvents(), [])
  const savedQuery = useAsync(() => api.getSavedPlaces(savedIds), [savedIds.join('|')])

  const phase = stayPhase(guest?.stay)
  const saved = savedQuery.data ?? []

  const { upcoming, past } = useMemo(() => {
    const list = orders.data ?? []
    return {
      upcoming: list.filter((o) => ACTIVE.includes(o.status)),
      past: list.filter((o) => !ACTIVE.includes(o.status)),
    }
  }, [orders.data])

  const visible = tab === 'upcoming' ? upcoming : past

  return (
    <div className="page">
      <PageHeader title="My Trip" subtitle="Your stay, your plans, and the places you’ve saved." />

      {/* ---------------------------- Stay summary --------------------------- */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <SmartImage
          photoId={property?.heroImage}
          alt={property?.name ?? 'Your property'}
          ratio="21x9"
          width={1200}
        />
        <div className="card--pad">
          <div className="u-between u-wrap" style={{ marginBottom: 'var(--sp-4)' }}>
            <div>
              <p className="u-eyebrow">{property?.community}</p>
              <h2 style={{ fontSize: '1.3rem' }}>{property?.name}</h2>
              <p className="u-small u-muted" style={{ marginTop: 4 }}>
                {guest?.stay && formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)} ·{' '}
                {pluralize(guest?.stay?.nights ?? 0, 'night')}
              </p>
            </div>
            <span className="countdown">
              <Icon name="clock" style={{ width: 14, height: 14 }} />
              {phase.label}
            </span>
          </div>

          <DefinitionList
            rows={[
              { key: 'Confirmation', value: guest?.stay?.confirmationCode },
              {
                key: 'Check-in',
                value: `${formatLongDate(guest?.stay?.checkInDate)} · ${property?.checkIn}`,
              },
              {
                key: 'Check-out',
                value: `${formatLongDate(guest?.stay?.checkOutDate)} · ${property?.checkOut}`,
              },
              {
                key: 'Guests',
                value: `${guest?.stay?.adults} adults${guest?.stay?.children ? `, ${guest.stay.children} children` : ''}`,
              },
            ]}
          />

          <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-4)' }}>
            <Button size="sm" to="/my-stay" icon="key">
              Stay details
            </Button>
            <Button size="sm" variant="secondary" to="/vitoria" icon="sparkles">
              Ask Vitoria
            </Button>
          </div>
        </div>
      </div>

      {/* ----------------------------- Itinerary ----------------------------- */}
      <Section title="Your services" linkTo="/services" linkLabel="Manage">
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Segmented
            value={tab}
            onChange={setTab}
            label="Filter services"
            options={[
              { value: 'upcoming', label: `Upcoming (${upcoming.length})` },
              { value: 'past', label: `Past (${past.length})` },
            ]}
          />
        </div>

        {orders.loading && <SkeletonList count={2} />}
        {orders.error && <ErrorState error={orders.error} onRetry={orders.reload} />}
        {!orders.loading && !orders.error && visible.length === 0 && (
          <EmptyState
            icon="suitcase"
            title={tab === 'upcoming' ? 'Nothing booked yet' : 'No past services'}
            message={
              tab === 'upcoming'
                ? 'Groceries, transfers, and partner bookings will appear here as you arrange them.'
                : 'Completed services move here with their receipts.'
            }
            actionLabel="Browse services"
            actionTo="/services"
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

      {/* --------------------------- Saved places ---------------------------- */}
      <Section title="Saved places" subtitle={`${saved.length} saved during this trip`} linkTo="/explore" linkLabel="Find more">
        {savedQuery.loading && <SkeletonGrid count={3} columns="grid--3" />}
        {savedQuery.error && <ErrorState error={savedQuery.error} onRetry={savedQuery.reload} />}
        {!savedQuery.loading && !savedQuery.error && saved.length === 0 ? (
          <EmptyState
            icon="heart"
            title="Nothing saved yet"
            message="Tap the heart on any restaurant, beach, or partner and it will show up here."
            actionLabel="Explore 30A"
            actionTo="/explore"
          />
        ) : !savedQuery.loading && !savedQuery.error ? (
          <div className="grid grid--3">
            {saved.map((entity) => (
              <PlaceCard
                key={entity.id}
                item={{ ...entity, name: entity.name ?? entity.title }}
                to={routeFor(entity)}
              />
            ))}
          </div>
        ) : null}
      </Section>

      {/* ---------------------------- Preferences ---------------------------- */}
      <Section title="What Vitoria remembers" linkTo="/profile" linkLabel="Edit">
        <div className="grid grid--2">
          <div className="card card--pad">
            <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Your preferences</h3>
            <div className="pref-group">
              <div className="pref-row">
                <span className="pref-row__k">Favourite cuisine</span>
                <span className="pref-row__v">
                  {(guest?.preferences?.cuisines ?? []).map((c) => (
                    <span key={c} className="tag">
                      {c}
                    </span>
                  ))}
                </span>
              </div>
              <div className="pref-row">
                <span className="pref-row__k">Dietary</span>
                <span className="pref-row__v">
                  {(guest?.preferences?.dietary ?? []).length ? (
                    guest.preferences.dietary.map((d) => (
                      <span key={d} className="tag">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className="u-xs u-muted">None recorded</span>
                  )}
                </span>
              </div>
              <div className="pref-row">
                <span className="pref-row__k">Travelling with kids</span>
                <span className="pref-row__v">
                  <span className="tag">
                    {guest?.preferences?.travelingWithKids
                      ? `Yes · ages ${guest.preferences.kidAges.join(' & ')}`
                      : 'No'}
                  </span>
                </span>
              </div>
              <div className="pref-row">
                <span className="pref-row__k">Activities</span>
                <span className="pref-row__v">
                  {(guest?.preferences?.activities ?? []).map((a) => (
                    <span key={a} className="tag">
                      {a}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div className="card card--pad">
            <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>From previous stays</h3>
            <div className="u-stack">
              {(guest?.memories ?? []).map((memory) => (
                <div key={memory.id} className="memory-card">
                  <span className="memory-card__icon" aria-hidden="true">
                    <Icon name="sparkles" />
                  </span>
                  <div>
                    <p className="u-small">{memory.note}</p>
                    <p className="u-xs u-muted" style={{ marginTop: 2 }}>
                      {memory.source}
                    </p>
                  </div>
                </div>
              ))}
              {(guest?.memories ?? []).length === 0 && (
                <p className="u-small u-muted">
                  This is your first stay with us — Vitoria will start learning what you like.
                </p>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ------------------------- Events during stay ------------------------ */}
      <Section title="Happening during your stay" linkTo="/events">
        {events.loading && <SkeletonGrid count={2} columns="grid--2" />}
        {!events.loading && (events.data ?? []).length > 0 && (
          <div className="u-stack">
            {(events.data ?? []).slice(0, 4).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </Section>

      {/* --------------------------- Stay feedback --------------------------- */}
      <Section title="Rate your stay" id="stay-rating">
        {phase.phase === 'past' || phase.phase === 'checkout_day' ? (
          <div className="card">
            <RatingPanel
              title="How was your stay on 30A?"
              onSubmit={async ({ stars, feedback }) => {
                await api.submitStayRating({ stars, feedback })
                pushToast({ tone: 'success', title: 'Thank you', message: 'Your host will see this.' })
              }}
            />
          </div>
        ) : (
          <Callout icon="star">
            We’ll ask you to rate your stay on check-out day. Anything not going well before then?
            Tell Vitoria and we’ll fix it while you’re still here.
          </Callout>
        )}
      </Section>

      <div className="u-row" style={{ justifyContent: 'center', marginTop: 'var(--sp-6)' }}>
        <Avatar src={property?.host?.avatar} name={property?.host?.name} size="sm" />
        <span className="u-xs u-muted">
          Hosted by {property?.host?.name} ·{' '}
          <Link to="/my-stay" style={{ color: 'var(--sea-700)' }}>
            contact details
          </Link>
        </span>
      </div>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
