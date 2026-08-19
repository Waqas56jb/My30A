import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import SmartImage from '../ui/SmartImage'
import Icon from '../ui/Icon'
import { Avatar } from '../ui/Display'
import { resolveEntity } from '../../services/mockApi'
import { track, ANALYTICS_EVENTS } from '../../services/analytics'
import { cx, formatTime, formatDistance } from '../../utils/format'
import { eventCover, placeCover } from '../../utils/listingImages'

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
  const [entity, setEntity] = useState(card?.name ? card : null)

  useEffect(() => {
    let cancelled = false
    if (card?.name && card?.image) {
      setEntity(card)
      return undefined
    }
    resolveEntity(card.refId).then((row) => {
      if (!cancelled && row) setEntity({ ...card, ...row })
    })
    return () => {
      cancelled = true
    }
  }, [card])

  if (!entity && !card?.name) return null
  const item = entity ?? card
  const kind = card.kind ?? item.type
  const name = item.name ?? item.title
  const isEvent = kind === 'event' || Boolean(item.title && item.date)
  const cover = isEvent ? eventCover(item) : placeCover({ ...item, type: kind })
  const sub = isEvent
    ? [item.time, item.location].filter(Boolean).join(' · ')
    : [item.subtitle ?? item.cuisine ?? item.category, item.distance !== undefined ? formatDistance(item.distance) : item.location]
        .filter(Boolean)
        .join(' · ')

  return (
    <Link to={routeFor(kind, card.refId)} className="mini-card">
      <span className="mini-card__media">
        <SmartImage photoId={cover} alt="" ratio="1x1" width={180} />
      </span>
      <span className="mini-card__body">
        <span className="mini-card__title u-clamp-2">{name}</span>
        <span className="mini-card__sub u-truncate">{sub}</span>
      </span>
      <Icon name="chevronRight" className="mini-card__chev" style={{ width: 16, height: 16 }} />
    </Link>
  )
}

function MarkdownLink({ href, children }) {
  if (!href) return <span>{children}</span>
  if (href.startsWith('/')) {
    return <Link to={href}>{children}</Link>
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

function MarkdownImage({ src, alt }) {
  if (!src) return null
  return (
    <span className="bubble-md__photo">
      <SmartImage photoId={src} alt={alt || ''} ratio="16x9" width={720} />
    </span>
  )
}

function MarkdownMessage({ text }) {
  return (
    <Markdown
      remarkPlugins={[remarkBreaks]}
      components={{
        a: MarkdownLink,
        img: MarkdownImage,
      }}
    >
      {text}
    </Markdown>
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
        <div className={cx('bubble', isUser ? 'bubble--user' : 'bubble--ai bubble-md')}>
          {isUser ? message.text : <MarkdownMessage text={message.text ?? ''} />}
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
