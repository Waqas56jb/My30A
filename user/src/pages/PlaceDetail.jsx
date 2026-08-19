import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon, { IconSolid } from '../components/ui/Icon'
import Button, { IconButton } from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Lightbox } from '../components/ui/Modal'
import { Badge } from '../components/ui/StatusBadge'
import {
  RatingStars,
  PriceDisplay,
  MetaRow,
  Section,
  Callout,
  ImageGallery,
  DefinitionList,
} from '../components/ui/Display'
import { StickyBar, Breadcrumbs } from '../components/ui/PageHeader'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import MapPanel from '../components/map/MapPanel'
import { PartnerCard } from '../components/cards/PlaceCard'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { trackPartnerView, trackPartnerClick } from '../services/analytics'
import { formatDistance, priceLevelLabel, weekdayName } from '../utils/format'
import { bookingCta, openRestaurantBooking } from '../utils/restaurantBooking'
import { placeCover } from '../utils/listingImages'
import { resolveImageSrc } from '../assets/images'

/**
 * Detail page shared by /partners/:id and /restaurants/:id.
 *
 * Partner rule: we present the business and hand the guest off — website and
 * phone are the primary CTAs, and both are tracked as outbound engagement.
 * We never imply My30A processed a partner's transaction.
 */
export default function PlaceDetail({ kind = 'partner' }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { property, isSaved, toggleSaved, pushToast } = useApp()
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })

  const { data: place, loading, error, reload } = useAsync(
    () => (kind === 'restaurant' ? api.getRestaurant(id) : api.getPartner(id)),
    [id, kind],
  )

  const related = useAsync(
    () => api.getPartners({ category: place?.category, sort: 'featured' }),
    [place?.category],
    { skip: !place || kind === 'restaurant' },
  )

  const relatedRestaurants = useAsync(() => api.getRestaurants({ sort: 'distance' }), [], {
    skip: kind !== 'restaurant',
  })

  useDocumentTitle(place?.name)

  useEffect(() => {
    if (place) trackPartnerView(place)
  }, [place])

  if (loading) return <SkeletonPage />
  if (error || !place) {
    return (
      <div className="page">
        <ErrorState
          title="We couldn’t open this listing"
          error={error}
          onRetry={reload}
        />
        <div style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
          <Button variant="secondary" to={kind === 'restaurant' ? '/restaurants' : '/partners'}>
            Back to all listings
          </Button>
        </div>
      </div>
    )
  }

  const saved = isSaved(place.id)
  const today = weekdayName()
  const gallery = (place.gallery?.length ? place.gallery : [placeCover(place)]).filter(Boolean)

  const openWebsite = () => {
    trackPartnerClick(place, 'website')
    window.open(place.website, '_blank', 'noopener,noreferrer')
  }

  const callPartner = () => {
    if (!place.phone) return
    trackPartnerClick(place, 'phone')
    window.location.href = `tel:${place.phone.replace(/[^\d+]/g, '')}`
  }

  const reserveTable = async () => {
    try {
      const booking = await api.reserveRestaurant(place.id)
      openRestaurantBooking(booking, place)
    } catch {
      openRestaurantBooking(null, place)
    }
  }

  const cta = kind === 'restaurant' ? bookingCta(place) : null

  const askVitoria = () => {
    trackPartnerClick(place, 'ask_vitoria')
    navigate('/vitoria', { state: { prompt: `Tell me about ${place.name}` } })
  }

  const share = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      pushToast({ tone: 'success', title: 'Link copied', message: place.name })
    } catch {
      /* the user dismissed the share sheet — nothing to do */
    }
  }

  const relatedList = (kind === 'restaurant' ? relatedRestaurants.data : related.data) ?? []
  const similar = relatedList.filter((item) => item.id !== place.id).slice(0, 3)

  return (
    <div className="page page--flush">
      {/* --------------------------- Hero --------------------------- */}
      <div className="detail-hero">
        <SmartImage
          photoId={placeCover(place)}
          alt={place.name}
          className="detail-hero__media"
          width={1600}
          ratio="16x9"
          eager
        />
        <div className="detail-hero__nav">
          <IconButton icon="arrowLeft" label="Go back" variant="glass" onClick={() => navigate(-1)} />
          <div className="u-row">
            <IconButton icon="arrowUpRight" label="Share this listing" variant="glass" onClick={share} />
            <button
              type="button"
              className="place-card__fav"
              aria-pressed={saved}
              aria-label={saved ? `Remove ${place.name} from saved` : `Save ${place.name}`}
              onClick={() => toggleSaved(place.id, place.name)}
            >
              {saved ? <IconSolid name="heart" /> : <Icon name="heart" />}
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------- Body --------------------------- */}
      <div className="detail-body">
        <div className="home-inner">
          <Breadcrumbs
            items={[
              { label: 'Explore', to: '/explore' },
              kind === 'restaurant'
                ? { label: 'Restaurants', to: '/restaurants' }
                : { label: 'Partners', to: '/partners' },
              { label: place.name },
            ]}
          />

          <div className="detail-layout">
            <div>
              <div className="u-row u-wrap" style={{ marginBottom: 8 }}>
                <Badge tone="sand">{place.category}</Badge>
                {place.cuisine && <Badge>{place.cuisine}</Badge>}
                {place.walkable && <Badge tone="ok">Walkable from your house</Badge>}
              </div>

              <h1 className="detail-title">{place.name}</h1>

              <div className="u-row u-wrap" style={{ marginTop: 10, gap: 'var(--sp-3)' }}>
                {place.rating && <RatingStars value={place.rating} count={place.reviewCount} />}
                <MetaRow
                  items={[
                    { icon: 'mapPin', text: place.location },
                    { icon: 'navigation', text: formatDistance(place.distance) },
                    place.priceLevel ? { icon: 'dollar', text: priceLevelLabel(place.priceLevel) } : null,
                  ].filter(Boolean)}
                />
              </div>

              {place.startingPrice ? (
                <div style={{ marginTop: 'var(--sp-4)' }}>
                  <PriceDisplay amount={place.startingPrice} unit={place.priceUnit} size="lg" />
                  <p className="u-xs u-muted" style={{ marginTop: 2 }}>
                    Pricing shown is the partner’s starting rate and may change.
                  </p>
                </div>
              ) : null}

              <p className="prose" style={{ marginTop: 'var(--sp-5)' }}>
                {place.description}
              </p>

              {place.vitoriaNote && (
                <Callout icon="sparkles" className="section">
                  <strong style={{ display: 'block', marginBottom: 2 }}>Vitoria’s note</strong>
                  {place.vitoriaNote}
                </Callout>
              )}

              {place.services?.length > 0 && (
                <Section title="What they offer" id="services">
                  <div className="taglist">
                    {place.services.map((service) => (
                      <span key={service} className="tag">
                        {service}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {gallery.length > 1 && (
                <Section title="Photos" id="gallery">
                  <ImageGallery
                    images={gallery}
                    alt={place.name}
                    onOpen={(index) => setLightbox({ open: true, index })}
                  />
                </Section>
              )}

              {place.hours && (
                <Section title="Opening hours" id="hours">
                  <div className="card card--pad">
                    <div className="hours">
                      {Object.entries(place.hours).map(([day, value]) => (
                        <div
                          key={day}
                          className={`hours__row${day === today ? ' hours__row--today' : ''}`}
                        >
                          <span className="hours__day">
                            {day}
                            {day === today ? ' · today' : ''}
                          </span>
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              )}

              <Section title="Location" id="location">
                <MapPanel
                  entities={[{ ...place, kind: kind === 'restaurant' ? 'restaurant' : 'partner' }]}
                  property={property}
                  activeId={place.id}
                  showLegend={false}
                  style={{ minHeight: 260 }}
                />
                <p className="u-small u-muted" style={{ marginTop: 'var(--sp-3)' }}>
                  {[place.address, place.location].filter(Boolean).join(' · ')
                    || 'Scenic Highway 30A'}
                  {place.distance != null && property?.name
                    ? ` · ${formatDistance(place.distance)} from ${property.name}`
                    : ''}
                </p>
              </Section>
            </div>

            {/* ------------------------- Aside ------------------------ */}
            <aside className="detail-layout__aside">
              <div className="card card--pad">
                <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Get in touch</h2>
                <DefinitionList
                  rows={[
                    { key: 'Phone', value: place.phone },
                    { key: 'Area', value: place.location },
                    place.startingPrice
                      ? { key: 'From', value: `$${place.startingPrice} ${place.priceUnit ?? ''}` }
                      : null,
                  ].filter(Boolean)}
                />
                <div className="u-stack" style={{ marginTop: 'var(--sp-4)' }}>
                  {kind === 'restaurant' ? (
                    <Button block icon={cta?.label === 'Call to reserve' ? 'phone' : 'utensils'} onClick={reserveTable}>
                      {cta.label}
                    </Button>
                  ) : (
                    <Button block icon="globe" onClick={openWebsite}>
                      Visit website
                    </Button>
                  )}
                  {!(kind === 'restaurant' && cta?.label === 'Call to reserve') && (
                    <Button block variant="secondary" icon="phone" onClick={callPartner}>
                      {kind === 'restaurant' ? 'Call restaurant' : 'Call partner'}
                    </Button>
                  )}
                  {kind === 'restaurant' && place.website ? (
                    <Button block variant="ghost" icon="globe" onClick={openWebsite}>
                      Visit website
                    </Button>
                  ) : null}
                  <Button block variant="ghost" icon="sparkles" onClick={askVitoria}>
                    Ask Vitoria about this
                  </Button>
                </div>
              </div>

              <p className="disclosure">
                {kind === 'restaurant'
                  ? cta.disclosure
                  : `${place.name} is an independent local business. My30A introduces you — reservations, availability, and payment are handled by ${place.name} directly.`}
              </p>
            </aside>
          </div>

          {similar.length > 0 && (
            <Section
              title={kind === 'restaurant' ? 'Other tables nearby' : `More ${place.category.toLowerCase()}`}
              linkTo={kind === 'restaurant' ? '/restaurants' : `/partners?category=${encodeURIComponent(place.category)}`}
            >
              <div className="grid grid--3">
                {similar.map((item) =>
                  kind === 'restaurant' ? (
                    <Link key={item.id} to={`/restaurants/${item.id}`} className="card place-card">
                      <SmartImage photoId={item.image} alt={item.name} ratio="3x2" width={520} />
                      <div className="place-card__body">
                        <h3 className="place-card__title u-clamp-2">{item.name}</h3>
                        <MetaRow items={[item.cuisine, formatDistance(item.distance)]} />
                      </div>
                    </Link>
                  ) : (
                    <PartnerCard key={item.id} item={item} />
                  ),
                )}
              </div>
            </Section>
          )}

          <div style={{ height: 'var(--sp-6)' }} />
        </div>

        {/* --------------------- Mobile sticky CTA -------------------- */}
        <StickyBar className="detail-sticky">
          {kind === 'restaurant' ? (
            <Button icon={cta?.label === 'Call to reserve' ? 'phone' : 'utensils'} onClick={reserveTable}>
              {cta.shortLabel}
            </Button>
          ) : (
            <Button icon="globe" onClick={openWebsite}>
              Website
            </Button>
          )}
          <Button variant="secondary" icon="phone" onClick={callPartner}>
            Call
          </Button>
          <IconButton
            icon="sparkles"
            label="Ask Vitoria about this partner"
            variant="filled"
            onClick={askVitoria}
          />
        </StickyBar>
      </div>

      <Lightbox
        open={lightbox.open}
        images={gallery.map((photoId) => resolveImageSrc(photoId, null, 1600, 1.4))}
        index={lightbox.index}
        alt={place.name}
        onIndexChange={(index) => setLightbox((s) => ({ ...s, index }))}
        onClose={() => setLightbox({ open: false, index: 0 })}
      />
    </div>
  )
}
