import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Section, ScrollRow, Callout } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import StatusBadge from '../components/ui/StatusBadge'
import ExperienceTile from '../components/cards/ExperienceTile'
import RecommendationCard from '../components/cards/RecommendationCard'
import { RestaurantCard } from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import ContextRail from '../components/ContextRail'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { experiences } from '../data/mockExperiences'
import { quickActions } from '../data/mockCategories'
import { cx, formatDate, stayPhase, formatShortDate, formatDateRange } from '../utils/format'

const ACTIVE = ['pending', 'confirmed', 'shopping', 'on_the_way', 'payment_required', 'scheduled']

/**
 * In-app home at `/discover`.
 *
 * This is the screen a guest lands on *after* stepping in from the public
 * site — so it opens with their stay, not with a sales pitch. The marketing
 * hero, the video and the service catalogue all live on `/` instead.
 */
export default function Discover() {
  const { guest, property, hasGuest, account } = useApp()
  useDocumentTitle('Home')

  const stay = guest?.stay ?? null
  const recs = useAsync(() => api.getRecommendations(), [], { skip: !hasGuest })
  const orders = useAsync(() => api.getOrders(), [], { skip: !hasGuest })
  const restaurants = useAsync(() => api.getRestaurants({ sort: 'distance' }), [])
  const events = useAsync(() => api.getEvents(), [])

  const phase = stayPhase(stay)
  const activeOrders = useMemo(
    () => (Array.isArray(orders.data) ? orders.data : []).filter((o) => ACTIVE.includes(o.status)),
    [orders.data],
  )
  const picks = useMemo(
    () => (Array.isArray(recs.data) ? recs.data : []).filter((rec) => rec && (rec.reason || rec.name || rec.title)),
    [recs.data],
  )

  return (
    <div className={cx('page page--flush', hasGuest && 'page--railed')}>
      <div className="page__main">
        {/* --------------------------- Stay header --------------------------- */}
        {hasGuest && stay ? (
          <header className="hero" style={{ minHeight: 260 }}>
            <div className="hero__media" aria-hidden="true">
              <SmartImage photoId={property?.heroImage} alt="" fill width={1400} eager />
            </div>
            <div className="hero__scrim" aria-hidden="true" />

            <div className="hero__topbar">
              <span />
            </div>

            <div className="hero__inner">
              <p className="hero__eyebrow">{phase.label}</p>
              <h1 className="hero__title" style={{ fontSize: 'var(--fs-h1)' }}>
                Welcome back, {guest?.firstName ?? account?.firstName ?? 'there'}
              </h1>
              <p className="hero__sub">{property?.name}</p>

              <div className="hero__facts">
                <div className="hero__fact">
                  <span className="hero__fact-k">Your stay</span>
                  <span className="hero__fact-v">
                    {formatDateRange(stay.checkInDate, stay.checkOutDate) || 'Dates to confirm'}
                  </span>
                </div>
                <div className="hero__fact">
                  <span className="hero__fact-k">Check-in</span>
                  <span className="hero__fact-v">
                    {formatDate(stay.checkInDate) || '—'}
                    {property?.checkIn ? ` · ${property.checkIn}` : ''}
                  </span>
                </div>
                <div className="hero__fact">
                  <span className="hero__fact-k">WiFi</span>
                  <span className="hero__fact-v">{property?.wifi?.network ?? 'In your stay details'}</span>
                </div>
              </div>
            </div>
          </header>
        ) : (
          <div className="home-inner" style={{ paddingTop: 'var(--sp-5)' }}>
            <Callout icon="key">
              <strong style={{ display: 'block', marginBottom: 2 }}>
                Hello {account?.firstName ?? 'there'} — no stay linked yet
              </strong>
              Add your property with the code your host sent and this becomes your stay: WiFi, door
              code, groceries, transfers and a concierge who knows the house.
              <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-3)' }}>
                <Button size="sm" to="/access" icon="key">
                  Enter your code
                </Button>
                <Button size="sm" variant="secondary" to="/explore" icon="compass">
                  Explore 30A meanwhile
                </Button>
              </div>
            </Callout>
          </div>
        )}

        <div className="home-inner">
          <Link to="/vitoria" className={hasGuest ? 'ask-card ask-card--overlap' : 'ask-card'}>
            <span className="ask-card__mark" aria-hidden="true">
              <Icon name="sparkles" />
            </span>
            <span className="ask-card__text">
              <span className="ask-card__title">Ask Vitoria anything</span>
              <span className="ask-card__sub">Dinner, a ride, or what to do today</span>
            </span>
            <span className="ask-card__go" aria-hidden="true">
              <Icon name="arrowRight" />
            </span>
          </Link>

          {/* ------------------------ Quick actions ---------------------- */}
          <Section title="Quick actions" id="quick-actions">
            <div className="qa-grid">
              {quickActions.map((action) => (
                <Link key={action.id} to={action.to} className={`qa${action.accent ? ' qa--accent' : ''}`}>
                  <span className="qa__icon" aria-hidden="true">
                    <Icon name={action.icon} />
                  </span>
                  <span className="qa__label">{action.label}</span>
                </Link>
              ))}
            </div>
          </Section>

          {/* --------------------- In-progress services ------------------ */}
          {hasGuest && activeOrders.length > 0 && (
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

          {/* ------------------------ Personal picks --------------------- */}
          {hasGuest && (recs.loading || picks.length > 0) && (
            <Section
              title={`Picked for you, ${guest?.firstName ?? ''}`}
              subtitle="Based on your last stay and who you are travelling with"
              linkTo="/explore"
              id="picks"
            >
              {recs.loading && <SkeletonGrid count={3} columns="grid--3" />}
              {recs.error && <ErrorState error={recs.error} onRetry={recs.reload} />}
              {!recs.loading && !recs.error && (
                <ScrollRow label="Recommended for you">
                  {picks.map((rec) => (
                    <RecommendationCard key={rec.id} recommendation={rec} />
                  ))}
                </ScrollRow>
              )}
            </Section>
          )}

          {/* -------------------------- Experiences ---------------------- */}
          <Section
            title="What will you do today?"
            subtitle="Everything within reach of the house"
            linkTo="/explore"
            linkLabel="See everything"
            id="experiences"
          >
            <div className="exp-grid">
              {experiences.slice(0, 6).map((experience) => (
                <ExperienceTile key={experience.slug} experience={experience} />
              ))}
            </div>
          </Section>

          {/* ------------------------ Closest to you --------------------- */}
          <Section
            title="Closest to your door"
            subtitle="A short walk or a five-minute drive"
            linkTo="/restaurants"
            id="near"
          >
            {restaurants.loading && <SkeletonGrid count={3} columns="grid--3" />}
            {restaurants.error && <ErrorState error={restaurants.error} onRetry={restaurants.reload} />}
            {!restaurants.loading && !restaurants.error && (
              <ScrollRow label="Restaurants near you">
                {(Array.isArray(restaurants.data) ? restaurants.data : []).slice(0, 6).map((restaurant) => (
                  <RestaurantCard key={restaurant.id} item={restaurant} />
                ))}
              </ScrollRow>
            )}
          </Section>

          {/* ---------------------------- Events ------------------------- */}
          <Section title="During your stay" linkTo="/events" id="events">
            {events.loading && <SkeletonGrid count={2} columns="grid--2" />}
            {!events.loading && !events.error && (
              <div className="u-stack">
                {(Array.isArray(events.data) ? events.data : []).slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Section>

          <Callout icon="info" className="section">
            Local businesses on My30A are independent partners. We connect you with them — any booking
            or payment happens directly with the business.
          </Callout>

          <div style={{ height: 'var(--sp-6)' }} />
        </div>
      </div>

      {hasGuest && <ContextRail activeOrders={activeOrders} />}
    </div>
  )
}
