import { NavLink, Link, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { IconButton } from '../ui/Button'
import SmartImage from '../ui/SmartImage'
import { StatusPill } from '../PartnerUI'
import { usePartner } from '../../context/PartnerContext'

export const MAIN_NAV = [
  { to: '/partner/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/partner/profile', label: 'My profile', icon: 'building' },
  { to: '/partner/photos', label: 'Photos', icon: 'image' },
  { to: '/partner/preview', label: 'Preview', icon: 'eye' },
  { to: '/partner/analytics', label: 'Analytics', icon: 'chart' },
]

export const ACCOUNT_NAV = [
  { to: '/partner/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/partner/settings', label: 'Settings', icon: 'settings' },
]

/** Five destinations for the phone tab bar. */
export const TAB_NAV = [
  { to: '/partner/dashboard', label: 'Home', icon: 'grid' },
  { to: '/partner/profile', label: 'Profile', icon: 'building' },
  { to: '/partner/photos', label: 'Photos', icon: 'image' },
  { to: '/partner/preview', label: 'Preview', icon: 'eye' },
  { to: '/partner/analytics', label: 'Insights', icon: 'chart' },
]

function BusinessCard({ partner }) {
  if (!partner) return null
  return (
    <Link to="/partner/profile" className="bizcard">
      <span className="bizcard__logo" aria-hidden="true">
        {partner.logo ? (
          <SmartImage photoId={partner.logo} alt="" ratio="1x1" width={120} />
        ) : (
          <span style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--ink-400)' }}>
            <Icon name="building" size={18} />
          </span>
        )}
      </span>
      <span style={{ minWidth: 0, flex: '1 1 auto' }}>
        <span className="bizcard__name">{partner.businessName}</span>
        <StatusPill status={partner.status} />
      </span>
    </Link>
  )
}

export function Sidebar() {
  const { partner, unreadCount, signOut } = usePartner()
  const navigate = useNavigate()

  const leave = async () => {
    await signOut()
    navigate('/partner/login')
  }

  return (
    <aside className="pside" aria-label="Partner navigation">
      <Link to="/partner/dashboard" className="pside__brand">
        <span className="pside__mark" aria-hidden="true">
          <Icon name="waves" />
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="pside__name">My30A</span>
          <span className="pside__tag">Partners</span>
        </span>
      </Link>

      <BusinessCard partner={partner} />

      <nav className="pside__group">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className="pside__item">
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

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
      </div>

      <div className="pside__group pside__foot">
        <NavLink to="/partner/help" className="pside__item">
          <Icon name="info" />
          How My30A works
        </NavLink>
        <button type="button" className="pside__item" onClick={leave}>
          <Icon name="logout" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function TopBar({ onOpenMenu }) {
  const { unreadCount, partner } = usePartner()
  return (
    <header className="ptop">
      <button
        type="button"
        className="icon-btn"
        onClick={onOpenMenu}
        aria-label="Open menu"
        aria-haspopup="dialog"
        style={{ marginLeft: -6, flex: 'none' }}
      >
        <Icon name="list" />
      </button>

      <Link to="/partner/dashboard" className="ptop__brand">
        <Icon name="waves" size={19} style={{ color: 'var(--sea-700)' }} />
        My30A
        <span className="ptop__tag">Partners</span>
      </Link>

      <div className="ptop__actions">
        {partner && <StatusPill status={partner.status} />}
        <IconButton icon="bell" label="Notifications" to="/partner/notifications" badge={unreadCount} />
      </div>
    </header>
  )
}

export function BottomTabs() {
  const { unreadCount } = usePartner()
  return (
    <nav className="ptabs" aria-label="Primary">
      {TAB_NAV.map((item) => (
        <NavLink key={item.to} to={item.to} className="ptabs__item">
          <span className="ptabs__icon">
            <Icon name={item.icon} />
            {item.to === '/partner/dashboard' && unreadCount > 0 && (
              <span className="ptabs__dot" aria-hidden="true" />
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export { BusinessCard }
