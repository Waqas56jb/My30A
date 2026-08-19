import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { Avatar } from '../ui/Display'
import { useApp } from '../../context/AppContext'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useOnEscape } from '../../hooks/useOnEscape'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { cx } from '../../utils/format'

/** Public site navigation — this is a website header, not app chrome. */
const NAV = [
  { to: '/explore', label: 'Explore' },
  { to: '/experiences/bonfires', label: 'Experiences' },
  { to: '/beaches', label: 'Beaches' },
  { to: '/restaurants', label: 'Restaurants' },
  { to: '/events', label: 'Events' },
  { to: '/vitoria', label: 'Vitoria' },
]

/**
 * The header for the public site.
 *
 * It sits transparently over the video hero and turns solid once you scroll
 * past it, which is what stops a marketing page from looking like a dashboard
 * with a logo bolted on.
 */
export default function SiteHeader() {
  const { isAuthed, account } = useApp()
  const location = useLocation()
  const [solid, setSolid] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const panelRef = useRef(null)

  useLockBodyScroll(menuOpen)
  useOnEscape(() => setMenuOpen(false), menuOpen)
  useFocusTrap(panelRef, menuOpen)

  useEffect(() => setMenuOpen(false), [location.pathname])

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 32)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={cx('site-head', solid && 'site-head--solid')}>
        <div className="site-head__inner">
          <Link to="/" className="site-head__brand" aria-label="My30A home">
            <span className="site-head__mark" aria-hidden="true">
              <Icon name="waves" />
            </span>
            <span>
              <span className="site-head__name">My30A</span>
              <span className="site-head__tag">Concierge</span>
            </span>
          </Link>

          <nav className="site-head__nav" aria-label="Site">
            {NAV.map((item) =>
              isAuthed ? (
                <NavLink key={item.to} to={item.to} className="site-head__link">
                  {item.label}
                </NavLink>
              ) : (
                <Link key={item.to} to="/login" state={{ from: item.to }} className="site-head__link">
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="site-head__actions">
            {isAuthed ? (
              <Link to="/discover" className="site-head__guest">
                <Avatar src={account?.avatar} name={account?.firstName} size="sm" />
                <span className="u-small" style={{ fontWeight: 600 }}>
                  My stay
                </span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="site-head__link site-head__signin">
                  Log in
                </Link>
                <Button to="/signup" size="sm" className="site-head__cta">
                  Sign up
                </Button>
              </>
            )}

            <button
              type="button"
              className="site-head__menu"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
            >
              <Icon name="list" />
            </button>
          </div>
        </div>
      </header>

      {menuOpen &&
        createPortal(
          <div className="site-menu" role="dialog" aria-modal="true" aria-label="Menu" ref={panelRef}>
            <div className="site-menu__head">
              <Link to="/" className="site-head__brand">
                <span className="site-head__mark" aria-hidden="true">
                  <Icon name="waves" />
                </span>
                <span className="site-head__name">My30A</span>
              </Link>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <Icon name="x" />
              </button>
            </div>

            <nav className="site-menu__nav" aria-label="Site">
              {NAV.map((item) =>
                isAuthed ? (
                  <NavLink key={item.to} to={item.to} className="site-menu__link">
                    {item.label}
                    <Icon name="arrowRight" size={18} />
                  </NavLink>
                ) : (
                  <Link key={item.to} to="/login" state={{ from: item.to }} className="site-menu__link">
                    {item.label}
                    <Icon name="arrowRight" size={18} />
                  </Link>
                ),
              )}
            </nav>

            <div className="site-menu__foot">
              {isAuthed ? (
                <Button to="/discover" block size="lg" iconRight="arrowRight">
                  Go to my stay
                </Button>
              ) : (
                <>
                  <Button to="/signup" block size="lg" iconRight="arrowRight">
                    Create your account
                  </Button>
                  <Button to="/login" block variant="secondary">
                    Log in
                  </Button>
                </>
              )}
              <Button
                to={isAuthed ? '/vitoria' : '/login'}
                state={isAuthed ? undefined : { from: '/vitoria' }}
                block
                variant="ghost"
                icon="sparkles"
              >
                Ask Vitoria
              </Button>
              <Link to="/help" className="u-small u-muted" style={{ textAlign: 'center' }}>
                Help &amp; contact
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
