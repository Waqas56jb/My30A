import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { cx, formatRelative } from '../../utils/format'
import { track, ANALYTICS_EVENTS } from '../../services/analytics'

/** A single row in the notification centre. */
export default function NotificationItem({ notification, onRead }) {
  const navigate = useNavigate()

  const open = () => {
    if (!notification.read) onRead?.(notification.id)
    track(ANALYTICS_EVENTS.NOTIFICATION_OPENED, {
      notificationId: notification.id,
      type: notification.type,
    })
    if (notification.link) navigate(notification.link)
  }

  return (
    <button
      type="button"
      className={cx('notif', !notification.read && 'notif--unread')}
      onClick={open}
    >
      <span className="notif__icon" aria-hidden="true">
        <Icon name={notification.icon ?? 'bell'} />
      </span>
      <span className="u-grow" style={{ minWidth: 0 }}>
        <span className="notif__title">{notification.title}</span>
        <span className="notif__msg">{notification.message}</span>
        <span className="notif__time">{formatRelative(notification.createdAt)}</span>
      </span>
      {!notification.read && (
        <>
          <span className="notif__unread-dot" aria-hidden="true" />
          <span className="sr-only">Unread</span>
        </>
      )}
    </button>
  )
}
