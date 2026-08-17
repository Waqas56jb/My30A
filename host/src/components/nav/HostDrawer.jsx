import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { IconButton } from '../ui/Button'
import PropertySwitcher from '../PropertySwitcher'
import { MAIN_NAV, ACCOUNT_NAV, propertyNav } from './HostNav'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useOnEscape } from '../../hooks/useOnEscape'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * Mobile navigation. The tab bar holds five destinations; everything else —
 * the per-property pages, account, help, sign out — lives in here.
 */
export default function HostDrawer({ open, onClose }) {
  const { signOut } = useAuth()
  const { activeProperty, unreadCount } = useWorkspace()
  const location = useLocation()
  const navigate = useNavigate()
  const panelRef = useRef(null)

  useLockBodyScroll(open)
  useOnEscape(onClose, open)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  if (!open) return null

  return createPortal(
    <div className="hdrawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hdrawer" role="dialog" aria-modal="true" aria-label="Menu" ref={panelRef}>
        <div className="hdrawer__head">
          <Link to="/host/dashboard" className="htop__brand">
            <Icon name="waves" size={19} style={{ color: 'var(--sea-700)' }} />
            My30A
            <span className="htop__brand-tag">Host</span>
          </Link>
          <IconButton icon="x" label="Close menu" onClick={onClose} />
        </div>

        <div style={{ padding: 'var(--sp-4) var(--sp-3) 0' }}>
          <PropertySwitcher compact />
        </div>

        <nav className="hdrawer__nav" aria-label="All sections">
          <div className="hside__group">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="hside__item">
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </div>

          {activeProperty && (
            <div className="hside__group">
              <span className="hside__label">This property</span>
              {propertyNav(activeProperty.id).map((item) => (
                <NavLink key={item.to} to={item.to} className="hside__item">
                  <Icon name={item.icon} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}

          <div className="hside__group">
            <span className="hside__label">Account</span>
            {ACCOUNT_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="hside__item">
                <Icon name={item.icon} />
                {item.label}
                {item.to === '/host/notifications' && unreadCount > 0 && (
                  <span className="hside__count">{unreadCount}</span>
                )}
              </NavLink>
            ))}
            <button
              type="button"
              className="hside__item"
              onClick={async () => {
                await signOut()
                navigate('/host/login')
              }}
            >
              <Icon name="logout" />
              Sign out
            </button>
          </div>
        </nav>
      </div>
    </div>,
    document.body,
  )
}
