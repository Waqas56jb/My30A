import { Link } from 'react-router-dom'
import SmartImage from '../ui/SmartImage'
import Icon from '../ui/Icon'
import { Avatar } from '../ui/Display'
import { resolveEntity } from '../../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../../services/analytics'
import { cx, formatTime, formatDistance } from '../../utils/format'

const routeFor = (kind, id) => {
  switch (kind) {
    case 'restaurant':
      return `/restaurants/${id}`
    case 'beach':
      return `/beaches/${id}`
    case 'event':
      return `/events/${id}`
    default:
      return `/partners/${id}`
  }
}

/** Rich entity card attached to one of Vitoria's replies. */
function MiniCard({ card }) {
  const entity = resolveEntity(card.refId)
  if (!entity) return null
  const name = entity.name ?? entity.title
  const sub =
    entity.type === 'beach'
      ? `${entity.walkTime ?? ''} · ${entity.location}`
      : entity.title
        ? `${entity.time} · ${entity.location}`
        : `${entity.cuisine ?? entity.category} · ${formatDistance(entity.distance)}`

  return (
    <Link to={routeFor(card.kind, card.refId)} className="mini-card">
      <span className="mini-card__media">
        <SmartImage photoId={entity.image} alt="" ratio="1x1" width={180} />
      </span>
      <span className="mini-card__body">
        <span className="mini-card__title u-clamp-2">{name}</span>
        <span className="mini-card__sub u-truncate">{sub}</span>
      </span>
      <Icon name="chevronRight" className="mini-card__chev" style={{ width: 16, height: 16 }} />
    </Link>
  )
}

/**
 * Renders a very small subset of markdown (**bold**) so replies can emphasise
 * names and prices without pulling in a parser.
 */
function RichText({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}

/** One message row: avatar, bubble, optional cards and quick actions. */
export default function ChatBubble({ message, guest, showAvatar = true }) {
  const isUser = message.role === 'user'

  return (
    <div className={cx('bubble-row', isUser ? 'bubble-row--user' : 'bubble-row--ai')}>
      {showAvatar ? (
        <Avatar
          className="bubble-row__avatar"
          size="sm"
          vitoria={!isUser}
          src={isUser ? guest?.avatar : undefined}
          name={isUser ? guest?.firstName : 'Vitoria'}
        />
      ) : (
        <span className="bubble-row__avatar" style={{ width: 32 }} aria-hidden="true" />
      )}

      <div className="bubble-col">
        <div className={cx('bubble', isUser ? 'bubble--user' : 'bubble--ai')}>
          <RichText text={message.text} />
        </div>

        {message.cards?.length > 0 && (
          <div className="bubble-cards">
            {message.cards.map((card, i) => (
              <MiniCard key={`${card.refId}-${i}`} card={card} />
            ))}
          </div>
        )}

        {message.actions?.length > 0 && (
          <div className="bubble-actions">
            {message.actions.map((action) => (
              <Link
                key={action.to + action.label}
                to={action.to}
                className="bubble-action"
                onClick={() =>
                  track(ANALYTICS_EVENTS.VITORIA_ACTION_CLICKED, {
                    label: action.label,
                    to: action.to,
                  })
                }
              >
                {action.icon && <Icon name={action.icon} />}
                {action.label}
              </Link>
            ))}
          </div>
        )}

        <span className="bubble__time">
          {formatTime(message.at)}
          {message.pending && ' · sending'}
        </span>
      </div>
    </div>
  )
}

/** Animated "Vitoria is typing" bubble. */
export function TypingIndicator() {
  return (
    <div className="bubble-row bubble-row--ai" aria-live="polite">
      <Avatar className="bubble-row__avatar" size="sm" vitoria />
      <div className="typing" role="status" aria-label="Vitoria is typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}

/** Date break between message groups. */
export function DateSeparator({ label }) {
  return (
    <div className="chat-date" role="separator" aria-label={label}>
      {label}
    </div>
  )
}
