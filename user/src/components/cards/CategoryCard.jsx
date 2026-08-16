import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import Icon from '../ui/Icon'

/** Image tile used across the Explore grid. */
export default function CategoryCard({ category, count }) {
  return (
    <Link className="cat-card" to={category.route} aria-label={`${category.label} — ${category.blurb}`}>
      <SmartImage photoId={category.image} alt="" ratio="1x1" width={420} fill zoom />
      <span className="cat-card__scrim" aria-hidden="true" />
      <span className="cat-card__icon" aria-hidden="true">
        <Icon name={category.icon} />
      </span>
      <span className="cat-card__body">
        <span className="cat-card__title">{category.label}</span>
        <span className="cat-card__count">
          {count !== undefined ? `${count} nearby` : category.blurb}
        </span>
      </span>
    </Link>
  )
}
