import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './ui/Icon'
import SmartImage from './ui/SmartImage'
import { PropertyStatusBadge } from './HostUI'
import { useWorkspace } from '../context/WorkspaceContext'
import { useOnEscape } from '../hooks/useOnEscape'

/**
 * Property selector. A manager with several rentals switches context here, and
 * every page reads `activeProperty` — so switching moves the whole panel at
 * once rather than each page keeping its own idea of "current".
 */
export default function PropertySwitcher({ compact = false }) {
  const { properties, activeProperty, setActivePropertyId } = useWorkspace()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useOnEscape(() => setOpen(false), open)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  if (!activeProperty) return null

  return (
    <div className="pswitch" ref={ref}>
      <button
        type="button"
        className="pswitch__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="pswitch__thumb" aria-hidden="true">
          <SmartImage photoId={activeProperty.coverImage} alt="" ratio="1x1" width={120} />
        </span>
        <span style={{ minWidth: 0, flex: '1 1 auto' }}>
          <span className="pswitch__name">{activeProperty.name}</span>
          <span className="pswitch__meta">
            {properties.length > 1 ? `${properties.length} properties` : activeProperty.city}
          </span>
        </span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} style={{ flex: 'none', color: 'var(--ink-400)' }} />
      </button>

      {open && (
        <div className="pswitch__menu" role="listbox" aria-label="Switch property">
          {properties.map((property) => (
            <button
              key={property.id}
              type="button"
              role="option"
              aria-selected={property.id === activeProperty.id}
              className="pswitch__option"
              onClick={() => {
                setActivePropertyId(property.id)
                setOpen(false)
              }}
            >
              <span className="pswitch__thumb" aria-hidden="true">
                <SmartImage photoId={property.coverImage} alt="" ratio="1x1" width={100} />
              </span>
              <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                <span className="pswitch__name">{property.name}</span>
                <span className="pswitch__meta">
                  <PropertyStatusBadge status={property.status} />
                </span>
              </span>
            </button>
          ))}

          {!compact && (
            <button
              type="button"
              className="pswitch__option"
              onClick={() => {
                setOpen(false)
                navigate('/host/properties/new')
              }}
            >
              <span
                className="pswitch__thumb"
                style={{ display: 'grid', placeItems: 'center', color: 'var(--sea-700)' }}
                aria-hidden="true"
              >
                <Icon name="plus" size={18} />
              </span>
              <span className="pswitch__name">Add a property</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
