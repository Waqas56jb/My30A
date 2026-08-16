import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import Icon, { IconSolid } from '../ui/Icon'
import { Badge } from '../ui/StatusBadge'
import { RatingStars, PriceDisplay, MetaRow } from '../ui/Display'
import { useApp } from '../../context/AppContext'
import { cx, formatDistance, priceLevelLabel } from '../../utils/format'

/**
 * The catalogue card used by restaurants, partners, and beaches. One
 * component keeps spacing, image ratio, and the save control identical
 * everywhere, and each wrapper below only decides what metadata to surface.
 */
export default function PlaceCard({
  item,
  to,
  layout = 'stack',
  showSave = true,
  footer,
  eager = false,
  className,
}) {
  const { isSaved, toggleSaved } = useApp()
  const saved = isSaved(item.id)

  const onSave = (event) => {
    event.preventDefault()
    event.stopPropagation()
    toggleSaved(item.id, item.name)
  }

  return (
    <Link
      to={to}
      className={cx('card place-card', layout === 'row' && 'place-card--row', className)}
      aria-label={item.name}
    >
      <div className="place-card__media">
        <SmartImage
          photoId={item.image}
          alt={item.name}
          ratio={layout === 'row' ? '1x1' : '3x2'}
          width={layout === 'row' ? 320 : 640}
          eager={eager}
          zoom={layout !== 'row'}
        />
        {layout !== 'row' && (
          <div className="place-card__badges">
            {item.featured ? (
              <Badge tone="glass">Featured</Badge>
            ) : item.walkable ? (
              <Badge tone="glass">Walkable</Badge>
            ) : (
              <span />
            )}
            {showSave && (
              <button
                type="button"
                className="place-card__fav"
                aria-pressed={saved}
                aria-label={saved ? `Remove ${item.name} from saved` : `Save ${item.name}`}
                onClick={onSave}
              >
                {saved ? <IconSolid name="heart" /> : <Icon name="heart" />}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="place-card__body">
        <h3 className="place-card__title u-clamp-2">{item.name}</h3>
        <MetaRow
          items={[
            item.cuisine ?? item.category,
            item.distance !== undefined ? formatDistance(item.distance) : item.location,
          ]}
        />
        {item.shortDescription && (
          <p className="place-card__desc u-clamp-2">{item.shortDescription}</p>
        )}

        <div className="place-card__foot">
          {item.rating ? <RatingStars value={item.rating} count={item.reviewCount} /> : <span />}
          {footer ??
            (item.startingPrice ? (
              <PriceDisplay amount={item.startingPrice} />
            ) : item.priceLevel ? (
              <span className="u-xs u-muted" aria-label={`Price level ${item.priceLevel} of 4`}>
                {priceLevelLabel(item.priceLevel)}
              </span>
            ) : null)}
        </div>
      </div>
    </Link>
  )
}

export const RestaurantCard = ({ item, ...rest }) => (
  <PlaceCard item={item} to={`/restaurants/${item.id}`} {...rest} />
)

export const PartnerCard = ({ item, ...rest }) => (
  <PlaceCard item={item} to={`/partners/${item.id}`} {...rest} />
)

export const BeachCard = ({ item, ...rest }) => (
  <PlaceCard
    item={item}
    to={`/beaches/${item.id}`}
    footer={item.walkTime ? <span className="u-xs u-muted">{item.walkTime}</span> : null}
    {...rest}
  />
)
