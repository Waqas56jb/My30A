import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { FilterChips } from '../components/ui/Form'
import { Section } from '../components/ui/Display'
import { EmptyState } from '../components/ui/States'
import NotificationItem from '../components/cards/NotificationItem'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDayLabel } from '../utils/format'

const FILTERS = ['All', 'Unread', 'Services', 'Property', 'Vitoria']

const matches = (notification, filter) => {
  switch (filter) {
    case 'Unread':
      return !notification.read
    case 'Services':
      return ['grocery', 'transfer'].includes(notification.type)
    case 'Property':
      return notification.type === 'property'
    case 'Vitoria':
      return notification.type === 'vitoria'
    default:
      return true
  }
}

export default function Notifications() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp()
  const [filter, setFilter] = useState('All')
  useDocumentTitle('Notifications')

  const visible = useMemo(
    () => notifications.filter((n) => matches(n, filter)),
    [notifications, filter],
  )

  /** Group by day so the feed reads chronologically. */
  const groups = useMemo(() => {
    const map = new Map()
    visible.forEach((notification) => {
      const label = formatDayLabel(notification.createdAt)
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(notification)
    })
    return [...map.entries()]
  }, [visible])

  return (
    <div className="page">
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
        back
        backTo="/"
        actions={
          unreadCount > 0 ? (
            <Button size="sm" variant="secondary" onClick={markAllNotificationsRead} icon="check">
              Mark all read
            </Button>
          ) : null
        }
      />

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} label="Filter notifications" />

      {visible.length === 0 ? (
        <div style={{ marginTop: 'var(--sp-6)' }}>
          <EmptyState
            icon="bell"
            title={filter === 'Unread' ? 'Nothing unread' : 'No notifications yet'}
            message={
              filter === 'Unread'
                ? 'You’ve read everything. We’ll let you know as soon as anything changes.'
                : 'Updates about your requests, your property, and anything Vitoria finds for you will land here.'
            }
            actionLabel="Back to home"
            actionTo="/"
          />
        </div>
      ) : (
        groups.map(([label, list]) => (
          <Section key={label} title={label} className="section">
            <div className="u-stack" style={{ gap: 'var(--sp-2)' }}>
              {list.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markNotificationRead}
                />
              ))}
            </div>
          </Section>
        ))
      )}

      <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-6)', textAlign: 'center' }}>
        Push and email notifications are mocked in this prototype. Delivery preferences live in{' '}
        <Link to="/settings" style={{ color: 'var(--sea-700)' }}>
          Settings
        </Link>
        .
      </p>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
