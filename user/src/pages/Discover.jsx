import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Section, ScrollRow } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import StatusBadge from '../components/ui/StatusBadge'
import ExperienceTile from '../components/cards/ExperienceTile'
import RecommendationCard from '../components/cards/RecommendationCard'
import { RestaurantCard } from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import ContextRail from '../components/ContextRail'
import SiteFooter from '../components/SiteFooter'
import { hero, PHOTO } from '../assets/images'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { experiences, experienceRoute, SPOTLIGHT_SLUGS, getExperience } from '../data/mockExperiences'
import { quickActions } from '../data/mockCategories'
import { formatDate, stayPhase, formatShortDate } from '../utils/format'

const ACTIVE = ['pending', 'confirmed', 'shopping', 'on_the_way', 'payment_required', 'scheduled']

const STATS = [
  { k: '26', v: 'miles of coast' },
  { k: '16', v: 'beach accesses' },
  { k: '19', v: 'miles of bike trail' },
  { k: '4', v: 'rare dune lakes' },
]

/**
 * The destination home.
 *
 * Public by default: anyone can land here and be sold on 30A itself. When a
 * guest has unlocked their stay, a personal strip and their in-progress
 * services slot in above the destination content rather than replacing it.
 */
export default function Discover() {
  const { guest, property, hasGuest } = useApp()
  useDocumentTitle(null)

  const recs = useAsync(() => api.getRecommendations(), [], { skip: !hasGuest })
  const orders = useAsync(() => api.getOrders(), [], { skip: !hasGuest })
  const restaurants = useAsync(() => api.getRestaurants({ sort: 'featured' }), [])
  const events = useAsync(() => api.getEvents(), [])

  const phase = stayPhase(guest?.stay)
  const activeOrders = useMemo(
    () => (orders.data ?? []).filter((o) => ACTIVE.includes(o.status)),
    [orders.data],
  )
  const spotlights = SPOTLIGHT_SLUGS.map(getExperience).filter(Boolean)

  return (
    <div className="page page--railed page--flush">
      <div className="page__main">
        {/* ------------------------------ Hero ------------------------------ */}
        <header className="dhero">
          <div className="dhero__media" aria-hidden="true">
            <img src={hero(PHOTO.heroEmerald)} alt="" />
          </div>
          <div className="dhero__scrim" aria-hidden="true" />

          <div className="dhero__inner">
            <span className="dhero__kicker">
              <Icon name="mapPin" size={13} />
              Scenic Highway 30A · Florida
            </span>

            <h1 className="dhero__title">Experience 30A like a local.</h1>
            <p className="dhero__sub">
              Sugar-white sand, a nineteen-mile bike trail, bonfires at sunset, and the people who
              make it all easy. Your vacation, your way.
            </p>

            <div className="dhero__ctas">
              <Button to="/explore" size="lg" variant="light" iconRight="arrowRight">
                Explore 30A
              </Button>
              <Button to="/vitoria" size="lg" variant="onDark" icon="sparkles">
                Meet Vitoria
              </Button>
            </div>

            <div className="dhero__stats">
              {STATS.map((stat) => (
                <div key={stat.v}>
                  <span className="dhero__stat-k">{stat.k}</span>
                  <span className="dhero__stat-v">{stat.v}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="home-inner">
          {/* -------------------- Personalised strip -------------------- */}
          {hasGuest && (
            <div className="home-float" style={{ padding: 0 }}>
              <div className="guest-strip">
                <div style={{ minWidth: 0 }}>
                  <p className="u-eyebrow">{phase.label}</p>
                  <h2 style={{ fontSize: '1.2rem' }}>Welcome back, {guest.firstName}</h2>
                  <p className="u-xs u-muted">{property?.name}</p>
                </div>

                <div className="guest-strip__facts">
                  <div className="guest-strip__fact">
                    <span className="guest-strip__k">Check-in</span>
                    <span className="guest-strip__v">
                      {formatDate(guest.stay.checkInDate)} · {property?.checkIn}
                    </span>
                  </div>
                  <div className="guest-strip__fact">
                    <span className="guest-strip__k">WiFi</span>
                    <span className="guest-strip__v">{property?.wifi?.network}</span>
                  </div>
                </div>

                <div className="u-row u-wrap">
                  <Button size="sm" to="/my-stay" icon="key">
                    My Stay
                  </Button>
                  <Button size="sm" variant="secondary" to="/vitoria" icon="sparkles">
                    Ask Vitoria
                  </Button>
                </div>
              </div>
            </div>
          )}

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

          {/* ------------------------ Experiences ------------------------ */}
          <Section
            title="What will you do today?"
            subtitle="Twelve ways to spend an afternoon on 30A"
            linkTo="/explore"
            linkLabel="See everything"
            id="experiences"
          >
            <div className="exp-grid">
              {experiences.slice(0, 8).map((experience, i) => (
                <ExperienceTile key={experience.slug} experience={experience} eager={i < 2} />
              ))}
            </div>
          </Section>

          {/* ------------------------- Spotlights ------------------------ */}
          {spotlights.map((experience, i) => (
            <Section key={experience.slug} className="section">
              <article className={`spotlight${i % 2 === 1 ? ' spotlight--flip' : ''}`}>
                <div className="spotlight__media">
                  <SmartImage
                    photoId={experience.gallery?.[0] ?? experience.image}
                    alt={experience.label}
                    ratio="4x3"
                    width={900}
                    zoom
                  />
                </div>
                <div>
                  <p className="spotlight__eyebrow">{experience.label}</p>
                  <h2 className="spotlight__title">{experience.headline}</h2>
                  <p className="spotlight__body">{experience.blurb}</p>
                  <ul className="spotlight__list">
                    {experience.highlights.map((item) => (
                      <li key={item}>
                        <Icon name="check" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-5)' }}>
                    <Button to={experienceRoute(experience)} iconRight="arrowRight">
                      Explore {experience.label.toLowerCase()}
                    </Button>
                    <Button
                      variant="ghost"
                      to="/vitoria"
                      state={{ prompt: experience.prompt }}
                      icon="sparkles"
                    >
                      Ask Vitoria
                    </Button>
                  </div>
                </div>
              </article>
            </Section>
          ))}

          {/* ---------------------- Vitoria teaser ----------------------- */}
          <div className="band">
            <div className="band__media" aria-hidden="true">
              <img src={hero(PHOTO.beachSunset)} alt="" />
            </div>
            <div className="band__inner">
              <p className="u-eyebrow" style={{ color: 'var(--sand-300)' }}>
                Your concierge
              </p>
              <h2 className="band__title">Vitoria knows this coast, and she knows your house.</h2>
              <p className="band__body">
                Which beach will be quiet this afternoon, where to eat with a seven-year-old, who to
                call for a bonfire tonight, and what your WiFi password is. Ask her anything.
              </p>
              <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-3)' }}>
                <Button to="/vitoria" variant="light" icon="sparkles">
                  Start a conversation
                </Button>
                {!hasGuest && (
                  <Button to="/access" variant="onDark" icon="key">
                    Unlock your stay
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* --------------------- Personal picks ------------------------ */}
          {hasGuest && (
            <Section
              title={`Picked for you, ${guest.firstName}`}
              subtitle="Based on your last stay and who you are travelling with"
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
          )}

          {/* ------------------------ Where to eat ----------------------- */}
          <Section
            title="Tables worth planning around"
            subtitle="From a donut truck on the square to a rooftop at golden hour"
            linkTo="/restaurants"
            id="eat"
          >
            {restaurants.loading && <SkeletonGrid count={3} columns="grid--3" />}
            {restaurants.error && <ErrorState error={restaurants.error} onRetry={restaurants.reload} />}
            {!restaurants.loading && !restaurants.error && (
              <ScrollRow label="Restaurants on 30A">
                {(restaurants.data ?? []).slice(0, 6).map((restaurant) => (
                  <RestaurantCard key={restaurant.id} item={restaurant} />
                ))}
              </ScrollRow>
            )}
          </Section>

          {/* -------------------------- Events --------------------------- */}
          <Section title="On this week" linkTo="/events" id="events">
            {events.loading && <SkeletonGrid count={2} columns="grid--2" />}
            {!events.loading && !events.error && (
              <div className="u-stack">
                {(events.data ?? []).slice(0, 3).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </Section>

          {/* --------------------- Supporting services ------------------- */}
          <Section
            title="The unglamorous bits, handled"
            subtitle="So the holiday starts the moment you land"
            id="services"
          >
            <div className="svc-pair">
              <Link to="/groceries" className="svc-card">
                <SmartImage photoId={PHOTO.groceryKitchen} alt="" fill width={800} />
                <span className="svc-card__scrim" aria-hidden="true" />
                <span className="svc-card__body">
                  <span className="svc-card__title">Arrive to a stocked kitchen</span>
                  <p>
                    Send a list and a local shopper fills the fridge before you walk in. Coffee for
                    the morning, wine for the porch.
                  </p>
                  <span className="exp-tile__go">
                    Grocery delivery
                    <Icon name="arrowRight" />
                  </span>
                </span>
              </Link>

              <Link to="/transfers" className="svc-card">
                <SmartImage photoId={PHOTO.blackCar} alt="" fill width={800} />
                <span className="svc-card__scrim" aria-hidden="true" />
                <span className="svc-card__body">
                  <span className="svc-card__title">Start the moment you land</span>
                  <p>
                    A driver waiting at baggage claim at ECP, VPS, or PNS — flight tracked, car seats
                    included, bags handled.
                  </p>
                  <span className="exp-tile__go">
                    Airport transfers
                    <Icon name="arrowRight" />
                  </span>
                </span>
              </Link>
            </div>
          </Section>

          {/* -------------------- Unlock band (public) ------------------- */}
          {!hasGuest && (
            <div className="band band--sand">
              <div className="band__inner">
                <p className="u-eyebrow">Staying on 30A?</p>
                <h2 className="band__title">Unlock your property.</h2>
                <p className="band__body">
                  Your host sends a code with your booking. Enter it once and you get your WiFi, door
                  code, check-out steps, grocery delivery, airport transfers, and a concierge who
                  already knows where you are staying.
                </p>
                <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-3)' }}>
                  <Button to="/access" icon="key">
                    Enter your code
                  </Button>
                  <Button to="/help" variant="secondary">
                    I do not have one
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------- Quick actions (guest) ------------------ */}
          {hasGuest && (
            <Section title="Quick actions" id="quick-actions">
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
          )}

          <SiteFooter />
        </div>
      </div>

      {/* The rail is stay context — it only earns its place once unlocked. */}
      {hasGuest && <ContextRail activeOrders={activeOrders} />}
    </div>
  )
}
