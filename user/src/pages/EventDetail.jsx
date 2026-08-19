import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Button, { IconButton } from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Badge } from '../components/ui/StatusBadge'
import { MetaRow, Section, Callout, DefinitionList } from '../components/ui/Display'
import { Breadcrumbs, StickyBar } from '../components/ui/PageHeader'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState } from '../components/ui/States'
import MapPanel from '../components/map/MapPanel'
import { useApp } from '../context/AppContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as api from '../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { formatLongDate, formatDistance } from '../utils/format'
import { eventCover } from '../utils/listingImages'

/**
 * Events link out to whoever actually owns the reservation. We deliberately
 * do not build a fake internal reservation system for third-party events.
 */
export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { property } = useApp()

  const { data: event, loading, error, reload } = useAsync(() => api.getEvent(id), [id])
  useDocumentTitle(event?.title)

  useEffect(() => {
    if (event) track(ANALYTICS_EVENTS.EVENT_VIEWED, { eventId: event.id, title: event.title })
  }, [event])

  if (loading) return <SkeletonPage />
  if (error || !event) {
    return (
      <div className="page">
        <ErrorState title="We couldn’t open this event" error={error} onRetry={reload} />
        <div style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
          <Button variant="secondary" to="/events">
            Back to events
          </Button>
        </div>
      </div>
    )
  }

  const openExternal = () => {
    track(ANALYTICS_EVENTS.EVENT_LINK_CLICKED, {
      eventId: event.id,
      url: event.externalUrl,
      outbound: true,
    })
    window.open(event.externalUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="page page--flush">
      <div className="detail-hero">
        <SmartImage
          photoId={eventCover(event)}
          alt={event.title}
          className="detail-hero__media"
          width={1600}
          ratio="16x9"
          eager
        />
        <div className="detail-hero__nav">
          <IconButton icon="arrowLeft" label="Go back" variant="glass" onClick={() => navigate(-1)} />
        </div>
      </div>

      <div className="detail-body">
        <div className="home-inner">
          <Breadcrumbs
            items={[
              { label: 'Explore', to: '/explore' },
              { label: 'Events', to: '/events' },
              { label: event.title },
            ]}
          />

          <div className="detail-layout">
            <div>
              <div className="u-row u-wrap" style={{ marginBottom: 8 }}>
                <Badge tone="sand">{event.category}</Badge>
                {event.price === 'Free' && <Badge tone="ok">Free</Badge>}
                {event.distance < 1 && <Badge>Walkable</Badge>}
              </div>

              <h1 className="detail-title">{event.title}</h1>

              <div style={{ marginTop: 10 }}>
                <MetaRow
                  items={[
                    { icon: 'calendar', text: formatLongDate(event.date) },
                    { icon: 'clock', text: event.time },
                    { icon: 'mapPin', text: event.location },
                  ]}
                />
              </div>

              <p className="prose" style={{ marginTop: 'var(--sp-5)' }}>
                {event.description}
              </p>
              {event.sourceAttribution ? (
                <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)' }}>
                  {event.sourceAttribution}
                </p>
              ) : null}

              {event.tags?.length > 0 && (
                <Section title="Good to know" id="tags">
                  <div className="taglist">
                    {event.tags.map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              <Section title="Where" id="location">
                <MapPanel
                  entities={[{ ...event, kind: 'event', name: event.title }]}
                  property={property}
                  activeId={event.id}
                  showLegend={false}
                  style={{ minHeight: 260 }}
                />
                <p className="u-small u-muted" style={{ marginTop: 'var(--sp-3)' }}>
                  {[event.address, event.location].filter(Boolean).join(' · ')
                    || 'Scenic Highway 30A'}
                  {event.distance != null && property?.name
                    ? ` · ${formatDistance(event.distance)} from ${property.name}`
                    : ''}
                </p>
              </Section>
            </div>

            <aside className="detail-layout__aside">
              <div className="card card--pad">
                <h2 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Details</h2>
                <DefinitionList
                  rows={[
                    { key: 'Date', value: formatLongDate(event.date) },
                    { key: 'Time', value: event.time },
                    { key: 'Entry', value: event.price },
                    { key: 'Distance', value: formatDistance(event.distance) },
                  ]}
                />
                <div className="u-stack" style={{ marginTop: 'var(--sp-4)' }}>
                  {event.externalUrl && (
                    <Button block icon="externalLink" onClick={openExternal}>
                      {event.externalLabel ?? 'Reserve / visit website'}
                    </Button>
                  )}
                  <Button
                    block
                    variant="secondary"
                    icon="sparkles"
                    onClick={() =>
                      navigate('/vitoria', { state: { prompt: `Tell me about ${event.title}` } })
                    }
                  >
                    Ask Vitoria
                  </Button>
                </div>
              </div>

              <p className="disclosure">
                This event is run by a third party. Tickets, entry, and any reservation are handled on
                their own website — My30A simply keeps the calendar for you.
              </p>
            </aside>
          </div>

          <Callout icon="info" className="section">
            Times occasionally shift with the weather. If you’re unsure on the day, ask Vitoria and
            she’ll check before you drive over.
          </Callout>

          <div style={{ height: 'var(--sp-6)' }} />
        </div>

        <StickyBar className="detail-sticky">
          {event.externalUrl && (
            <Button icon="externalLink" onClick={openExternal}>
              Learn more
            </Button>
          )}
          <Button
            variant="secondary"
            icon="sparkles"
            onClick={() => navigate('/vitoria', { state: { prompt: `Tell me about ${event.title}` } })}
          >
            Ask Vitoria
          </Button>
        </StickyBar>
      </div>
    </div>
  )
}
