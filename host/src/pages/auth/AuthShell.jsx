import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import { hero, PHOTO } from '../../assets/images'

/**
 * Shared frame for every unauthenticated screen: photography on the left from
 * 980px, the form on the right, one column below that.
 */
export default function AuthShell({ children, quote, image = PHOTO.houseWhite, back }) {
  return (
    <div className="auth">
      <div className="auth__media">
        <img src={hero(image)} alt="" />
        <div className="auth__media-body">
          <p className="u-eyebrow" style={{ color: 'rgba(255,255,255,.72)' }}>
            My30A Host
          </p>
          <p className="auth__quote">
            {quote ?? 'Everything your guests need, answered before they have to ask.'}
          </p>
        </div>
      </div>

      <div className="auth__panel">
        {back ? (
          <Link to={back.to} className="u-row" style={{ gap: 8, alignSelf: 'flex-start' }}>
            <Icon name="arrowLeft" size={18} />
            <span className="u-small">{back.label}</span>
          </Link>
        ) : (
          <span className="u-row" style={{ gap: 8, alignSelf: 'flex-start' }}>
            <span className="hside__mark" aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 10 }}>
              <Icon name="waves" size={17} />
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem' }}>
              My30A <span className="htop__brand-tag">Host</span>
            </span>
          </span>
        )}

        {children}
      </div>
    </div>
  )
}
