import { NavLink, Link, useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { IconButton } from '../ui/Button'
import { Avatar } from '../ui/Display'
import PropertySwitcher from '../PropertySwitcher'
import { useAuth } from '../../context/AuthContext'
import { useWorkspace } from '../../context/WorkspaceContext'

export const MAIN_NAV = [
  { to: '/host/dashboard', label: 'Dashboard', icon: 'grid' },
  { to: '/host/properties', label: 'My properties', icon: 'building' },
  { to: '/host/guests', label: 'Guests', icon: 'users' },
  { to: '/host/vitoria', label: 'Vitoria', icon: 'sparkles' },
  { to: '/host/activity', label: 'Guest activity', icon: 'list' },
  { to: '/host/analytics', label: 'Analytics', icon: 'chart' },
  { to: '/host/area', label: 'Area map & flyers', icon: 'map' },
]

/** Built per-property so the links always point at the selected rental. */
export const propertyNav = (id) => [
  { to: `/host/properties/${id}/information`, label: 'Property information', icon: 'building' },
  { to: `/host/properties/${id}/recommendations`, label: 'Local recommendations', icon: 'sparkles' },
  { to: `/host/properties/${id}/guest-access`, label: 'Guest access', icon: 'key' },
  { to: `/host/properties/${id}/preview`, label: 'Preview as guest', icon: 'play' },
]

export const ACCOUNT_NAV = [
  { to: '/host/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/host/profile', label: 'Profile', icon: 'user' },
  { to: '/host/settings', label: 'Settings', icon: 'settings' },
  { to: '/host/help', label: 'Help', icon: 'info' },
]

/** Five destinations for the phone tab bar. */
export const TAB_NAV = [
  { to: '/host/dashboard', label: 'Home', icon: 'grid' },
  { to: '/host/properties', label: 'Property', icon: 'building' },
  { to: '/host/guests', label: 'Guests', icon: 'users' },
  { to: '/host/vitoria', label: 'Vitoria', icon: 'sparkles' },
  { to: '/host/analytics', label: 'Insights', icon: 'chart' },
]

export function Sidebar() {
  const { host, signOut } = useAuth()
  const { activeProperty, unreadCount } = useWorkspace()
  const navigate = useNavigate()

  const leaveHost = async () => {
    await signOut()
    navigate('/host/login')
  }

  return (
    <aside className="hside" aria-label="Host navigation">
      <Link to="/host/dashboard" className="hside__brand">
        <span className="hside__mark" aria-hidden="true">
          <Icon name="waves" />
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="hside__name">My30A</span>
          <span className="hside__tag">Host</span>
        </span>
      </Link>

      <PropertySwitcher />

      <nav className="hside__group">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className="hside__item">
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

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
      </div>

      <div className="hside__group hside__foot">
        <NavLink to="/host/profile" className="hside__item">
          <Avatar src={host?.avatar} name={host?.firstName} size="sm" />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block' }} className="u-truncate">
              {host ? `${host.firstName} ${host.lastName}` : 'Host'}
            </span>
            <span className="u-xs u-muted u-truncate" style={{ display: 'block', fontWeight: 400 }}>
              {host?.company || host?.email}
            </span>
          </span>
        </NavLink>
        <button type="button" className="hside__item" onClick={leaveHost}>
          <Icon name="logout" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function TopBar({ onOpenMenu }) {
  const { unreadCount } = useWorkspace()
  const { host } = useAuth()

  return (
    <header className="htop">
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

      <Link to="/host/dashboard" className="htop__brand">
        <Icon name="waves" size={19} style={{ color: 'var(--sea-700)' }} />
        My30A
        <span className="htop__brand-tag">Host</span>
      </Link>

      <div className="htop__actions">
        <IconButton icon="bell" label="Notifications" to="/host/notifications" badge={unreadCount} />
        <Link to="/host/profile" aria-label="Your profile" style={{ display: 'flex', marginLeft: 2 }}>
          <Avatar src={host?.avatar} name={host?.firstName} size="sm" />
        </Link>
      </div>
    </header>
  )
}

export function BottomTabs() {
  const { unreadCount } = useWorkspace()
  return (
    <nav className="htabs" aria-label="Primary">
      {TAB_NAV.map((item) => (
        <NavLink key={item.to} to={item.to} className="htabs__item">
          <span className="htabs__icon">
            <Icon name={item.icon} />
            {item.to === '/host/dashboard' && unreadCount > 0 && (
              <span className="htabs__dot" aria-hidden="true" />
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
