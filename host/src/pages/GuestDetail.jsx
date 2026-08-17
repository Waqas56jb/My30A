import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button, { IconButton } from '../components/ui/Button'
import { Avatar, DefinitionList, Callout } from '../components/ui/Display'
import { SkeletonPage } from '../components/ui/Skeleton'
import { ErrorState, EmptyState } from '../components/ui/States'
import { Panel, AccessBadge, ActivityList } from '../components/HostUI'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as guestService from '../services/guestService'
import * as vitoriaService from '../services/vitoriaService'
import { useWorkspace } from '../context/WorkspaceContext'
import { formatDateRange, formatRelative, formatDate } from '../utils/format'

export default function GuestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { properties } = useWorkspace()

  const guest = useAsync(() => guestService.getGuest(id), [id])
  const activity = useAsync(() => guestService.getGuestActivity(id), [id])
  const conversations = useAsync(() => vitoriaService.listConversations({}), [])

  useDocumentTitle(guest.data?.name)

  if (guest.loading) return <SkeletonPage />
  if (guest.error || !guest.data) {
    return (
      <div className="hpage">
        <ErrorState title="We could not find that guest" error={guest.error} onRetry={guest.reload} />
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Button variant="secondary" to="/host/guests">
            Back to guests
          </Button>
        </div>
      </div>
    )
  }

  const data = guest.data
  const property = properties.find((item) => item.id === data.propertyId)
  const theirConversations = (conversations.data ?? []).filter((conv) => conv.guestId === data.id)

  return (
    <div className="hpage">
      <div className="u-row" style={{ marginBottom: 'var(--sp-3)' }}>
        <IconButton icon="arrowLeft" label="Back to guests" onClick={() => navigate('/host/guests')} />
        <span className="u-xs u-muted">All guests</span>
      </div>

      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div className="u-row" style={{ gap: 'var(--sp-3)', minWidth: 0 }}>
          <Avatar src={data.avatar} name={data.name} size="lg" />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'var(--fs-h2)' }}>{data.name}</h1>
            <div className="u-row" style={{ marginTop: 4 }}>
              <AccessBadge status={data.accessStatus} />
              <span className="u-xs u-muted">
                {formatDateRange(data.checkIn, data.checkOut)} · {data.partySize} guests
              </span>
            </div>
          </div>
        </div>

        {property && (
          <Button variant="secondary" to={`/host/properties/${property.id}`} icon="building">
            {property.name}
          </Button>
        )}
      </header>

      <div className="hgrid hgrid--main-aside">
        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel title="Activity" subtitle="What this guest has done in the app" flush>
            {activity.loading && (
              <div style={{ padding: 'var(--sp-4)' }}>
                <SkeletonPage />
              </div>
            )}
            {!activity.loading && (
              <ActivityList
                items={activity.data ?? []}
                emptyLabel="This guest has not opened their link yet. Nothing to show until they do."
              />
            )}
          </Panel>

          <Panel
            title="Vitoria conversations"
            subtitle={`${data.conversations} in total`}
            action={
              <Link to="/host/vitoria" className="u-small" style={{ color: 'var(--sea-700)', fontWeight: 600 }}>
                All conversations
              </Link>
            }
            flush
          >
            {theirConversations.length === 0 ? (
              <div style={{ padding: 'var(--sp-4)' }}>
                <EmptyState
                  icon="sparkles"
                  title="No conversations yet"
                  message="When this guest asks Vitoria something, a summary appears here."
                  plain
                />
              </div>
            ) : (
              theirConversations.map((conv) => (
                <Link
                  key={conv.id}
                  to={`/host/vitoria?conversation=${conv.id}`}
                  className="activity-row"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="activity-row__icon" aria-hidden="true">
                    <Icon name={conv.resolved ? 'sparkles' : 'alert'} />
                  </span>
                  <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <div className="activity-row__title">{conv.summary}</div>
                    <div className="activity-row__time">
                      {conv.topic} · {formatRelative(conv.at)}
                      {!conv.resolved && ' · needs your input'}
                    </div>
                  </div>
                  <Icon name="chevronRight" size={16} style={{ color: 'var(--ink-300)', flex: 'none' }} />
                </Link>
              ))
            )}
          </Panel>

          {data.topTopics.length > 0 && (
            <Panel title="What they were interested in">
              <div className="chips chips--wrap">
                {data.topTopics.map((topic) => (
                  <span key={topic} className="chip" style={{ cursor: 'default' }}>
                    {topic}
                  </span>
                ))}
              </div>
            </Panel>
          )}

          {data.feedback && (
            <Panel title="Feedback">
              <div className="u-row" style={{ gap: 4, marginBottom: 8 }}>
                {Array.from({ length: data.satisfaction ?? 0 }).map((_, i) => (
                  <Icon key={i} name="star" size={16} style={{ color: 'var(--gold)' }} />
                ))}
              </div>
              <p className="u-small" style={{ color: 'var(--ink-700)', fontStyle: 'italic', lineHeight: 1.65 }}>
                “{data.feedback}”
              </p>
            </Panel>
          )}
        </div>

        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel title="Stay">
            <DefinitionList
              rows={[
                { key: 'Property', value: property?.name ?? '—' },
                { key: 'Check-in', value: formatDate(data.checkIn, { weekday: 'short', month: 'short', day: 'numeric' }) },
                { key: 'Check-out', value: formatDate(data.checkOut, { weekday: 'short', month: 'short', day: 'numeric' }) },
                { key: 'Party size', value: `${data.partySize} guests` },
                { key: 'Returning guest', value: data.returning ? 'Yes' : 'First stay' },
              ]}
            />
          </Panel>

          <Panel title="Access">
            <DefinitionList
              rows={[
                { key: 'Status', value: <AccessBadge status={data.accessStatus} /> },
                {
                  key: 'First opened',
                  value: data.accessedAt ? formatRelative(data.accessedAt) : 'Not yet',
                },
                { key: 'Last active', value: data.lastActive ? formatRelative(data.lastActive) : 'Not yet' },
              ]}
            />
          </Panel>

          <Panel title="Contact">
            <DefinitionList
              rows={[
                { key: 'Email', value: data.email },
                { key: 'Phone', value: data.phone },
              ]}
            />
            <div className="hstack" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
              <Button size="sm" variant="secondary" block icon="mail" href={`mailto:${data.email}`} target="_self">
                Email guest
              </Button>
              <Button size="sm" variant="ghost" block icon="phone" href={`tel:${data.phone}`} target="_self">
                Call guest
              </Button>
            </div>
          </Panel>

          <Callout icon="lock">
            Contact details are here so you can reach a guest about their stay. They are not shared
            with local partners or used for marketing.
          </Callout>
        </div>
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
