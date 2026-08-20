import { Link } from 'react-router-dom'
import Icon from './ui/Icon'
import { hostSignupUrl, partnerRegisterUrl } from '../config/portals'
import { HOST_CONTACT } from '../config/contact'

const COLUMNS = [
  {
    title: 'Experiences',
    links: [
      { to: '/beaches', label: 'Beaches' },
      { to: '/experiences/bonfires', label: 'Beach bonfires' },
      { to: '/experiences/golf-carts', label: 'Golf carts' },
      { to: '/experiences/biking', label: 'Biking' },
      { to: '/experiences/boating', label: 'Boating' },
      { to: '/restaurants', label: 'Restaurants' },
    ],
  },
  {
    title: 'Your stay',
    links: [
      { to: '/access', label: 'Unlock your stay' },
      { to: '/vitoria', label: 'Ask Vitoria' },
      { to: '/groceries', label: 'Grocery delivery' },
      { to: '/transfers', label: 'Airport transfers' },
      { to: '/help', label: 'Help & contact' },
    ],
  },
  {
    title: 'Work with us',
    links: [
      { href: hostSignupUrl, label: 'Become a host' },
      { href: partnerRegisterUrl, label: 'Become a partner' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="site-foot">
      <div>
        <span className="site-foot__brand">
          <Icon name="waves" size={22} style={{ color: 'var(--sea-700)' }} />
          My30A
        </span>
        <p className="u-small u-muted" style={{ marginTop: 'var(--sp-3)', maxWidth: '38ch' }}>
          A local concierge for Florida&apos;s Scenic Highway 30A — the beaches, the bonfires, the
          bike trail, and everyone worth calling while you are here.
        </p>
        <div className="site-foot__contact">
          <a href={`mailto:${HOST_CONTACT.email}`}>{HOST_CONTACT.email}</a>
          <span>Instagram — {HOST_CONTACT.instagram}</span>
          <span>Facebook — {HOST_CONTACT.facebook}</span>
        </div>
      </div>

      {COLUMNS.map((column) => (
        <div className="site-foot__col" key={column.title}>
          <h3>{column.title}</h3>
          {column.links.map((link) =>
            link.href ? (
              <a key={link.href + link.label} href={link.href}>
                {link.label}
              </a>
            ) : (
              <Link key={link.to + link.label} to={link.to}>
                {link.label}
              </Link>
            ),
          )}
        </div>
      ))}

      <p className="site-foot__legal">
        Businesses listed on My30A are independent local partners. We introduce you and never take a
        cut of what you book with them. Prototype build — all data is illustrative and no payments
        are processed.
      </p>
    </footer>
  )
}
