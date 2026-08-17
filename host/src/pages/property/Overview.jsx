import { useMemo } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import SmartImage from '../../components/ui/SmartImage'
import { DefinitionList, Callout } from '../../components/ui/Display'
import { Panel, SetupChecklist, Kpi } from '../../components/HostUI'
import { useWorkspace } from '../../context/WorkspaceContext'
import { setupProgress } from '../../data/properties'
import { formatDate } from '../../utils/format'

/** The at-a-glance page for one property. */
export default function PropertyOverview() {
  const { property } = useOutletContext()
  const { recommendationCount } = useWorkspace()

  const progress = useMemo(
    () => setupProgress(property, recommendationCount(property.id)),
    [property, recommendationCount],
  )

  const missing = progress.items.filter((item) => !item.done)

  return (
    <div className="hgrid hgrid--main-aside">
      <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
        {missing.length > 0 && (
          <Callout icon="alert">
            <strong style={{ display: 'block', marginBottom: 2 }}>
              {missing.length} section{missing.length === 1 ? '' : 's'} still to complete
            </strong>
            Guests will ask you directly for anything that is not in here. Next up:{' '}
            <Link
              to={`/host/properties/${property.id}/${missing[0].route}`}
              style={{ color: 'var(--sea-700)', fontWeight: 600, textDecoration: 'underline' }}
            >
              {missing[0].label}
            </Link>
            .
          </Callout>
        )}

        <div className="kpi-grid">
          <Kpi icon="users" label="Active guests" value={property.stats.activeGuests} />
          <Kpi icon="sparkles" label="Conversations" value={property.stats.conversations} />
          <Kpi
            icon="star"
            label="Satisfaction"
            value={property.stats.satisfaction ?? '—'}
            suffix={property.stats.satisfaction ? '★' : ''}
            hint={property.stats.satisfaction ? undefined : 'No ratings yet'}
          />
        </div>

        <Panel title="Property details">
          <DefinitionList
            rows={[
              { key: 'Type', value: property.type },
              {
                key: 'Address',
                value: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
              },
              {
                key: 'Size',
                value: `${property.bedrooms} bed · ${property.bathrooms} bath · sleeps ${property.maxGuests}`,
              },
              { key: 'Check-in', value: property.checkInTime },
              { key: 'Check-out', value: property.checkOutTime },
              { key: 'Created', value: formatDate(property.createdAt, { month: 'long', day: 'numeric', year: 'numeric' }) },
              {
                key: 'Last updated',
                value: formatDate(property.updatedAt, { month: 'long', day: 'numeric', year: 'numeric' }),
              },
            ]}
          />
          <Button
            size="sm"
            variant="secondary"
            style={{ marginTop: 'var(--sp-4)' }}
            to={`/host/properties/${property.id}/information`}
            icon="edit"
          >
            Edit information
          </Button>
        </Panel>

        <Panel
          title="What guests see"
          subtitle="Private to anyone holding your guest link"
        >
          <div className="hgrid hgrid--2">
            <DefinitionList
              rows={[
                { key: 'WiFi network', value: property.wifi?.network || 'Not set' },
                { key: 'WiFi password', value: property.wifi?.password ? '••••••••' : 'Not set' },
                { key: 'Door code', value: property.checkIn?.doorCode ? '••••' : 'Not set' },
                { key: 'Lock type', value: property.checkIn?.lockType || 'Not set' },
              ]}
            />
            <DefinitionList
              rows={[
                { key: 'House rules', value: `${(property.rules ?? []).filter((r) => r.enabled).length} shown` },
                { key: 'Parking', value: property.parking?.location || 'Not set' },
                { key: 'Emergency contact', value: property.emergency?.contactPhone || 'Not set' },
                { key: 'Recommendations', value: `${recommendationCount(property.id)} added` },
              ]}
            />
          </div>
        </Panel>

        {property.photos.length > 0 && (
          <Panel
            title="Photos"
            subtitle={`${property.photos.length} in the gallery`}
            action={
              <Link
                to={`/host/properties/${property.id}/photos`}
                className="u-small"
                style={{ color: 'var(--sea-700)', fontWeight: 600 }}
              >
                Manage
              </Link>
            }
          >
            <div className="photo-grid">
              {property.photos.slice(0, 6).map((photo) => (
                <div className="photo-tile" key={photo.id}>
                  <SmartImage photoId={photo.image} alt={photo.caption || photo.category} ratio="4x3" width={400} />
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
        <Panel title="Setup">
          <SetupChecklist progress={progress} propertyId={property.id} />
        </Panel>

        <Panel title="Guest access">
          {property.guestAccess.enabled ? (
            <>
              <p className="u-small u-muted">
                Guest access is live. {property.guestAccess.totalGuests} guests have used this link.
              </p>
              <Button
                block
                style={{ marginTop: 'var(--sp-3)' }}
                to={`/host/properties/${property.id}/guest-access`}
                icon="qr"
              >
                Link and QR code
              </Button>
            </>
          ) : (
            <>
              <p className="u-small u-muted">
                Publish this property to switch guest access on and generate the link.
              </p>
              <Button
                block
                variant="secondary"
                style={{ marginTop: 'var(--sp-3)' }}
                to={`/host/properties/${property.id}/guest-access`}
              >
                Set up guest access
              </Button>
            </>
          )}
        </Panel>

        <Panel title="Vitoria">
          <p className="u-small u-muted">
            {property.vitoria.enabled
              ? 'Vitoria is answering guest questions for this property.'
              : 'Vitoria is switched off for this property.'}
          </p>
          <div className="hstack" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
            <Button size="sm" variant="secondary" block to={`/host/properties/${property.id}/vitoria`} icon="sparkles">
              Configure Vitoria
            </Button>
            <Button size="sm" variant="ghost" block to={`/host/properties/${property.id}/preview`} icon="play">
              Preview as guest
            </Button>
          </div>
        </Panel>

        <Panel title="Private information">
          <p className="u-xs u-muted" style={{ lineHeight: 1.65 }}>
            <Icon name="lock" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
            WiFi, door codes, house rules, parking and emergency details are only shown to guests who
            open your access link. They never appear on the public 30A pages.
          </p>
        </Panel>
      </div>
    </div>
  )
}
