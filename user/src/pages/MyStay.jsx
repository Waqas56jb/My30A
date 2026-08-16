import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Lightbox } from '../components/ui/Modal'
import { CopyField, Avatar, ImageGallery, Section, Callout } from '../components/ui/Display'
import MapPanel from '../components/map/MapPanel'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { img } from '../assets/images'
import { formatDateRange, formatLongDate, pluralize } from '../utils/format'

/** Grouped information block with an icon header. */
function InfoBlock({ icon, title, subtitle, children }) {
  return (
    <section className="info-block">
      <header className="info-block__head">
        <span className="info-block__icon" aria-hidden="true">
          <Icon name={icon} />
        </span>
        <div>
          <h2 className="info-block__title">{title}</h2>
          {subtitle && <p className="info-block__sub">{subtitle}</p>}
        </div>
      </header>
      <div className="info-block__body">{children}</div>
    </section>
  )
}

/**
 * "My Stay" — everything the guest needs about the house itself. Presented as
 * a hospitality document rather than a settings screen.
 */
export default function MyStay() {
  const { guest, property, pushToast } = useApp()
  const navigate = useNavigate()
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })
  useDocumentTitle('My Stay')

  if (!property) return null
  const gallery = property.gallery ?? []

  return (
    <div className="page">
      <PageHeader
        title="My Stay"
        subtitle="Access, house notes, and everything your host wants you to know."
        back
        backTo="/"
      />

      {/* --------------------------- Property hero --------------------------- */}
      <div className="stay-hero">
        <SmartImage
          photoId={property.heroImage}
          alt={property.name}
          fill
          width={1400}
          eager
        />
        <span className="stay-hero__scrim" aria-hidden="true" />
        <div className="stay-hero__body">
          <p className="u-eyebrow" style={{ color: 'rgba(255,255,255,.72)' }}>
            {property.community}
          </p>
          <h2 style={{ color: '#fff', fontSize: '1.6rem' }}>{property.name}</h2>
          <p className="u-small" style={{ color: 'rgba(255,255,255,.82)', marginTop: 4 }}>
            {guest?.stay && formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)} ·{' '}
            {pluralize(guest?.stay?.nights ?? 0, 'night')} · {property.bedrooms} bed ·{' '}
            {property.bathrooms} bath · sleeps {property.sleeps}
          </p>
        </div>
      </div>

      {/* ----------------------------- Essentials ---------------------------- */}
      <Section title="Essentials" id="essentials">
        <div className="grid grid--2">
          <InfoBlock icon="wifi" title="WiFi" subtitle={property.wifi.note}>
            <CopyField
              label="Network"
              value={property.wifi.network}
              onCopied={() => pushToast({ tone: 'success', title: 'Network name copied', duration: 1800 })}
            />
            <CopyField
              label="Password"
              value={property.wifi.password}
              onCopied={() => pushToast({ tone: 'success', title: 'Password copied', duration: 1800 })}
            />
          </InfoBlock>

          <InfoBlock icon="key" title="Door & access" subtitle={property.access.method}>
            <CopyField
              label="Entry code"
              value={property.access.code}
              onCopied={() => pushToast({ tone: 'success', title: 'Code copied', duration: 1800 })}
            />
            <p className="u-small u-muted">{property.access.instructions}</p>
          </InfoBlock>
        </div>
      </Section>

      {/* ------------------------------ Arrival ------------------------------ */}
      <Section title="Arrival & departure" id="arrival">
        <div className="grid grid--2">
          <InfoBlock
            icon="arrowRight"
            title={`Check-in · ${property.checkIn}`}
            subtitle={guest?.stay ? formatLongDate(guest.stay.checkInDate) : undefined}
          >
            <ol className="steps-list">
              {property.checkInSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </InfoBlock>

          <InfoBlock
            icon="arrowLeft"
            title={`Check-out · ${property.checkOut}`}
            subtitle={guest?.stay ? formatLongDate(guest.stay.checkOutDate) : undefined}
          >
            <ol className="steps-list">
              {property.checkOutSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </InfoBlock>
        </div>
      </Section>

      {/* ------------------------- Parking & practical ----------------------- */}
      <Section title="Around the house" id="practical">
        <div className="grid grid--2">
          <InfoBlock icon="car" title="Parking">
            <p className="u-small u-muted">{property.access.parking}</p>
          </InfoBlock>
          <InfoBlock icon="trash" title="Bins & collection">
            <p className="u-small u-muted">{property.access.trash}</p>
          </InfoBlock>
          <InfoBlock icon="umbrella" title="Beach access" subtitle={property.beachAccess.walkTime}>
            <p className="u-small" style={{ fontWeight: 600 }}>
              {property.beachAccess.name}
            </p>
            <p className="u-small u-muted">{property.beachAccess.note}</p>
            <Button size="sm" variant="secondary" to="/beaches" icon="map">
              Beach guide
            </Button>
          </InfoBlock>
          <InfoBlock icon="sparkles" title="What’s included">
            <div className="taglist">
              {property.amenities.map((amenity) => (
                <span key={amenity} className="tag">
                  {amenity}
                </span>
              ))}
            </div>
          </InfoBlock>
        </div>
      </Section>

      {/* ----------------------------- House rules --------------------------- */}
      <Section title="House rules" id="rules">
        <InfoBlock icon="shield" title="Please keep in mind" subtitle="Set by your host">
          <ul className="rules-list">
            {property.houseRules.map((rule) => (
              <li key={rule}>
                <Icon name="check" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </InfoBlock>
      </Section>

      {/* ------------------------------- Photos ------------------------------ */}
      {gallery.length > 0 && (
        <Section title="The house" id="photos">
          <ImageGallery
            images={gallery}
            alt={property.name}
            onOpen={(index) => setLightbox({ open: true, index })}
          />
        </Section>
      )}

      {/* ------------------------------ Location ----------------------------- */}
      <Section title="Address" id="address">
        <MapPanel entities={[]} property={property} showLegend={false} style={{ minHeight: 240 }} />
        <p className="u-small u-muted" style={{ marginTop: 'var(--sp-3)' }}>
          {property.address}
        </p>
      </Section>

      {/* -------------------------- Host & emergency ------------------------- */}
      <Section title="Who to contact" id="contacts">
        <div className="grid grid--2">
          <InfoBlock icon="user" title="Your host" subtitle={property.host.responseTime}>
            <div className="contact-row">
              <Avatar src={img(property.host.avatar, 160, 1)} name={property.host.name} size="md" />
              <div className="u-grow">
                <div className="contact-row__name">{property.host.name}</div>
                <div className="contact-row__role">{property.host.company}</div>
              </div>
            </div>
            <div className="u-row u-wrap">
              <Button size="sm" variant="secondary" icon="phone" href={`tel:${property.host.phone}`} target="_self">
                {property.host.phone}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon="message"
                href={`mailto:${property.host.email}`}
                target="_self"
              >
                Email
              </Button>
            </div>
            <Callout icon="sparkles" tone="info">
              For most questions about the house, Vitoria will answer faster than your host.
            </Callout>
            <Button size="sm" icon="sparkles" onClick={() => navigate('/vitoria')}>
              Ask Vitoria instead
            </Button>
          </InfoBlock>

          <InfoBlock icon="alert" title="Emergency contacts" subtitle="Save these before you need them">
            <div className="dl">
              {property.emergency.map((contact) => (
                <a
                  key={contact.label}
                  className="dl__row"
                  href={`tel:${contact.value.replace(/[^\d+]/g, '')}`}
                  style={{ textDecoration: 'none' }}
                >
                  <span className="dl__key">{contact.label}</span>
                  <span className="dl__val" style={{ color: 'var(--sea-700)' }}>
                    {contact.value}
                  </span>
                </a>
              ))}
            </div>
          </InfoBlock>
        </div>
      </Section>

      <Lightbox
        open={lightbox.open}
        images={gallery.map((photoId) => img(photoId, 1600, 1.4))}
        index={lightbox.index}
        alt={property.name}
        onIndexChange={(index) => setLightbox((s) => ({ ...s, index }))}
        onClose={() => setLightbox({ open: false, index: 0 })}
      />

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
