import { NavLink, Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { IconButton } from '../ui/Button'
import { Avatar } from '../ui/Display'
import { useApp } from '../../context/AppContext'

/** The five primary destinations, shared by the tab bar and the sidebar. */
export const PRIMARY_NAV = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/vitoria', label: 'Vitoria', icon: 'sparkles' },
  { to: '/explore', label: 'Explore', icon: 'compass' },
  { to: '/services', label: 'Services', icon: 'bell' },
  { to: '/my-trip', label: 'Trip', icon: 'suitcase' },
]

const DISCOVER_NAV = [
  { to: '/restaurants', label: 'Restaurants', icon: 'utensils' },
  { to: '/beaches', label: 'Beaches', icon: 'umbrella' },
  { to: '/events', label: 'Events', icon: 'ticket' },
  { to: '/partners', label: 'Local partners', icon: 'sparkles' },
  { to: '/map', label: 'Map', icon: 'map' },
]

const STAY_NAV = [
  { to: '/my-stay', label: 'My Stay', icon: 'key' },
  { to: '/groceries', label: 'Groceries', icon: 'bag' },
  { to: '/transfers', label: 'Transfers', icon: 'car' },
]

/** Desktop sidebar (≥1024px). */
export function Sidebar() {
  const { guest, property, unreadCount } = useApp()

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <Link to="/home" className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">
          <Icon name="waves" />
        </span>
        <span>
          <span className="sidebar__brand-name">My30A</span>
          <span className="sidebar__brand-sub">Concierge</span>
        </span>
      </Link>

      <nav className="sidebar__group">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className="sidebar__item">
            <Icon name={item.icon} />
            {item.label === 'Trip' ? 'My Trip' : item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__group">
        <span className="sidebar__label">Discover</span>
        {DISCOVER_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className="sidebar__item">
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar__group">
        <span className="sidebar__label">Your stay</span>
        {STAY_NAV.map((item) => (
          <NavLink key={item.to} to={item.to} className="sidebar__item">
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
        <NavLink to="/notifications" className="sidebar__item">
          <Icon name="bell" />
          Notifications
          {unreadCount > 0 && <span className="sidebar__count">{unreadCount}</span>}
        </NavLink>
      </div>

      <div className="sidebar__group sidebar__foot">
        <NavLink to="/profile" className="sidebar__item">
          <Avatar src={guest?.avatar} name={guest?.firstName} size="sm" />
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block' }} className="u-truncate">
              {guest ? `${guest.firstName} ${guest.lastName}` : 'Guest'}
            </span>
            <span className="u-xs u-muted u-truncate" style={{ display: 'block', fontWeight: 400 }}>
              {property?.name ?? '—'}
            </span>
          </span>
        </NavLink>
        <NavLink to="/settings" className="sidebar__item">
          <Icon name="settings" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}

/** Mobile / tablet top bar. */
export function TopBar({ title }) {
  const { unreadCount, guest } = useApp()
  return (
    <header className="topbar">
      {title ? (
        <span className="topbar__brand">{title}</span>
      ) : (
        <Link to="/home" className="topbar__brand">
          <Icon name="waves" style={{ width: 20, height: 20, color: 'var(--sea-700)' }} />
          My30A
        </Link>
      )}
      <div className="topbar__actions">
        <IconButton icon="search" label="Search 30A" to="/explore" />
        <IconButton icon="bell" label="Notifications" to="/notifications" badge={unreadCount} />
        <Link to="/profile" aria-label="Your profile" style={{ marginLeft: 4 }}>
          <Avatar src={guest?.avatar} name={guest?.firstName} size="sm" />
        </Link>
      </div>
    </header>
  )
}

/** Mobile bottom navigation. */
export function MobileBottomNav() {
  const { unreadCount } = useApp()
  return (
    <nav className="tabbar" aria-label="Primary">
      {PRIMARY_NAV.map((item) => (
        <NavLink key={item.to} to={item.to} className="tabbar__item">
          <span className="tabbar__icon">
            <Icon name={item.icon} />
            {item.to === '/services' && unreadCount > 0 && (
              <span className="tabbar__dot" aria-hidden="true" />
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
