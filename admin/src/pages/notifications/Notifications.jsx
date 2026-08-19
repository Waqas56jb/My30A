import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SkeletonList } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { SearchBar, FilterChips, Field, Input, Textarea, Select } from '../../components/ui/Form'
import { PageHeader, Panel, Stat, StatusPill, InlineEmpty } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import {
  NOTIFICATION_AUDIENCES, NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES,
} from '../../data/notifications'
import { formatDate, formatRelative, formatNumber } from '../../utils/format'

const AUDIENCE_FILTERS = [
  { value: 'all', label: 'All' },
  ...Object.entries(NOTIFICATION_AUDIENCES).map(([value, meta]) => ({ value, label: meta.label })),
]

const EMPTY = { title: '', message: '', audience: 'guest', channel: 'both' }

export default function Notifications() {
  useDocumentTitle('Notifications')
  const { pushToast } = useAdmin()

  const [search, setSearch] = useState('')
  const [audience, setAudience] = useState('all')
  const [status, setStatus] = useState('all')
  const [composing, setComposing] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useLoad(
    () => api.getNotifications({ search, audience, status }),
    [search, audience, status],
  )

  const create = async () => {
    if (!composing.title.trim() || !composing.message.trim()) {
      pushToast({ tone: 'error', title: 'A title and a message are both required' })
      return
    }
    setBusy(true)
    try {
      const result = await api.createNotification({
        title: composing.title.trim(),
        message: composing.message.trim(),
        audience: composing.audience,
        channel: composing.channel,
      })
      const emailed = Number(result?.emailed ?? 0)
      const recipients = Number(result?.recipients ?? 0)
      const failed = Number(result?.failed ?? 0)
      const tone =
        result?.status === 'failed' ? 'error' : 'success'
      pushToast({
        tone,
        title:
          result?.status === 'failed'
            ? 'Could not send'
            : result?.status === 'partial'
              ? 'Sent with some failures'
              : 'Notification sent',
        message: [
          recipients ? `${recipients} in-app` : null,
          emailed ? `${emailed} email` : composing.channel === 'push' ? null : `${emailed} email`,
          failed ? `${failed} failed` : null,
          result?.failureReason,
        ]
          .filter(Boolean)
          .join(' · '),
      })
      setComposing(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not send', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const rows = Array.isArray(data) ? data : []

  return (
    <div className="apage">
      <PageHeader
        title="Notifications"
        subtitle="Push and email messages to guests, hosts, partners and the admin team."
        actions={<Button icon="plus" onClick={() => setComposing({ ...EMPTY })}>New notification</Button>}
      />

      <Callout icon="info">
        In-app alerts go out immediately. Email uses the SMTP account on the backend.
        Browser push appears if the recipient has allowed notifications in their app.
      </Callout>

      <div className="astats">
        <Stat label="Notifications" value={rows.length} icon="bell" tone="sea" />
        <Stat label="Sent" value={rows.filter((n) => n.status === 'sent').length} icon="send" tone="success" />
        <Stat label="Partial" value={rows.filter((n) => n.status === 'partial').length} icon="clock" tone="info" />
        <Stat label="Failed" value={rows.filter((n) => n.status === 'failed').length} icon="alert" tone="danger" />
      </div>

      <Panel flush>
        <div className="ttoolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search title or message"
            label="Search notifications"
          />
          <Field label="Status">
            {(props) => (
              <Select {...props} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="all">All statuses</option>
                {Object.entries(NOTIFICATION_STATUSES).map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </Select>
            )}
          </Field>
          <FilterChips
            options={AUDIENCE_FILTERS}
            value={audience}
            onChange={setAudience}
            label="Filter by audience"
          />
        </div>

        <div style={{ padding: 'var(--sp-4)' }}>
          {loading && <SkeletonList count={5} />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && rows.length === 0 && (
            <InlineEmpty icon="bell" title="No notifications match those filters" />
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="activity">
              {rows.map((n) => {
                const audienceMeta = NOTIFICATION_AUDIENCES[n.audience]
                const channelMeta = NOTIFICATION_CHANNELS[n.channel]
                return (
                  <li className="activity__row" key={n.id} style={{ alignItems: 'flex-start' }}>
                    <span className="activity__icon" aria-hidden="true">
                      <Icon name={channelMeta?.icon ?? 'bell'} size={15} />
                    </span>
                    <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <span className="activity__title">
                        {n.title}
                      </span>
                      <span className="activity__body">{n.message}</span>
                      <span className="chiplist" style={{ marginTop: 7 }}>
                        <Badge tone={audienceMeta?.tone}>{audienceMeta?.label}</Badge>
                        <Badge>{channelMeta?.label}</Badge>
                        <StatusPill map={NOTIFICATION_STATUSES} value={n.status} />
                        {n.status !== 'failed' && (
                          <span className="u-xs u-muted">
                            {formatNumber(n.recipients)} in-app
                            {(n.channel === 'email' || n.channel === 'both') && (
                              <> · {formatNumber(n.emailed ?? 0)} emailed</>
                            )}
                            {n.opened > 0 && <> · {formatNumber(n.opened)} opened</>}
                          </span>
                        )}
                        {n.scheduledFor && (
                          <span className="u-xs u-muted">Scheduled for {formatDate(n.scheduledFor)}</span>
                        )}
                        {n.failureReason && <span className="u-xs" style={{ color: '#a2452f' }}>{n.failureReason}</span>}
                      </span>
                    </span>
                    <span className="tone-row" style={{ flex: 'none' }}>
                      <span className="activity__meta">
                        {formatRelative(n.sentAt ?? n.createdAt)}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Panel>

      <Modal
        open={!!composing}
        onClose={() => setComposing(null)}
        title="New notification"
        footer={
          <>
            <Button variant="secondary" onClick={() => setComposing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={create} loading={busy} icon="send">Send now</Button>
          </>
        }
      >
        {composing && (
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Title" required>
              {(p) => (
                <Input
                  {...p}
                  value={composing.title}
                  onChange={(e) => setComposing({ ...composing, title: e.target.value })}
                  placeholder="Your transfer has been confirmed"
                />
              )}
            </Field>

            <Field label="Message" hint="Keep it short — push notifications truncate." required>
              {(p) => (
                <Textarea
                  {...p}
                  rows={3}
                  value={composing.message}
                  onChange={(e) => setComposing({ ...composing, message: e.target.value })}
                  placeholder="A driver is reserved for your flight. You will be asked to authorise your card — a hold, not a charge."
                />
              )}
            </Field>

            <Field label="Audience">
              {(p) => (
                <Select
                  {...p}
                  value={composing.audience}
                  onChange={(e) => setComposing({ ...composing, audience: e.target.value })}
                >
                  {Object.entries(NOTIFICATION_AUDIENCES).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Channel">
              {(p) => (
                <Select
                  {...p}
                  value={composing.channel}
                  onChange={(e) => setComposing({ ...composing, channel: e.target.value })}
                >
                  {Object.entries(NOTIFICATION_CHANNELS).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
