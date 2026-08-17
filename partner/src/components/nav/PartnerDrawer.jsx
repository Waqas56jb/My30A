import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { IconButton } from '../ui/Button'
import { MAIN_NAV, ACCOUNT_NAV, BusinessCard } from './PartnerNav'
import { usePartner } from '../../context/PartnerContext'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useOnEscape } from '../../hooks/useOnEscape'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * Mobile navigation. The tab bar carries five destinations; notifications,
 * settings, help and sign out live in here.
 */
export default function PartnerDrawer({ open, onClose }) {
  const { partner, unreadCount, signOut } = usePartner()
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
    <div className="pdrawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pdrawer" role="dialog" aria-modal="true" aria-label="Menu" ref={panelRef}>
        <div className="pdrawer__head">
          <Link to="/partner/dashboard" className="ptop__brand">
            <Icon name="waves" size={19} style={{ color: 'var(--sea-700)' }} />
            My30A
            <span className="ptop__tag">Partners</span>
          </Link>
          <IconButton icon="x" label="Close menu" onClick={onClose} />
        </div>

        <div style={{ padding: 'var(--sp-4) var(--sp-3) 0' }}>
          <BusinessCard partner={partner} />
        </div>

        <nav className="pdrawer__nav" aria-label="All sections">
          <div className="pside__group">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="pside__item">
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="pside__group">
            <span className="pside__label">Account</span>
            {ACCOUNT_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="pside__item">
                <Icon name={item.icon} />
                {item.label}
                {item.to === '/partner/notifications' && unreadCount > 0 && (
                  <span className="pside__count">{unreadCount}</span>
                )}
              </NavLink>
            ))}
            <NavLink to="/partner/help" className="pside__item">
              <Icon name="info" />
              How My30A works
            </NavLink>
            <button
              type="button"
              className="pside__item"
              onClick={async () => {
                await signOut()
                navigate('/partner/login')
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
