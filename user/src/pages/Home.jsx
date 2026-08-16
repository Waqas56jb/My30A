import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import Icon from '../components/ui/Icon'
import { IconButton } from '../components/ui/Button'
import { Section, ScrollRow, Callout } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { ErrorState, EmptyState } from '../components/ui/States'
import StatusBadge from '../components/ui/StatusBadge'
import CategoryCard from '../components/cards/CategoryCard'
import RecommendationCard from '../components/cards/RecommendationCard'
import { RestaurantCard } from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import ContextRail from '../components/ContextRail'
import { hero, PHOTO } from '../assets/images'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { exploreCategories, quickActions } from '../data/mockCategories'
import { homePrompts } from '../data/mockMessages'
import {
  formatDate,
  formatDateRange,
  stayPhase,
  pluralize,
  formatShortDate,
} from '../utils/format'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'shopping', 'on_the_way', 'payment_required', 'scheduled']

export default function Home() {
  const { guest, property } = useApp()
  useDocumentTitle('Home')

  const recs = useAsync(() => api.getRecommendations(), [])
  const orders = useAsync(() => api.getOrders(), [])
  const restaurants = useAsync(() => api.getRestaurants({ sort: 'distance' }), [])
  const events = useAsync(() => api.getEvents(), [])

  const phase = stayPhase(guest?.stay)
  const activeOrders = useMemo(
    () => (orders.data ?? []).filter((o) => ACTIVE_STATUSES.includes(o.status)),
    [orders.data],
  )

  return (
    <div className="page page--railed page--flush">
      <div className="page__main">
        {/* ---------------------------- Hero ---------------------------- */}
        <header className="hero">
          <div className="hero__media" aria-hidden="true">
            <img src={hero(property?.heroImage ?? PHOTO.houseWhite)} alt="" />
          </div>
          <div className="hero__scrim" aria-hidden="true" />

          <div className="hero__topbar">
            <span />
            <div className="u-row" style={{ marginLeft: 'auto' }}>
              <IconButton icon="bell" label="Notifications" to="/notifications" variant="glass" />
              <IconButton icon="user" label="Your profile" to="/profile" variant="glass" />
            </div>
          </div>

          <div className="hero__inner">
            <p className="hero__eyebrow">{property?.community ?? '30A'}</p>
            <h1 className="hero__title">Welcome to 30A, {guest?.firstName ?? 'friend'}</h1>
            <p className="hero__sub">Vitoria is here to make your stay effortless.</p>

            <div className="hero__facts">
              <div className="hero__fact">
                <span className="hero__fact-k">Check-in</span>
                <span className="hero__fact-v">
                  {formatDate(guest?.stay?.checkInDate, { month: 'short', day: 'numeric' })} ·{' '}
                  {property?.checkIn}
                </span>
              </div>
              <div className="hero__fact">
                <span className="hero__fact-k">Check-out</span>
                <span className="hero__fact-v">
                  {formatDate(guest?.stay?.checkOutDate, { month: 'short', day: 'numeric' })} ·{' '}
                  {property?.checkOut}
                </span>
              </div>
              <div className="hero__fact">
                <span className="hero__fact-k">Guests</span>
                <span className="hero__fact-v">
                  {guest?.stay?.adults} adults
                  {guest?.stay?.children ? `, ${guest.stay.children} kids` : ''}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* --------------------- Ask Vitoria (floating) ------------------ */}
        <div className="home-float">
          <Link to="/vitoria" className="ask-card">
            <span
              className="avatar avatar--md avatar--vitoria"
              aria-hidden="true"
              style={{ display: 'grid', placeItems: 'center' }}
            >
              <Icon name="sparkles" style={{ width: 20, height: 20 }} />
            </span>
            <span className="ask-card__text">
              <span className="ask-card__title">Ask Vitoria anything</span>
              <span className="ask-card__sub u-truncate">
                “{homePrompts[0]}” · “{homePrompts[2]}”
              </span>
            </span>
            <span className="ask-card__go" aria-hidden="true">
              <Icon name="arrowRight" />
            </span>
          </Link>
        </div>

        <div className="home-inner">
          {/* ------------------------ Quick actions --------------------- */}
          <Section className="section" title="Quick actions" id="quick-actions">
            <div className="qa-grid">
              {quickActions.map((action) => (
                <Link
                  key={action.id}
                  to={action.to}
                  className={`qa${action.accent ? ' qa--accent' : ''}`}
                >
                  <span className="qa__icon" aria-hidden="true">
                    <Icon name={action.icon} />
                  </span>
                  <span className="qa__label">{action.label}</span>
                </Link>
              ))}
            </div>
          </Section>

          {/* -------------------------- Your stay ----------------------- */}
          <Section title="Your stay" linkTo="/my-stay" linkLabel="Full details" id="your-stay">
            <div className="stay-card">
              <div className="u-between u-wrap">
                <div>
                  <h3 style={{ fontSize: '1.15rem' }}>{property?.name}</h3>
                  <p className="u-xs u-muted">
                    {guest?.stay && formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)}
                    {guest?.stay?.nights ? ` · ${pluralize(guest.stay.nights, 'night')}` : ''}
                  </p>
                </div>
                <span className="countdown">
                  <Icon name="clock" style={{ width: 14, height: 14 }} />
                  {phase.label}
                </span>
              </div>

              <div className="stay-grid">
                <div className="stay-item">
                  <span className="stay-item__k">
                    <Icon name="key" />
                    Check-in
                  </span>
                  <span className="stay-item__v">{property?.checkIn}</span>
                </div>
                <div className="stay-item">
                  <span className="stay-item__k">
                    <Icon name="clock" />
                    Check-out
                  </span>
                  <span className="stay-item__v">{property?.checkOut}</span>
                </div>
                <div className="stay-item">
                  <span className="stay-item__k">
                    <Icon name="wifi" />
                    WiFi
                  </span>
                  <span className="stay-item__v">{property?.wifi?.network}</span>
                </div>
                <div className="stay-item">
                  <span className="stay-item__k">
                    <Icon name="umbrella" />
                    Beach
                  </span>
                  <span className="stay-item__v">{property?.beachAccess?.walkTime}</span>
                </div>
              </div>

              <Link to="/my-stay" className="btn btn--secondary btn--sm">
                <Icon name="key" />
                Door code, parking & house rules
              </Link>
            </div>
          </Section>

          {/* ---------------------- Active services --------------------- */}
          {orders.loading && <div style={{ height: 8 }} />}
          {!orders.loading && activeOrders.length > 0 && (
            <Section title="In progress" linkTo="/services" id="in-progress">
              <div className="u-stack">
                {activeOrders.slice(0, 2).map((order) => (
                  <Link key={order.id} to={order.link} className="card order-card">
                    <span className="order-card__icon" aria-hidden="true">
                      <Icon name={order.kind === 'grocery' ? 'bag' : 'car'} />
                    </span>
                    <span className="u-grow" style={{ minWidth: 0 }}>
                      <span className="order-card__title">{order.title}</span>
                      <span className="order-card__meta">
                        {order.id} · {order.date ? formatShortDate(order.date) : 'Date to confirm'}
                      </span>
                    </span>
                    <StatusBadge kind={order.kind} status={order.status} short />
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* ------------------- Vitoria's recommendations -------------- */}
          <Section
            title="Vitoria’s picks for you"
            subtitle="Based on your last stay and who you’re travelling with"
            linkTo="/explore"
            id="picks"
          >
            {recs.loading && <SkeletonGrid count={3} columns="grid--3" />}
            {recs.error && <ErrorState error={recs.error} onRetry={recs.reload} />}
            {!recs.loading && !recs.error && (
              <ScrollRow label="Recommended for you">
                {(recs.data ?? []).map((rec) => (
                  <RecommendationCard key={rec.id} recommendation={rec} />
                ))}
              </ScrollRow>
            )}
          </Section>

          {/* -------------------------- Explore ------------------------- */}
          <Section title="Explore 30A" linkTo="/explore" id="explore">
            <div className="grid grid--4">
              {exploreCategories.slice(0, 8).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          </Section>

          {/* ------------------------ Near the house -------------------- */}
          <Section
            title="Closest to your door"
            subtitle="Everything here is a short walk or a five-minute drive"
            linkTo="/restaurants"
            id="near"
          >
            {restaurants.loading && <SkeletonGrid count={3} columns="grid--3" />}
            {restaurants.error && <ErrorState error={restaurants.error} onRetry={restaurants.reload} />}
            {!restaurants.loading && !restaurants.error && (
              <ScrollRow label="Restaurants near you">
                {(restaurants.data ?? []).slice(0, 6).map((restaurant) => (
                  <RestaurantCard key={restaurant.id} item={restaurant} />
                ))}
              </ScrollRow>
            )}
          </Section>

          {/* --------------------------- Events ------------------------- */}
          <Section title="During your stay" linkTo="/events" id="events">
            {events.loading && <SkeletonGrid count={2} columns="grid--2" />}
            {events.error && <ErrorState error={events.error} onRetry={events.reload} />}
            {!events.loading && !events.error && (events.data ?? []).length === 0 && (
              <EmptyState
                icon="ticket"
                title="Nothing scheduled yet"
                message="We’ll add events here as they’re announced for your dates."
              />
            )}
            {!events.loading && !events.error && (events.data ?? []).length > 0 && (
              <div className="u-stack">
                {(events.data ?? []).slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Section>

          <Callout icon="info" className="section">
            Local businesses on My30A are independent partners. We connect you with them — any
            booking or payment happens directly with the business.
          </Callout>

          <div style={{ height: 'var(--sp-6)' }} />
        </div>
      </div>

      <ContextRail activeOrders={activeOrders} />
    </div>
  )
}
