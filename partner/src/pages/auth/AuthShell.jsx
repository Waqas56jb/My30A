import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { hero, PHOTO } from '../../assets/images'

const STATS = [
  { k: '38k', v: 'guest sessions a year' },
  { k: '11k', v: 'outbound taps to partners' },
  { k: '0%', v: 'commission on your bookings' },
]

/**
 * Shared frame for the unauthenticated screens: photography that sells 30A on
 * the left from 980px, the form on the right, one column below that.
 */
export default function AuthShell({ children, quote, image = PHOTO.bonfirePeople, back, wide = false }) {
  return (
    <div className="auth" style={wide ? { gridTemplateColumns: '1fr' } : undefined}>
      {!wide && (
        <div className="auth__media">
          <img src={hero(image)} alt="" />
          <div className="auth__media-body">
            <p className="u-eyebrow" style={{ color: 'rgba(255,255,255,.72)' }}>
              My30A Partners
            </p>
            <p className="auth__quote">
              {quote ?? 'Be the business guests are told about before they arrive.'}
            </p>
            <div className="auth__stats">
              {STATS.map((stat) => (
                <div key={stat.v}>
                  <span className="auth__stat-k">{stat.k}</span>
                  <span className="auth__stat-v">{stat.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="auth__panel" style={wide ? { maxWidth: 1180 } : undefined}>
        {back ? (
          <Link to={back.to} className="u-row" style={{ gap: 8, alignSelf: 'flex-start' }}>
            <Icon name="arrowLeft" size={18} />
            <span className="u-small">{back.label}</span>
          </Link>
        ) : (
          <span className="u-row" style={{ gap: 8, alignSelf: 'flex-start' }}>
            <span
              className="pside__mark"
              aria-hidden="true"
              style={{ width: 32, height: 32, borderRadius: 10 }}
            >
              <Icon name="waves" size={17} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
              My30A <span className="ptop__tag">Partners</span>
            </span>
          </span>
        )}

        {children}
      </div>
    </div>
  )
}
