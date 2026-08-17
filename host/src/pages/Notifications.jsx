import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { FilterChips } from '../components/ui/Form'
import { EmptyState } from '../components/ui/States'
import { Panel } from '../components/HostUI'
import { useWorkspace } from '../context/WorkspaceContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cx, formatDayLabel, formatRelative } from '../utils/format'

const FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'guest', label: 'Guests' },
  { value: 'vitoria', label: 'Vitoria' },
  { value: 'setup', label: 'Setup' },
  { value: 'feedback', label: 'Feedback' },
]

export default function Notifications() {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useWorkspace()
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
    <div className="hpage" style={{ maxWidth: 860 }}>
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Notifications</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
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
            title={filter === 'unread' ? 'Nothing unread' : 'No notifications'}
            message={
              filter === 'unread'
                ? "You're all caught up."
                : 'Guest arrivals, feedback, and anything Vitoria could not answer will land here.'
            }
          />
        ) : (
          groups.map(([label, items]) => (
            <div key={label} style={{ marginBottom: 'var(--sp-5)' }}>
              <p className="hside__label" style={{ padding: '0 0 var(--sp-2)' }}>
                {label}
              </p>
              <Panel flush>
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="activity-row"
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: item.read ? undefined : 'var(--sea-50)',
                    }}
                    onClick={() => open(item)}
                  >
                    <span
                      className="activity-row__icon"
                      aria-hidden="true"
                      style={
                        item.type === 'vitoria'
                          ? { background: 'var(--warn-bg)', color: 'var(--warn)' }
                          : undefined
                      }
                    >
                      <Icon name={item.icon} />
                    </span>
                    <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <div
                        className="activity-row__title"
                        style={{ fontWeight: item.read ? 500 : 600 }}
                      >
                        {item.title}
                      </div>
                      <div className="u-xs u-muted" style={{ marginTop: 2, lineHeight: 1.5 }}>
                        {item.message}
                      </div>
                      <div className="activity-row__time">{formatRelative(item.at)}</div>
                    </div>
                    {!item.read && (
                      <>
                        <span
                          className="status-dot"
                          style={{ background: 'var(--coral)', marginTop: 8 }}
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

      <p className={cx('u-xs', 'u-muted')} style={{ textAlign: 'center', marginTop: 'var(--sp-5)' }}>
        Email and push delivery are mocked in this prototype. Choose what you want to hear about in
        Settings.
      </p>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
