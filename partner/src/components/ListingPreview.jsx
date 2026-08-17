import { useState } from 'react'
import Icon from './ui/Icon'
import SmartImage from './ui/SmartImage'
import { Badge } from './ui/StatusBadge'
import { RatingStars } from './ui/Display'
import { cx } from '../utils/format'

/**
 * The guest-facing listing, rendered from live profile data.
 *
 * This is a preview, not a storefront: the three actions send the guest to the
 * partner's own phone, website, or maps app. There is deliberately no "Book"
 * button, because My30A does not sit in the middle of the transaction.
 */
export default function ListingPreview({ partner, interactive = false, onOutbound, className }) {
  const [tab, setTab] = useState('about')
  if (!partner) return null

  const cover = partner.photos?.find((photo) => photo.cover) ?? partner.photos?.[0]
  const gallery = (partner.photos ?? []).filter((photo) => photo.id !== cover?.id)
  const hasPricing = partner.showPricing && partner.startingPrice

  const outbound = (channel) => {
    onOutbound?.(channel)
  }

  return (
    <article className={cx('listing', className)}>
      <div className="listing__cover">
        {cover ? (
          <SmartImage photoId={cover.image} alt={partner.businessName} ratio="16x9" width={900} eager />
        ) : (
          <div
            style={{
              aspectRatio: '16 / 9',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--surface-3)',
              color: 'var(--ink-400)',
              gap: 6,
            }}
          >
            <Icon name="image" size={26} />
            <span className="u-xs">No cover photo yet</span>
          </div>
        )}
        <div className="listing__cover-badges">
          <Badge tone="glass">{partner.category}</Badge>
          {partner.serviceArea && <Badge tone="dark">{partner.serviceArea}</Badge>}
        </div>
      </div>

      <div className="listing__tabs" role="tablist" aria-label="Listing sections">
        {[
          { key: 'about', label: 'About' },
          { key: 'photos', label: `Photos${gallery.length ? ` (${gallery.length + (cover ? 1 : 0)})` : ''}` },
          { key: 'location', label: 'Location' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className="listing__tab"
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="listing__body">
        <h1 className="listing__title">{partner.businessName || 'Your business name'}</h1>

        <div className="listing__meta">
          {partner.rating ? (
            <RatingStars value={partner.rating} count={partner.reviewCount} />
          ) : (
            <span className="u-xs u-muted">New on My30A</span>
          )}
          <span className="u-xs u-muted">{partner.category}</span>
        </div>

        {tab === 'about' && (
          <>
            <p className="listing__desc">
              {partner.description || 'Your description will appear here — tell guests what the experience feels like.'}
            </p>

            {hasPricing ? (
              <div className="listing__price">
                <span className="listing__price-label">Starting from</span>
                <span className="listing__price-value">${partner.startingPrice}</span>
                {partner.priceLabel && <span className="u-xs u-muted">{partner.priceLabel}</span>}
              </div>
            ) : (
              <div className="listing__price" style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}>
                <span className="listing__price-label" style={{ color: 'var(--ink-500)' }}>
                  Contact for pricing
                </span>
              </div>
            )}

            {partner.services?.length > 0 && (
              <div className="taglist" style={{ marginTop: 'var(--sp-4)', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {partner.services.map((service) => (
                  <span
                    key={service}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 'var(--r-pill)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--line-soft)',
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--ink-600)',
                    }}
                  >
                    {service}
                  </span>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'photos' && (
          <div
            style={{
              display: 'grid',
              gap: 'var(--sp-2)',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
              marginTop: 'var(--sp-4)',
            }}
          >
            {(partner.photos ?? []).map((photo) => (
              <SmartImage
                key={photo.id}
                photoId={photo.image}
                alt={photo.name}
                ratio="4x3"
                width={320}
                style={{ borderRadius: 'var(--r-sm)' }}
              />
            ))}
            {(partner.photos ?? []).length === 0 && (
              <p className="u-small u-muted">No photos yet.</p>
            )}
          </div>
        )}

        {tab === 'location' && (
          <div style={{ marginTop: 'var(--sp-4)' }} className="pstack">
            <p className="u-small" style={{ color: 'var(--ink-700)' }}>
              {[partner.address, partner.city, partner.state, partner.zip].filter(Boolean).join(', ') ||
                'Add your address so guests can find you.'}
            </p>
            {partner.serviceArea && (
              <p className="u-xs u-muted">Service area: {partner.serviceArea}</p>
            )}
            {partner.hours && Object.keys(partner.hours).length > 0 && (
              <div style={{ marginTop: 'var(--sp-2)' }}>
                {Object.entries(partner.hours).map(([day, value]) => (
                  <div
                    key={day}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 'var(--sp-4)',
                      padding: '7px 0',
                      borderBottom: '1px solid var(--line-soft)',
                      fontSize: 'var(--fs-sm)',
                    }}
                  >
                    <span className="u-muted">{day}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* The three outbound actions — the whole point of the listing. */}
        <div className="listing__ctas">
          <button
            type="button"
            className="btn"
            disabled={!interactive || !partner.phone}
            onClick={() => outbound('phone')}
          >
            <Icon name="phone" />
            Call
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={!interactive || !partner.website}
            onClick={() => outbound('website')}
          >
            <Icon name="globe" />
            Website
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={!interactive}
            onClick={() => outbound('directions')}
          >
            <Icon name="navigation" />
            Directions
          </button>
        </div>

        <p className="listing__note">
          <Icon name="info" />
          <span>
            Guests connect with you directly through your website or phone. My30A does not take the
            booking or the payment — we count the tap and get out of the way.
          </span>
        </p>
      </div>
    </article>
  )
}
