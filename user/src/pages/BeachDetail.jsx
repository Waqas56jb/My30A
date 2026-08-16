import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Icon, { IconSolid } from '../components/ui/Icon'
import Button, { IconButton } from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Lightbox } from '../components/ui/Modal'
import { Badge } from '../components/ui/StatusBadge'
import {
  RatingStars,
  MetaRow,
  Section,
  Callout,
  ImageGallery,
  DefinitionList,
} from '../components/ui/Display'
import { Breadcrumbs, StickyBar } from '../components/ui/PageHeader'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import MapPanel from '../components/map/MapPanel'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { formatDistance } from '../utils/format'
import { img } from '../assets/images'
import { mockLocalConditions } from '../data/mockRecommendations'

export default function BeachDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { property, isSaved, toggleSaved } = useApp()
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })

  const { data: beach, loading, error, reload } = useAsync(() => api.getBeach(id), [id])
  useDocumentTitle(beach?.name)

  useEffect(() => {
    if (beach) track(ANALYTICS_EVENTS.BEACH_VIEWED, { beachId: beach.id, name: beach.name })
  }, [beach])

  if (loading) return <SkeletonPage />
  if (error || !beach) {
    return (
      <div className="page">
        <ErrorState title="We couldn’t open this beach" error={error} onRetry={reload} />
        <div style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
          <Button variant="secondary" to="/beaches">
            Back to the beach guide
          </Button>
        </div>
      </div>
    )
  }

  const saved = isSaved(beach.id)
  const gallery = beach.gallery?.length ? beach.gallery : [beach.image]

  return (
    <div className="page page--flush">
      <div className="detail-hero">
        <SmartImage
          photoId={beach.image}
          alt={beach.name}
          className="detail-hero__media"
          width={1600}
          ratio="16x9"
          eager
        />
        <div className="detail-hero__nav">
          <IconButton icon="arrowLeft" label="Go back" variant="glass" onClick={() => navigate(-1)} />
          <button
            type="button"
            className="place-card__fav"
            aria-pressed={saved}
            aria-label={saved ? `Remove ${beach.name} from saved` : `Save ${beach.name}`}
            onClick={() => toggleSaved(beach.id, beach.name)}
          >
            {saved ? <IconSolid name="heart" /> : <Icon name="heart" />}
          </button>
        </div>
      </div>

      <div className="detail-body">
        <div className="home-inner">
          <Breadcrumbs
            items={[
              { label: 'Explore', to: '/explore' },
              { label: 'Beaches', to: '/beaches' },
              { label: beach.name },
            ]}
          />

          <div className="detail-layout">
            <div>
              <div className="u-row u-wrap" style={{ marginBottom: 8 }}>
                <Badge tone="sand">{beach.bestFor}</Badge>
                {beach.walkTime && <Badge tone="ok">{beach.walkTime}</Badge>}
              </div>

              <h1 className="detail-title">{beach.name}</h1>

              <div className="u-row u-wrap" style={{ marginTop: 10, gap: 'var(--sp-3)' }}>
                <RatingStars value={beach.rating} count={beach.reviewCount} />
                <MetaRow
                  items={[
                    { icon: 'mapPin', text: beach.location },
                    { icon: 'navigation', text: formatDistance(beach.distance) },
                  ]}
                />
              </div>

              <p className="prose" style={{ marginTop: 'var(--sp-5)' }}>
                {beach.description}
              </p>

              {beach.vitoriaNote && (
                <Callout icon="sparkles" className="section">
                  <strong style={{ display: 'block', marginBottom: 2 }}>Vitoria’s note</strong>
                  {beach.vitoriaNote}
                </Callout>
              )}

              <Section title="What’s there" id="amenities">
                <div className="taglist">
                  {beach.amenities.map((amenity) => (
                    <span key={amenity} className="tag">
                      {amenity}
                    </span>
                  ))}
                </div>
              </Section>

              {gallery.length > 1 && (
                <Section title="Photos" id="gallery">
                  <ImageGallery
                    images={gallery}
                    alt={beach.name}
                    onOpen={(index) => setLightbox({ open: true, index })}
                  />
                </Section>
              )}

              <Section title="Getting there" id="location">
                <MapPanel
                  entities={[{ ...beach, kind: 'beach' }]}
                  property={property}
                  activeId={beach.id}
                  showLegend={false}
                  style={{ minHeight: 260 }}
                />
                <p className="u-small u-muted" style={{ marginTop: 'var(--sp-3)' }}>
                  {beach.address}
                </p>
              </Section>
            </div>

            <aside className="detail-layout__aside">
              <div className="card card--pad">
                <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Practical detail</h2>
                <DefinitionList
                  rows={[
                    { key: 'Distance', value: formatDistance(beach.distance) },
                    { key: 'Getting there', value: beach.walkTime },
                    { key: 'Parking', value: beach.parking },
                    { key: 'Best for', value: beach.bestFor },
                  ]}
                />
              </div>

              <div className="card card--pad">
                <h2 style={{ fontSize: '1.05rem', marginBottom: 10 }}>Conditions today</h2>
                <div className="flag-row">
                  <span
                    className="flag-swatch"
                    style={{ background: mockLocalConditions.beachFlag.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="u-small" style={{ fontWeight: 600 }}>
                      {mockLocalConditions.beachFlag.label}
                    </div>
                    <div className="u-xs u-muted">{mockLocalConditions.beachFlag.meaning}</div>
                  </div>
                </div>
                <p className="u-xs u-muted" style={{ marginTop: 10 }}>
                  Water {mockLocalConditions.water.tempF}° · {mockLocalConditions.water.surf}
                  <br />
                  {mockLocalConditions.tide}
                </p>
              </div>
            </aside>
          </div>

          <div style={{ height: 'var(--sp-6)' }} />
        </div>

        <StickyBar className="detail-sticky">
          <Button
            icon="sparkles"
            onClick={() => navigate('/vitoria', { state: { prompt: `Tell me about ${beach.name}` } })}
          >
            Ask Vitoria
          </Button>
          <Button variant="secondary" icon="map" to="/map">
            Open map
          </Button>
        </StickyBar>
      </div>

      <Lightbox
        open={lightbox.open}
        images={gallery.map((photoId) => img(photoId, 1600, 1.4))}
        index={lightbox.index}
        alt={beach.name}
        onIndexChange={(index) => setLightbox((s) => ({ ...s, index }))}
        onClose={() => setLightbox({ open: false, index: 0 })}
      />
    </div>
  )
}
