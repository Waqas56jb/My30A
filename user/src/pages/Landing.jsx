import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Section, ScrollRow, Avatar } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import ExperienceTile from '../components/cards/ExperienceTile'
import { RestaurantCard } from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import { HeroVideo, VideoPlayer } from '../components/Video'
import { VIDEO_TITLE } from '../config/video'
import { hero, img, PHOTO } from '../assets/images'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { experiences, experienceRoute, SPOTLIGHT_SLUGS, getExperience } from '../data/mockExperiences'
import { howItWorks, serviceCatalogue, testimonials, heroProof } from '../data/mockLanding'

const STATS = [
  { k: '26', v: 'miles of coast' },
  { k: '50+', v: 'beach accesses' },
  { k: '19', v: 'miles of bike trail' },
  { k: '4', v: 'rare dune lakes' },
]

/**
 * The public landing page — a website, not a dashboard.
 *
 * Rendered inside `MarketingLayout`, so it has a real site header floating
 * over the video hero and a footer at the bottom. The app's sidebar and tab
 * bar deliberately do not exist here: a visitor arrives, is sold on 30A, and
 * only then unlocks their stay and steps into the app.
 */
export default function Landing() {
  const { hasGuest, guest, isAuthed, account } = useApp()
  useDocumentTitle(null)

  const restaurants = useAsync(() => api.getRestaurants({ sort: 'featured' }), [])
  const events = useAsync(() => api.getEvents(), [])
  const spotlights = SPOTLIGHT_SLUGS.map(getExperience).filter(Boolean)

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <header className="dhero dhero--full">
        <HeroVideo posterId={PHOTO.heroEmerald} />
        <div className="dhero__scrim" aria-hidden="true" />

        <div className="dhero__inner">
          <span className="dhero__kicker">
            <Icon name="mapPin" size={13} />
            Scenic Highway 30A · Florida
          </span>

          <h1 className="dhero__title">Experience 30A like a local.</h1>
          <p className="dhero__sub">
            Sugar-white sand, a nineteen-mile bike trail, bonfires at sunset, and the people who make
            it all effortless. Your vacation, your way.
          </p>

          <div className="dhero__ctas">
            <Button
              to={isAuthed ? '/explore' : '/login'}
              state={isAuthed ? undefined : { from: '/explore' }}
              size="lg"
              variant="light"
              iconRight="arrowRight"
            >
              Explore 30A
            </Button>
            <Button
              to={isAuthed ? '/vitoria' : '/login'}
              state={isAuthed ? undefined : { from: '/vitoria' }}
              size="lg"
              variant="onDark"
              icon="sparkles"
            >
              Meet Vitoria
            </Button>
          </div>

          <ul className="dhero__proof">
            {heroProof.map((item) => (
              <li key={item}>
                <Icon name="check" />
                {item}
              </li>
            ))}
          </ul>

          <div className="dhero__stats">
            {STATS.map((stat) => (
              <div key={stat.v}>
                <span className="dhero__stat-k">{stat.k}</span>
                <span className="dhero__stat-v">{stat.v}</span>
              </div>
            ))}
          </div>
        </div>

        <span className="dhero__scroll" aria-hidden="true">
          Scroll
          <Icon name="chevronDown" size={16} />
        </span>
      </header>

      <div className="site-section">
        {/* -------------------- Welcome back (signed in) -------------------- */}
        {isAuthed && (
          <div className="home-float" style={{ padding: 0, marginTop: 'calc(var(--sp-6) * -1)' }}>
            <div className="guest-strip">
              <div style={{ minWidth: 0 }}>
                <p className="u-eyebrow">
                  {hasGuest ? 'Your stay is unlocked' : 'You are signed in'}
                </p>
                <h2 style={{ fontSize: '1.2rem' }}>
                  Welcome back, {account?.firstName ?? guest?.firstName}
                </h2>
              </div>
              <div className="u-row u-wrap" style={{ marginLeft: 'auto' }}>
                <Button size="sm" to="/discover" iconRight="arrowRight">
                  Go to my stay
                </Button>
                <Button size="sm" variant="secondary" to="/vitoria" icon="sparkles">
                  Ask Vitoria
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------- Experiences -------------------------- */}
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

        {/* --------------------------- Spotlights --------------------------- */}
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
                  <Button variant="ghost" to="/vitoria" state={{ prompt: experience.prompt }} icon="sparkles">
                    Ask Vitoria
                  </Button>
                </div>
              </div>
            </article>
          </Section>
        ))}

        {/* ----------------------------- Watch ------------------------------ */}
        <Section id="watch" className="section video-feature">
          <div className="video-feature__head">
            <div>
              <p className="spotlight__eyebrow">Watch</p>
              <h2 className="spotlight__title" style={{ marginTop: 4 }}>
                {VIDEO_TITLE}
              </h2>
              <p className="spotlight__body" style={{ marginTop: 8 }}>
                Twenty-six miles of sugar-white sand, thirteen beach towns, and the coastal dune lakes
                in between. Turn the sound on.
              </p>
            </div>
            <Button to="/explore" variant="secondary" iconRight="arrowRight">
              Explore 30A
            </Button>
          </div>

          <VideoPlayer />

          <p className="video-feature__caption">
            <Icon name="play" size={13} />
            Press play — this one has sound.
          </p>
        </Section>

        {/* -------------------------- How it works -------------------------- */}
        <Section
          title="How it works"
          subtitle="Three steps, and none of them are downloading an app"
          id="how"
        >
          <div className="howto">
            {howItWorks.map((step) => (
              <article className="howto__card" key={step.step}>
                <span className="howto__num" aria-hidden="true">
                  {step.step}
                </span>
                <span className="howto__icon" aria-hidden="true">
                  <Icon name={step.icon} />
                </span>
                <h3 className="howto__title">{step.title}</h3>
                <p className="howto__body">{step.body}</p>
              </article>
            ))}
          </div>
        </Section>

        {/* ------------------------- Vitoria teaser ------------------------- */}
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
              {!isAuthed && (
                <Button to="/signup" variant="onDark" iconRight="arrowRight">
                  Create your account
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* --------------------------- Where to eat -------------------------- */}
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

        {/* ------------------------------ Events ----------------------------- */}
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

        {/* ------------------------ Supporting services ---------------------- */}
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
                  Send a list and a local shopper fills the fridge before you walk in. Coffee for the
                  morning, wine for the porch.
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

        {/* ------------------------ Full service list ------------------------ */}
        <Section
          title="Everything in one place"
          subtitle="Sixteen things you would otherwise be googling from the beach"
          linkTo="/explore"
          linkLabel="Browse it all"
          id="services-all"
        >
          <div className="svc-groups">
            {serviceCatalogue.map((group) => (
              <div key={group.group}>
                <p className="svc-group__label">{group.group}</p>
                {group.items.map((item) => (
                  <Link key={item.title + item.to} to={item.to} className="svc-item">
                    <span className="svc-item__icon" aria-hidden="true">
                      <Icon name={item.icon} />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="svc-item__title">{item.title}</span>
                      <span className="svc-item__line">{item.line}</span>
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </Section>

        {/* ---------------------------- Guests say --------------------------- */}
        {testimonials.length > 0 && (
        <Section title="What guests say" subtitle="From stays this summer" id="quotes">
          <div className="quotes">
            {testimonials.map((item) => (
              <figure className="quote" key={item.id}>
                <span className="quote__mark" aria-hidden="true">
                  &ldquo;
                </span>
                <blockquote className="quote__text">{item.quote}</blockquote>
                <figcaption className="quote__who">
                  <Avatar src={item.image ? img(item.image, 96, 1) : null} name={item.name} size="sm" />
                  <span style={{ minWidth: 0 }}>
                    <span className="quote__name">{item.name}</span>
                    <span className="quote__detail">{item.detail}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
        )}

        {/* ----------------------------- Final CTA --------------------------- */}
        <div className="band band--sand">
          <div className="band__inner">
            <p className="u-eyebrow">{isAuthed ? 'Your stay is ready' : 'Staying on 30A?'}</p>
            <h2 className="band__title">
              {isAuthed ? 'Everything is waiting for you.' : 'Unlock your property.'}
            </h2>
            <p className="band__body">
              {isAuthed
                ? 'Your WiFi, door code, check-out steps, grocery delivery and airport transfers are all one tap away.'
                : 'Create an account, then enter the code your host sends with your booking. You get your WiFi, door code, check-out steps, grocery delivery, airport transfers, and a concierge who already knows where you are staying.'}
            </p>
            <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-3)' }}>
              {isAuthed ? (
                <>
                  <Button to="/discover" iconRight="arrowRight">
                    Go to my stay
                  </Button>
                  <Button to="/help" variant="secondary">
                    Help &amp; contact
                  </Button>
                </>
              ) : (
                <>
                  <Button to="/signup" iconRight="arrowRight">
                    Create your account
                  </Button>
                  <Button to="/login" variant="secondary">
                    I already have one
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
