import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Section, ScrollRow, Avatar, Reveal } from '../components/ui/Display'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import ExperienceTile from '../components/cards/ExperienceTile'
import { RestaurantCard } from '../components/cards/PlaceCard'
import EventCard from '../components/cards/EventCard'
import { HeroVideo, VideoPlayer } from '../components/Video'
import { VIDEO_TITLE } from '../config/video'
import { hero, img, PHOTO } from '../assets/images'
import { hostSignupUrl, partnerRegisterUrl } from '../config/portals'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { experiences, experienceRoute, SPOTLIGHT_SLUGS, getExperience } from '../data/mockExperiences'
import { howItWorks, serviceCatalogue, testimonials, heroProof, coastTowns, stayBenefits } from '../data/mockLanding'

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
  const [collection, setCollection] = useState('all')
  const [town, setTown] = useState(coastTowns[8])
  const shownExperiences = useMemo(
    () => (collection === 'all' ? experiences.slice(0, 8) : experiences.filter((item) => item.slug === collection)),
    [collection],
  )
  const collectionChips = [
    { id: 'all', label: 'All' },
    ...experiences
      .filter((item) => item.featured)
      .slice(0, 7)
      .map((item) => ({ id: item.slug, label: item.label })),
  ]
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(town.query)}&z=13&output=embed`

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <header className="dhero dhero--full dhero--editorial">
        <HeroVideo />
        <div className="dhero__scrim" aria-hidden="true" />

        <div className="dhero__inner">
          <span className="dhero__kicker">
            <Icon name="mapPin" size={13} />
            Scenic Highway 30A · Florida
          </span>

          <h1 className="dhero__title">Experience 30A like a local.</h1>
          <p className="dhero__lede">Arrive. Exhale. Settle.</p>
          <p className="dhero__sub">
            Sugar-white sand, a nineteen-mile bike trail, bonfires at sunset, and the people who make
            it all effortless. Your vacation, your way.
          </p>

          <div className="so-bar" role="navigation" aria-label="Start your stay">
            <Link
              to={isAuthed ? '/explore' : '/login'}
              state={isAuthed ? undefined : { from: '/explore' }}
              className="so-bar__item"
            >
              <span>Explore</span>
              <strong>Beaches, carts &amp; tables</strong>
            </Link>
            <Link
              to={isAuthed ? '/vitoria' : '/login'}
              state={isAuthed ? undefined : { from: '/vitoria' }}
              className="so-bar__item"
            >
              <span>Concierge</span>
              <strong>Ask Vitoria</strong>
            </Link>
            <Link to={isAuthed ? '/discover' : '/signup'} className="so-bar__cta">
              {isAuthed ? 'Go to my stay' : 'Unlock stay'}
            </Link>
          </div>

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

          <p className="so-trust">Loved by guests along 30A — a concierge for every stay</p>

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

        <Reveal>
          <article className="so-about">
            <div className="so-about__media">
              <SmartImage photoId={PHOTO.houseWhite} alt="Alys Beach-style coastal home" ratio="4x5" width={900} />
            </div>
            <div className="so-about__copy">
              <p className="spotlight__eyebrow">This coast</p>
              <h2 className="so-about__title">Luxury stays along Florida&apos;s 30A — with a concierge who already lives here.</h2>
              <p className="so-about__pull">Arrive. Exhale. Settle.</p>
              <p className="spotlight__body">
                Sugar-white sand, rare dune lakes, and thirteen beach towns on one road. My30A is the guest
                layer on top of that: WiFi and door codes when you walk in, Vitoria when you want a table,
                a cart, or a bonfire, and local partners who take the booking themselves.
              </p>
              <Button to="/explore" iconRight="arrowRight">
                Learn the coast
              </Button>
            </div>
          </article>
        </Reveal>

        {/* --------------------------- Experiences -------------------------- */}
        <Section
          title="Select your getaway"
          subtitle="Design-forward days. Elevated essentials. Zero friction."
          linkTo="/explore"
          linkLabel="See everything"
          id="experiences"
        >
          <div className="so-chips" role="tablist" aria-label="Collections">
            {collectionChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={collection === chip.id}
                className={`so-chip${collection === chip.id ? ' is-on' : ''}`}
                onClick={() => setCollection(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="exp-grid exp-grid--stay">
            {shownExperiences.map((experience, i) => (
              <ExperienceTile key={experience.slug} experience={experience} tall eager={i < 2} />
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

        <Reveal>
          <section className="so-map" id="map" aria-labelledby="map-title">
            <div className="so-map__copy">
              <p className="spotlight__eyebrow">Find us</p>
              <h2 className="so-map__title" id="map-title">
                Our location
              </h2>
              <p className="spotlight__body">
                Stretching 26 miles along Florida&apos;s Emerald Coast, Scenic Highway 30A connects Inlet
                Beach, Rosemary, Alys, Seagrove, WaterSound, Seaside, and the towns in between.
              </p>
              <ul className="so-map__facts">
                <li>Walkable coastal towns</li>
                <li>Rare coastal dune lakes</li>
                <li>Bike-friendly communities</li>
                <li>Uncrowded public accesses</li>
              </ul>
              <div className="so-towns" role="list">
                {coastTowns.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    role="listitem"
                    className={`so-town${town.name === item.name ? ' is-on' : ''}`}
                    onClick={() => setTown(item)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <p className="so-map__blurb">{town.line}</p>
            </div>
            <div className="so-map__frame">
              <span className="so-map__pulse" aria-hidden="true" />
              <iframe
                title={`Map of ${town.name} on 30A`}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className="so-benefits" aria-labelledby="benefits-title">
            <p className="spotlight__eyebrow">Book your stay</p>
            <h2 className="so-benefits__title" id="benefits-title">
              Benefits of staying with My30A
            </h2>
            <div className="so-benefits__grid">
              {stayBenefits.map((item) => (
                <article className="so-benefit" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>

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
        <Section title="What our guests are saying" subtitle="From stays along 30A this season" id="quotes">
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

        {/* ------------------- Become a host / Become a partner ------------------- */}
        <Section
          title="Grow with 30A"
          subtitle="List a home, or bring your business to the guests already staying here"
          id="join"
        >
          <div className="join-pair">
            <a className="join-card" href={hostSignupUrl}>
              <span className="join-card__media" aria-hidden="true">
                <SmartImage photoId={PHOTO.houseLuxury} alt="" fill width={1200} />
              </span>
              <span className="join-card__scrim" aria-hidden="true" />
              <span className="join-card__body">
                <span className="join-card__kicker">For homeowners</span>
                <span className="join-card__title">Become a host</span>
                <span className="join-card__copy">
                  Give every guest a concierge, WiFi, and door codes — without another round of texts.
                  Vitoria handles the routine so you keep the relationship.
                </span>
                <span className="join-card__perks">
                  <span>Property guide that never sleeps</span>
                  <span>Grocery &amp; transfer requests in one place</span>
                  <span>You stay in control of the stay</span>
                </span>
                <span className="join-card__cta">
                  Open the host panel
                  <Icon name="arrowUpRight" />
                </span>
              </span>
            </a>

            <a className="join-card join-card--gold" href={partnerRegisterUrl}>
              <span className="join-card__media" aria-hidden="true">
                <SmartImage photoId={PHOTO.patioLights} alt="" fill width={1200} />
              </span>
              <span className="join-card__scrim" aria-hidden="true" />
              <span className="join-card__body">
                <span className="join-card__kicker">For local businesses</span>
                <span className="join-card__title">Become a partner</span>
                <span className="join-card__copy">
                  Golf carts, bonfires, boats, spa days — guests find you inside the stay, not after
                  a Google spiral. You keep the booking. We make the introduction.
                </span>
                <span className="join-card__perks">
                  <span>Shown to guests already on 30A</span>
                  <span>You take the call and the payment</span>
                  <span>No commission on what they book</span>
                </span>
                <span className="join-card__cta">
                  Apply as a partner
                  <Icon name="arrowUpRight" />
                </span>
              </span>
            </a>
          </div>
        </Section>

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
