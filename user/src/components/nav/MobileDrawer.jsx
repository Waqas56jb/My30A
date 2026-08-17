import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { Avatar } from '../ui/Display'
import { IconButton } from '../ui/Button'
import { DRAWER_GROUPS } from './Navigation'
import { useApp } from '../../context/AppContext'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useOnEscape } from '../../hooks/useOnEscape'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * Slide-in navigation for phones and tablets.
 *
 * The bottom tab bar only has room for five destinations; everything else
 * (experiences, stay services, search, help, settings) lives here. It closes
 * on navigation, on Escape, and on a backdrop tap, and traps focus while open.
 */
export default function MobileDrawer({ open, onClose }) {
  const { guest, property, hasGuest, unreadCount, signOut } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const panelRef = useRef(null)

  useLockBodyScroll(open)
  useOnEscape(onClose, open)
  useFocusTrap(panelRef, open)

  // Close whenever the route changes, including on a link inside the drawer.
  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  if (!open) return null

  return createPortal(
    <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Menu" ref={panelRef}>
        <div className="drawer__head">
          <Link to="/discover" className="topbar__brand">
            <Icon name="waves" size={20} style={{ color: 'var(--sea-700)' }} />
            My30A
          </Link>
          <IconButton icon="x" label="Close menu" onClick={onClose} />
        </div>

        {hasGuest ? (
          <Link to="/profile" className="drawer__guest">
            <Avatar src={guest?.avatar} name={guest?.firstName} size="md" />
            <span style={{ minWidth: 0 }}>
              <span className="drawer__guest-name">
                {guest.firstName} {guest.lastName}
              </span>
              <span className="drawer__guest-sub u-truncate">{property?.name}</span>
            </span>
            <Icon name="chevronRight" size={18} style={{ color: 'var(--ink-300)', flex: 'none' }} />
          </Link>
        ) : (
          <Link to="/access" className="drawer__unlock">
            <span className="drawer__unlock-icon" aria-hidden="true">
              <Icon name="key" />
            </span>
            <span>
              <span className="drawer__guest-name">Unlock your stay</span>
              <span className="drawer__guest-sub">Enter the code from your host</span>
            </span>
            <Icon name="chevronRight" size={18} style={{ color: 'var(--ink-300)', flex: 'none' }} />
          </Link>
        )}

        <nav className="drawer__nav" aria-label="All sections">
          {DRAWER_GROUPS.map((group, i) => (
            <div className="drawer__group" key={group.label ?? `group-${i}`}>
              {group.label && <span className="sidebar__label">{group.label}</span>}
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="drawer__item">
                  <Icon name={item.icon} />
                  {item.label}
                  {item.to === '/my-stay' && unreadCount > 0 && (
                    <span className="sidebar__count">{unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          <div className="drawer__group">
            <NavLink to="/notifications" className="drawer__item">
              <Icon name="bell" />
              Notifications
              {unreadCount > 0 && <span className="sidebar__count">{unreadCount}</span>}
            </NavLink>
            {hasGuest && (
              <button
                type="button"
                className="drawer__item"
                onClick={() => {
                  signOut()
                  navigate('/')
                }}
              >
                <Icon name="logout" />
                Sign out of this stay
              </button>
            )}
            <Link to="/" className="drawer__item">
              <Icon name="waves" />
              Back to the website
            </Link>
          </div>
        </nav>
      </div>
    </div>,
    document.body,
  )
}
