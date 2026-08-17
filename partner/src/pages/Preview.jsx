import { useState } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Segmented } from '../components/ui/Form'
import { Callout } from '../components/ui/Display'
import { Panel, StatusPill, TrackingCard } from '../components/PartnerUI'
import ListingPreview from '../components/ListingPreview'
import { usePartner } from '../context/PartnerContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatRelative } from '../utils/format'

const CHANNELS = {
  phone: { label: 'Phone click', note: 'On a guest device this opens the dialler with your number.' },
  website: { label: 'Website click', note: 'On a guest device this opens your site in a new tab.' },
  directions: { label: 'Directions click', note: 'On a guest device this opens their maps app.' },
}

/**
 * The listing exactly as a guest sees it, plus a live demonstration of what
 * gets recorded when they tap. Tapping here does not open anything — it shows
 * the event that would be logged, which is the clearest way to explain the
 * business model without a wall of text.
 */
export default function Preview() {
  const { partner } = usePartner()
  const [device, setDevice] = useState('phone')
  const [events, setEvents] = useState([])
  useDocumentTitle('Listing preview')

  if (!partner) return null
  const live = partner.status === 'approved'

  const record = (channel) => {
    setEvents((list) =>
      [
        {
          id: `${channel}-${list.length}-${Date.now()}`,
          channel,
          at: new Date().toISOString(),
        },
        ...list,
      ].slice(0, 6),
    )
  }

  return (
    <div className="ppage">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Listing preview</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            Exactly what a guest sees when they find you on My30A.
          </p>
        </div>
        <div className="prow">
          <StatusPill status={partner.status} />
          <Segmented
            value={device}
            onChange={setDevice}
            label="Preview device"
            options={[
              { value: 'phone', label: 'Phone', icon: 'phone' },
              { value: 'desktop', label: 'Desktop', icon: 'grid' },
            ]}
          />
        </div>
      </header>

      {!live && (
        <Callout icon={partner.status === 'pending' ? 'clock' : 'alert'} className="psection" style={{ marginTop: 0 }}>
          This is how your listing will look. Guests cannot see it yet because your listing is{' '}
          {partner.status === 'pending' ? 'still being reviewed' : `currently ${partner.status}`}.
        </Callout>
      )}

      <div className="pgrid pgrid--main-aside">
        <div>
          {device === 'phone' ? (
            <div className="phone">
              <div className="phone__screen">
                <ListingPreview partner={partner} interactive onOutbound={record} />
              </div>
            </div>
          ) : (
            <ListingPreview partner={partner} interactive onOutbound={record} />
          )}
        </div>

        <div className="pstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel
            title="Try tapping a button"
            subtitle="See what My30A records when a guest connects with you"
            flush
          >
            {events.length === 0 ? (
              <div style={{ padding: 'var(--sp-5)' }}>
                <p className="u-small u-muted" style={{ lineHeight: 1.65 }}>
                  Tap <strong>Call</strong>, <strong>Website</strong> or <strong>Directions</strong> on
                  the preview. Nothing will open — instead we will show you the single event that gets
                  logged, and nothing more.
                </p>
              </div>
            ) : (
              <div>
                {events.map((event) => (
                  <div key={event.id} className="notif">
                    <span className="notif__icon" aria-hidden="true">
                      <Icon
                        name={event.channel === 'phone' ? 'phone' : event.channel === 'website' ? 'globe' : 'navigation'}
                      />
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="notif__title">{CHANNELS[event.channel].label} recorded</span>
                      <span className="notif__msg">
                        <code style={{ fontSize: '0.72rem' }}>
                          {`{ partner_id: "${partner.id}", event: "${event.channel}_click" }`}
                        </code>
                      </span>
                      <span className="notif__time">
                        {CHANNELS[event.channel].note} · {formatRelative(event.at)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Then the guest leaves">
            <p className="u-small u-muted" style={{ lineHeight: 1.68 }}>
              After that tap the guest is on your website or on the phone to you, and My30A is out of
              the picture. Whatever you agree, charge, or book is entirely between you and them.
            </p>
            <p className="u-small" style={{ marginTop: 'var(--sp-3)', fontWeight: 600 }}>
              We count the introduction. You keep the customer.
            </p>
          </Panel>

          <Panel title="Where this appears">
            <ul className="track-list track-list--yes">
              {[
                'Explore 30A category pages',
                'Search results in the guest app',
                'The map, near guests staying close by',
                'Answers from Vitoria, the guest concierge',
                'Host recommendations at nearby properties',
              ].map((item) => (
                <li key={item}>
                  <Icon name="checkCircle" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Button block variant="secondary" to="/partner/photos" icon="image">
            Improve your photos
          </Button>
          <Button block variant="ghost" to="/partner/profile" icon="edit">
            Edit your details
          </Button>
        </div>
      </div>

      <div className="psection">
        <TrackingCard />
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
