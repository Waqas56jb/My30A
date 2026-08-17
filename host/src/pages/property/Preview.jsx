import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import SmartImage from '../../components/ui/SmartImage'
import { Segmented } from '../../components/ui/Form'
import { Callout } from '../../components/ui/Display'
import { Panel } from '../../components/HostUI'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useAsync } from '../../hooks/useAsync'
import * as recommendationService from '../../services/recommendationService'

/**
 * "Preview as guest".
 *
 * A faithful representation of the guest app's property layer rendered from
 * the same data a guest would receive — not a screenshot, and not the guest
 * app embedded. The public 30A content is represented rather than duplicated,
 * because the host panel should not become a second copy of the guest app.
 */
export default function PropertyPreview() {
  const { property } = useOutletContext()
  const { recommendationCount } = useWorkspace()
  const [view, setView] = useState('guest')
  const [revealed, setRevealed] = useState(false)

  const recs = useAsync(
    () => recommendationService.listRecommendations({ propertyId: property.id }),
    [property.id],
  )

  const rules = useMemo(() => (property.rules ?? []).filter((rule) => rule.enabled), [property.rules])
  const featured = (recs.data ?? []).filter((rec) => rec.featured).slice(0, 3)
  const isPublic = view === 'public'

  return (
    <div className="preview-wrap">
      <div>
        <div className="u-between u-wrap" style={{ marginBottom: 'var(--sp-4)', gap: 'var(--sp-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--fs-h3)' }}>Preview</h2>
            <p className="u-xs u-muted">Exactly what your guest sees when they open the link.</p>
          </div>
          <Segmented
            value={view}
            onChange={setView}
            label="Preview audience"
            options={[
              { value: 'guest', label: 'Your guest', icon: 'key' },
              { value: 'public', label: 'Public visitor', icon: 'globe' },
            ]}
          />
        </div>

        <div className="phone">
          <div className="phone__screen">
            {/* ------------------------- Hero ------------------------- */}
            <div className="phone__hero">
              <SmartImage photoId={property.coverImage} alt="" fill width={640} />
              <span className="phone__scrim" aria-hidden="true" />
              <div className="phone__hero-body">
                <p className="u-eyebrow" style={{ color: 'rgba(255,255,255,.75)' }}>
                  {isPublic ? 'Scenic Highway 30A' : property.community || property.city}
                </p>
                <h3 style={{ color: '#fff', fontSize: '1.3rem', lineHeight: 1.15 }}>
                  {isPublic ? 'Experience 30A like a local.' : `Welcome to ${property.name}`}
                </h3>
              </div>
            </div>

            {/* ----------------------- Vitoria ------------------------ */}
            <div className="phone__section">
              <div className="phone__vitoria">
                <span
                  className="avatar avatar--sm avatar--vitoria"
                  aria-hidden="true"
                  style={{ display: 'grid', placeItems: 'center' }}
                >
                  <Icon name="sparkles" size={15} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="u-small" style={{ fontWeight: 600 }}>
                    Vitoria
                  </div>
                  <p className="u-xs u-muted" style={{ marginTop: 2, lineHeight: 1.55 }}>
                    {isPublic
                      ? 'Ask me anything about 30A — beaches, restaurants, bonfires, bikes.'
                      : property.branding.welcomeMessage ||
                        `Welcome to ${property.name}! I'm Vitoria, your local 30A concierge.`}
                  </p>
                </div>
              </div>
            </div>

            {/* --------------------- Private layer --------------------- */}
            {isPublic ? (
              <div className="phone__section">
                <span className="phone__label">Your stay</span>
                <div
                  style={{
                    marginTop: 8,
                    padding: 'var(--sp-4)',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--sand-100)',
                    border: '1px solid var(--sand-300)',
                    textAlign: 'center',
                  }}
                >
                  <Icon name="lock" size={18} style={{ color: 'var(--sand-700)' }} />
                  <p className="u-small" style={{ fontWeight: 600, marginTop: 6 }}>
                    Unlock your stay
                  </p>
                  <p className="u-xs u-muted" style={{ marginTop: 2 }}>
                    WiFi, door code and house rules appear once a guest enters your access code.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="phone__section">
                  <span className="phone__label">Essentials</span>
                  <div className="stay-grid" style={{ marginTop: 8 }}>
                    <div className="stay-item">
                      <span className="stay-item__k">
                        <Icon name="wifi" size={12} /> WiFi
                      </span>
                      <span className="stay-item__v">{property.wifi.network || 'Not set'}</span>
                    </div>
                    <div className="stay-item">
                      <span className="stay-item__k">
                        <Icon name="lock" size={12} /> Password
                      </span>
                      <span className="stay-item__v" style={{ fontFamily: 'ui-monospace, monospace' }}>
                        {property.wifi.password ? (revealed ? property.wifi.password : '••••••••') : 'Not set'}
                      </span>
                    </div>
                    <div className="stay-item">
                      <span className="stay-item__k">
                        <Icon name="key" size={12} /> Check-in
                      </span>
                      <span className="stay-item__v">{property.checkIn.time}</span>
                    </div>
                    <div className="stay-item">
                      <span className="stay-item__k">
                        <Icon name="clock" size={12} /> Check-out
                      </span>
                      <span className="stay-item__v">{property.checkOut.time}</span>
                    </div>
                  </div>
                  {property.wifi.password && (
                    <button
                      type="button"
                      className="u-xs"
                      style={{ color: 'var(--sea-700)', fontWeight: 600, marginTop: 10 }}
                      onClick={() => setRevealed((v) => !v)}
                    >
                      {revealed ? 'Hide password' : 'Show password'}
                    </button>
                  )}
                </div>

                <div className="phone__section">
                  <span className="phone__label">Getting in</span>
                  <p className="u-small" style={{ marginTop: 6, color: 'var(--ink-600)', lineHeight: 1.6 }}>
                    {property.checkIn.arrival || 'Add arrival instructions so this is not blank for guests.'}
                  </p>
                  {property.checkIn.doorCode && (
                    <p className="u-small" style={{ marginTop: 8 }}>
                      <strong>Door code:</strong>{' '}
                      <span style={{ fontFamily: 'ui-monospace, monospace' }}>
                        {revealed ? property.checkIn.doorCode : '••••'}
                      </span>
                    </p>
                  )}
                </div>

                {rules.length > 0 && (
                  <div className="phone__section">
                    <span className="phone__label">House rules</span>
                    <ul className="hstack" style={{ gap: 6, marginTop: 8 }}>
                      {rules.slice(0, 4).map((rule) => (
                        <li key={rule.id} className="u-row" style={{ alignItems: 'flex-start', gap: 8 }}>
                          <Icon name="check" size={14} style={{ color: 'var(--sea-500)', flex: 'none', marginTop: 3 }} />
                          <span className="u-xs u-muted">{rule.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {featured.length > 0 && (
                  <div className="phone__section">
                    <span className="phone__label">{property.name} favourites</span>
                    <div className="hstack" style={{ gap: 8, marginTop: 8 }}>
                      {featured.map((rec) => (
                        <div key={rec.id} className="phone__vitoria" style={{ alignItems: 'center' }}>
                          <span
                            style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flex: 'none' }}
                            aria-hidden="true"
                          >
                            <SmartImage photoId={rec.image} alt="" ratio="1x1" width={120} />
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="u-small" style={{ fontWeight: 600 }}>
                              {rec.name}
                            </div>
                            <div className="u-xs u-muted u-truncate">{rec.hostNote}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ------------------------ Explore ------------------------ */}
            <div className="phone__section" style={{ borderBottom: 0 }}>
              <span className="phone__label">Explore 30A</span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginTop: 8,
                }}
              >
                {[
                  { icon: 'umbrella', label: 'Beaches' },
                  { icon: 'utensils', label: 'Restaurants' },
                  { icon: 'flame', label: 'Bonfires' },
                  { icon: 'car', label: 'Golf carts' },
                  { icon: 'bike', label: 'Biking' },
                  { icon: 'ticket', label: 'Events' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      padding: 10,
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--line-soft)',
                      textAlign: 'center',
                    }}
                  >
                    <Icon name={item.icon} size={17} style={{ color: 'var(--sea-700)' }} />
                    <div className="u-xs" style={{ marginTop: 4 }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
              <p className="u-xs u-muted" style={{ marginTop: 10, textAlign: 'center' }}>
                Public 30A content — the same for every visitor.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------- Side notes --------------------------- */}
      <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
        <Panel title="What this preview shows">
          <p className="u-small u-muted" style={{ lineHeight: 1.65 }}>
            This is rendered from your live property data. Switch to <strong>Public visitor</strong> to
            confirm that nothing private leaks to someone without your link.
          </p>
        </Panel>

        {(!property.wifi.network || !property.checkIn.arrival) && (
          <Callout icon="alert">
            Some essentials are still blank, and blanks are what guests text you about. Missing:{' '}
            {[!property.wifi.network && 'WiFi', !property.checkIn.arrival && 'arrival instructions']
              .filter(Boolean)
              .join(' and ')}
            .
          </Callout>
        )}

        <Panel title="Ready to share?">
          <p className="u-small u-muted">
            {recommendationCount(property.id)} local recommendations · {rules.length} house rules ·{' '}
            {property.photos.length} photos
          </p>
          <div className="hstack" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
            <Button block to={`/host/properties/${property.id}/guest-access`} icon="qr">
              Guest access
            </Button>
            <Button block variant="secondary" to={`/host/properties/${property.id}/vitoria`} icon="sparkles">
              Edit welcome message
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  )
}
