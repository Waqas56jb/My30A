import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { FilterChips } from '../components/ui/Form'
import { EmptyState } from '../components/ui/States'
import { Panel } from '../components/PartnerUI'
import { usePartner } from '../context/PartnerContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDayLabel, formatRelative } from '../utils/format'

const FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'performance', label: 'Performance' },
  { value: 'status', label: 'Listing status' },
  { value: 'profile', label: 'Profile' },
]

export default function Notifications() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = usePartner()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  useDocumentTitle('Notifications')

  const visible = useMemo(
    () =>
      notifications.filter((item) => {
        if (filter === 'All') return true
        if (filter === 'unread') return !item.read
        return item.type === filter
      }),
    [notifications, filter],
  )

  const groups = useMemo(() => {
    const map = new Map()
    visible.forEach((item) => {
      const label = formatDayLabel(item.at)
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(item)
    })
    return [...map.entries()]
  }, [visible])

  const open = (item) => {
    if (!item.read) markNotificationRead(item.id)
    if (item.link) navigate(item.link)
  }

  return (
    <div className="ppage ppage--narrow">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Notifications</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" icon="check" onClick={markAllNotificationsRead}>
            Mark all read
          </Button>
        )}
      </header>

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} label="Filter notifications" wrap />

      <div style={{ marginTop: 'var(--sp-4)' }}>
        {visible.length === 0 ? (
          <EmptyState
            icon="bell"
            title={filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
            message={
              filter === 'unread'
                ? "You're all caught up."
                : 'Listing approvals, weekly performance and profile changes will land here.'
            }
          />
        ) : (
          groups.map(([label, items]) => (
            <div key={label} style={{ marginBottom: 'var(--sp-5)' }}>
              <p className="pside__label" style={{ padding: '0 0 var(--sp-2)' }}>
                {label}
              </p>
              <Panel flush>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`notif${item.read ? '' : ' notif--unread'}`}
                    onClick={() => open(item)}
                  >
                    <span
                      className="notif__icon"
                      aria-hidden="true"
                      style={
                        item.type === 'status' && item.icon === 'alert'
                          ? { background: 'var(--warn-bg)', color: 'var(--warn)' }
                          : undefined
                      }
                    >
                      <Icon name={item.icon} />
                    </span>
                    <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <span className="notif__title" style={{ fontWeight: item.read ? 500 : 600 }}>
                        {item.title}
                      </span>
                      <span className="notif__msg">{item.message}</span>
                      <span className="notif__time">{formatRelative(item.at)}</span>
                    </span>
                    {!item.read && (
                      <>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: 'var(--coral)',
                            flex: 'none',
                            marginTop: 8,
                          }}
                          aria-hidden="true"
                        />
                        <span className="sr-only">Unread</span>
                      </>
                    )}
                  </button>
                ))}
              </Panel>
            </div>
          ))
        )}
      </div>

      <p className="u-xs u-muted" style={{ textAlign: 'center', marginTop: 'var(--sp-5)' }}>
        Email delivery is mocked in this prototype. Choose what you hear about in Settings.
      </p>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
