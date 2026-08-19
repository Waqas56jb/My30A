import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'
import { useAdmin } from '../../context/AdminContext'
import { visibleTree } from './navItems'
import { cx } from '../../utils/format'
import { Avatar } from '../ui/Display'

/**
 * The navigation tree, shared by the desktop rail and the mobile drawer.
 *
 * A group opens automatically when the current route lives inside it, so an
 * operator who deep-links to a refund never has to hunt for where they are.
 */
export function NavTree({ onNavigate }) {
  const location = useLocation()
  const { can, attention } = useAdmin()
  const tree = visibleTree((area) => can(area, 'view'))

  const badgeCount = (key) => attention.find((a) => a.id === key)?.count ?? 0

  const groupHoldsRoute = (item) =>
    item.children?.some((c) => location.pathname.startsWith(c.to)) ?? false

  const [open, setOpen] = useState(() =>
    Object.fromEntries(tree.filter((i) => i.children).map((i) => [i.label, groupHoldsRoute(i)])),
  )

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev }
      tree.filter((i) => i.children).forEach((i) => {
        if (groupHoldsRoute(i)) next[i.label] = true
      })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <nav className="anav" aria-label="Admin sections">
      {tree.map((item) => {
        if (!item.children) {
          const count = item.badge ? badgeCount(item.badge) : 0
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="anav__item"
              onClick={onNavigate}
            >
              <Icon name={item.icon} />
              <span className="anav__label">{item.label}</span>
              {count > 0 && <span className="anav__count">{count}</span>}
            </NavLink>
          )
        }

        const groupCount = item.children.reduce(
          (sum, c) => sum + (c.badge ? badgeCount(c.badge) : 0),
          0,
        )
        const isOpen = open[item.label] ?? false

        return (
          <div key={item.label} className={cx('anav__group', isOpen && 'is-open')}>
            <button
              type="button"
              className="anav__item anav__toggle"
              aria-expanded={isOpen}
              onClick={() => setOpen((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
            >
              <Icon name={item.icon} />
              <span className="anav__label">{item.label}</span>
              {groupCount > 0 && !isOpen && <span className="anav__count">{groupCount}</span>}
              <Icon name="chevronDown" size={16} className="anav__caret" />
            </button>

            {isOpen && (
              <div className="anav__children">
                {item.children.map((child) => {
                  const count = child.badge ? badgeCount(child.badge) : 0
                  return (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      end={child.end}
                      className="anav__child"
                      onClick={onNavigate}
                    >
                      <span className="anav__label">{child.label}</span>
                      {count > 0 && <span className="anav__count">{count}</span>}
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

/** The brand block, repeated in the rail and the drawer. */
export function NavBrand() {
  return (
    <Link to="/admin/dashboard" className="asidebar__brand">
      <span className="asidebar__mark" aria-hidden="true">
        <Icon name="waves" />
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="asidebar__name">My30A</span>
        <span className="asidebar__sub">Operations</span>
      </span>
    </Link>
  )
}

/** Signed-in operator, their role, and the way out. */
export function NavAccount({ onNavigate }) {
  const { user } = useAdmin()
  if (!user) return null

  return (
    <div className="asidebar__foot">
      <Link to="/admin/profile" className="acct" onClick={onNavigate}>
        <Avatar src={user.avatarUrl} name={user.name} size="sm" className="acct__avatar" />
        <span style={{ minWidth: 0 }}>
          <span className="acct__name u-truncate">{user.name}</span>
          <span className="acct__role u-truncate">{user.title || user.role.replace(/_/g, ' ')}</span>
        </span>
      </Link>
      <Link to="/admin/logout" className="anav__item" onClick={onNavigate}>
        <Icon name="logout" />
        <span className="anav__label">Sign out</span>
      </Link>
    </div>
  )
}

/** Desktop rail (>=1100px). */
export default function Sidebar() {
  return (
    <aside className="asidebar" aria-label="Main navigation">
      <NavBrand />
      <div className="asidebar__scroll">
        <NavTree />
      </div>
      <NavAccount />
    </aside>
  )
}
