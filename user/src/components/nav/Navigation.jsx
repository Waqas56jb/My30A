import { NavLink, Link } from 'react-router-dom'
import Icon from '../ui/Icon'
import { IconButton } from '../ui/Button'
import { Avatar } from '../ui/Display'
import { useApp } from '../../context/AppContext'

/** The five primary destinations, shared by the tab bar and the sidebar. */
export const PRIMARY_NAV = [
  { to: '/discover', label: 'Home', icon: 'home' },
  { to: '/explore', label: 'Explore', icon: 'compass' },
  { to: '/map', label: 'Map', icon: 'map' },
  { to: '/vitoria', label: 'Vitoria', icon: 'sparkles' },
  { to: '/my-stay', label: 'My Stay', icon: 'key' },
]

export const EXPERIENCE_NAV = [
  { to: '/beaches', label: 'Beaches', icon: 'umbrella' },
  { to: '/restaurants', label: 'Restaurants', icon: 'utensils' },
  { to: '/experiences/bonfires', label: 'Beach bonfires', icon: 'flame' },
  { to: '/experiences/golf-carts', label: 'Golf carts', icon: 'car' },
  { to: '/experiences/biking', label: 'Biking', icon: 'bike' },
  { to: '/experiences/boating', label: 'Boating', icon: 'boat' },
  { to: '/events', label: 'Events', icon: 'ticket' },
  { to: '/partners', label: 'Local partners', icon: 'sparkles' },
  { to: '/area', label: 'Area map & flyers', icon: 'map' },
]

export const STAY_NAV = [
  { to: '/my-stay', label: 'My Stay', icon: 'key' },
  { to: '/groceries', label: 'Groceries', icon: 'bag' },
  { to: '/transfers', label: 'Transfers', icon: 'car' },
  { to: '/my-trip', label: 'My Trip', icon: 'suitcase' },
  { to: '/favorites', label: 'Saved places', icon: 'heart' },
]

const ACCOUNT_NAV = [
  { to: '/search', label: 'Search', icon: 'search' },
  { to: '/help', label: 'Help & contact', icon: 'info' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

/** Desktop sidebar (>=1024px). */
export function Sidebar() {
  const { guest, property, unreadCount, hasGuest, isAuthed, account } = useApp()

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <Link to="/discover" className="sidebar__brand">
        <span className="sidebar__brand-mark" aria-hidden="true">
          <Icon name="waves" />
        </span>
        <span className="sidebar__brand-text">
          <span className="sidebar__brand-name">My30A</span>
          <span className="sidebar__brand-sub">Concierge</span>
        </span>
      </Link>

      <nav className="sidebar__group">
        {PRIMARY_NAV.filter((item) => item.to !== '/my-stay').map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="sidebar__item">
            <Icon name={item.icon} />
            {item.label === 'Home' ? 'Discover' : item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__group">
        <span className="sidebar__label">Experiences</span>
        {EXPERIENCE_NAV.map((item) => (
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
        {isAuthed ? (
          <>
            <NavLink to="/profile" className="sidebar__item">
              <Avatar
                src={guest?.avatar ?? account?.avatar}
                name={account?.firstName ?? guest?.firstName}
                size="sm"
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block' }} className="u-truncate">
                  {account?.firstName ?? guest?.firstName} {account?.lastName ?? guest?.lastName}
                </span>
                <span className="u-xs u-muted u-truncate" style={{ display: 'block', fontWeight: 400 }}>
                  {hasGuest ? (property?.name ?? '-') : 'No stay linked yet'}
                </span>
              </span>
            </NavLink>
            {!hasGuest && (
              <Link to="/access" className="btn btn--sm btn--block">
                <Icon name="key" />
                Add your stay
              </Link>
            )}
            <NavLink to="/settings" className="sidebar__item">
              <Icon name="settings" />
              Settings
            </NavLink>
            {/* A route, not a handler — /logout is unguarded, so clearing the
                session cannot race with RequireAuth. */}
            <Link to="/logout" className="sidebar__item">
              <Icon name="logout" />
              Log out
            </Link>
          </>
        ) : null}
      </div>
    </aside>
  )
}

/** Mobile / tablet top bar. The menu button opens the drawer. */
export function TopBar({ onOpenMenu }) {
  const { unreadCount, guest, account, isAuthed } = useApp()
  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn topbar__menu"
        onClick={onOpenMenu}
        aria-label="Open menu"
        aria-haspopup="dialog"
      >
        <Icon name="list" />
      </button>

      <Link to="/discover" className="topbar__brand">
        <Icon name="waves" size={20} style={{ color: 'var(--sea-700)' }} />
        My30A
      </Link>

      <div className="topbar__actions">
        <IconButton icon="search" label="Search 30A" to="/search" />
        <IconButton icon="bell" label="Notifications" to="/notifications" badge={unreadCount} />
        {isAuthed ? (
          <Link to="/profile" aria-label="Your profile" style={{ marginLeft: 2, display: 'flex' }}>
            <Avatar
              src={guest?.avatar ?? account?.avatar}
              name={account?.firstName ?? guest?.firstName}
              size="sm"
            />
          </Link>
        ) : null}
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
        <NavLink key={item.to} to={item.to} end={item.end} className="tabbar__item">
          <span className="tabbar__icon">
            <Icon name={item.icon} />
            {item.to === '/my-stay' && unreadCount > 0 && (
              <span className="tabbar__dot" aria-hidden="true" />
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Full navigation for the mobile drawer — everything the sidebar shows. */
export const DRAWER_GROUPS = [
  { label: null, items: PRIMARY_NAV },
  { label: 'Experiences', items: EXPERIENCE_NAV },
  { label: 'Your stay', items: STAY_NAV },
  { label: 'More', items: ACCOUNT_NAV },
]
