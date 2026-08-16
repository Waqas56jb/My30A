import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import Icon from '../ui/Icon'
import { experienceRoute } from '../../data/mockExperiences'
import { cx } from '../../utils/format'

/**
 * The lifestyle tile: photograph first, invitation second, provider list only
 * once you are inside. No prices or ratings here on purpose.
 */
export default function ExperienceTile({ experience, tall = false, eager = false }) {
  return (
    <Link
      to={experienceRoute(experience)}
      className={cx('exp-tile', tall && 'exp-tile--tall')}
      aria-label={`${experience.label} — ${experience.tagline}`}
    >
      <SmartImage
        photoId={experience.image}
        alt=""
        fill
        width={tall ? 900 : 640}
        eager={eager}
      />
      <span className="exp-tile__scrim" aria-hidden="true" />
      <span className="exp-tile__icon" aria-hidden="true">
        <Icon name={experience.icon} />
      </span>
      <span className="exp-tile__body">
        <span className="exp-tile__label">{experience.label}</span>
        <span className="exp-tile__tagline u-clamp-2">{experience.tagline}</span>
        <span className="exp-tile__go">
          Explore {experience.label.toLowerCase()}
          <Icon name="arrowRight" />
        </span>
      </span>
    </Link>
  )
}
