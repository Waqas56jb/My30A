import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import Button, { IconButton } from '../../components/ui/Button'
import SmartImage from '../../components/ui/SmartImage'
import { ConfirmModal } from '../../components/ui/Modal'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { PropertyStatusBadge } from '../../components/HostUI'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as propertyService from '../../services/propertyService'
import { PROPERTY_STATUSES } from '../../data/properties'

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'information', label: 'Information' },
  { to: 'wifi', label: 'WiFi' },
  { to: 'check-in', label: 'Check-in' },
  { to: 'check-out', label: 'Check-out' },
  { to: 'rules', label: 'House rules' },
  { to: 'parking', label: 'Parking' },
  { to: 'emergency', label: 'Emergency' },
  { to: 'recommendations', label: 'Recommendations' },
  { to: 'photos', label: 'Photos' },
  { to: 'guest-access', label: 'Guest access' },
  { to: 'vitoria', label: 'Vitoria' },
]

/**
 * Frame for everything under /host/properties/:id.
 *
 * It owns the property header and the status controls, so publishing or
 * pausing is one action away from any section the host happens to be editing.
 */
export default function PropertyLayout() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { properties, activeProperty, setActivePropertyId, applyProperty, pushToast, status } =
    useWorkspace()

  const property = useMemo(() => properties.find((item) => item.id === id), [properties, id])
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  useDocumentTitle(property?.name)

  // Opening a property URL directly should also switch the workspace context.
  useEffect(() => {
    if (property && activeProperty?.id !== property.id) setActivePropertyId(property.id)
  }, [property, activeProperty, setActivePropertyId])

  if (status === 'loading') return <SkeletonPage />

  if (!property) {
    return (
      <div className="hpage">
        <ErrorState
          title="We could not find that property"
          error={{ message: 'It may have been deleted, or the link is out of date.' }}
          onRetry={() => navigate('/host/properties')}
        />
      </div>
    )
  }

  const changeStatus = async (next) => {
    setBusy(true)
    try {
      applyProperty(await propertyService.setPropertyStatus(property.id, next))
      pushToast({
        tone: next === 'published' ? 'success' : 'info',
        title:
          next === 'published'
            ? 'Property published'
            : next === 'paused'
              ? 'Guest access paused'
              : 'Moved back to draft',
        message: PROPERTY_STATUSES[next].description,
      })
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await propertyService.deleteProperty(property.id)
      pushToast({ tone: 'info', title: 'Property deleted' })
      navigate('/host/properties')
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not work', message: error.message })
    } finally {
      setBusy(false)
      setConfirm(null)
    }
  }

  return (
    <div className="hpage">
      {/* ----------------------------- Header ----------------------------- */}
      <div className="u-row" style={{ marginBottom: 'var(--sp-3)' }}>
        <IconButton icon="arrowLeft" label="Back to properties" onClick={() => navigate('/host/properties')} />
        <span className="u-xs u-muted">All properties</span>
      </div>

      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-4)' }}>
        <div className="u-row" style={{ minWidth: 0, gap: 'var(--sp-3)' }}>
          <span
            style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', flex: 'none' }}
            aria-hidden="true"
          >
            <SmartImage photoId={property.coverImage} alt="" ratio="1x1" width={160} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'var(--fs-h2)' }}>{property.name}</h1>
            <div className="u-row" style={{ marginTop: 4 }}>
              <PropertyStatusBadge status={property.status} />
              <span className="u-xs u-muted">
                {property.city}, {property.state}
              </span>
            </div>
          </div>
        </div>

        <div className="hrow">
          <Button variant="secondary" to={`/host/properties/${property.id}/preview`} icon="play">
            Preview
          </Button>
          {property.status !== 'published' ? (
            <Button icon="check" loading={busy} onClick={() => setConfirm('publish')}>
              Publish
            </Button>
          ) : (
            <Button variant="secondary" icon="minus" onClick={() => setConfirm('pause')}>
              Pause access
            </Button>
          )}
          <IconButton icon="trash" label="Delete property" onClick={() => setConfirm('delete')} />
        </div>
      </header>

      {/* ------------------------------ Tabs ------------------------------ */}
      <nav className="chips" aria-label="Property sections" style={{ marginBottom: 'var(--sp-5)' }}>
        {TABS.map((tab) => (
          <NavLink
            key={tab.to || 'overview'}
            to={tab.to ? `/host/properties/${property.id}/${tab.to}` : `/host/properties/${property.id}`}
            end={tab.end}
            className={({ isActive }) => `chip${isActive ? ' chip--active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ property }} />

      {/* --------------------------- Confirmations ------------------------ */}
      <ConfirmModal
        open={confirm === 'publish'}
        onClose={() => setConfirm(null)}
        onConfirm={() => changeStatus('published')}
        loading={busy}
        title="Publish this property?"
        message="Guest access turns on immediately. Anyone with the link or QR code will be able to open their stay and see your property information."
        confirmLabel="Publish"
      />

      <ConfirmModal
        open={confirm === 'pause'}
        onClose={() => setConfirm(null)}
        onConfirm={() => changeStatus('paused')}
        loading={busy}
        title="Pause guest access?"
        message="Existing links stop opening until you publish again. Nothing is deleted, and guests currently in the house will lose access to their property details."
        confirmLabel="Pause access"
        tone="danger"
      />

      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={remove}
        loading={busy}
        title={`Delete ${property.name}?`}
        message="This removes the property, its guest link, and all of its information. Guest history stays in your analytics. This cannot be undone."
        confirmLabel="Delete property"
        tone="danger"
      />

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}

/** Shared save bar used by every section form. */
export function SectionBar({ dirty, saving, onSave, onReset, note }) {
  return (
    <div className="formbar">
      <span className="formbar__note">
        {note ?? (dirty ? 'You have unsaved changes.' : 'All changes saved.')}
      </span>
      {dirty && (
        <Button variant="ghost" onClick={onReset} disabled={saving}>
          Discard
        </Button>
      )}
      <Button onClick={onSave} loading={saving} disabled={!dirty} icon="check">
        Save changes
      </Button>
    </div>
  )
}
