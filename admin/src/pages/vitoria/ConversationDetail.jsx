import { Link, useParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { PageHeader, Panel, Grid, Facts, StatusPill } from '../../components/common/AdminUI'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { CONVERSATION_STATUSES } from '../../data/conversations'
import { formatDate, formatTime } from '../../utils/format'
import { propertyPath } from '../../utils/paths'

/**
 * One conversation.
 *
 * Support needs to read what was actually said to answer an escalation — but
 * the guest's contact details are one click away on their own page rather than
 * printed here. There is no reason to put a phone number on a screen someone
 * is reading to find out which beach is quiet.
 */
export default function ConversationDetail() {
  const { id } = useParams()
  const { data, loading, error, reload } = useLoad(() => api.getConversation(id), [id])

  useDocumentTitle(data?.topic ? `${data.topic} · ${data.guestName}` : 'Conversation')

  if (loading) return <SkeletonPage />
  if (error) return <ErrorState error={error} onRetry={reload} title="We could not open that" />
  if (!data) return <ErrorState error={{ message: 'Conversation not found' }} onRetry={reload} title="We could not open that" />

  const messages = data.messages ?? []
  const guestInitial = (data.guestName || 'G').slice(0, 1)

  return (
    <div className="apage">
      <PageHeader
        title={`${data.topic} · ${data.guestName}`}
        subtitle={`${data.propertyName} · ${data.language} · ${data.messageCount} messages`}
        back={{ to: '/admin/vitoria/conversations', label: 'All conversations' }}
        actions={
          <>
            <StatusPill map={CONVERSATION_STATUSES} value={data.status} />
            <Button to={`/admin/guests/${data.guestId}`} size="sm" variant="secondary" icon="user">
              Guest record
            </Button>
          </>
        }
      />

      {data.status === 'escalated' && (
        <Callout icon="alert" tone="warn">
          <strong style={{ display: 'block', marginBottom: 2 }}>Escalated to the team</strong>
          Vitoria decided this needed a person. Someone should pick it up — an escalation with no
          human reply is the one failure mode that actually matters.
        </Callout>
      )}

      {data.createdRequest && (
        <Callout icon="sparkles">
          <strong style={{ display: 'block', marginBottom: 2 }}>
            This conversation created a {String(data.createdRequest.label ?? data.createdRequest.kind ?? 'request').toLowerCase()}
          </strong>
          Vitoria collected the details and raised the request. It appears in the operations queue
          for a human to confirm — she never confirms a booking or takes a payment herself.
        </Callout>
      )}

      <Grid cols={2}>
        <Panel title="Conversation">
          <div className="convo">
            {messages.length === 0 ? (
              <p className="u-small u-muted">No messages stored for this conversation yet.</p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`convo__msg convo__msg--${message.role}`}>
                  <span className="convo__avatar" aria-hidden="true">
                    {message.role === 'vitoria' ? 'V' : guestInitial}
                  </span>
                  <span className="convo__bubble">{message.text}</span>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Details">
          <Facts
            items={[
              { label: 'Conversation id', value: data.id },
              {
                label: 'Guest',
                value: <Link to={`/admin/guests/${data.guestId}`}>{data.guestName}</Link>,
              },
              {
                label: 'Property',
                value: <Link to={propertyPath({ id: data.propertyId, propertyId: data.propertyId })}>{data.propertyName}</Link>,
              },
              { label: 'Topic', value: data.topic },
              { label: 'Language', value: data.language },
              { label: 'Messages', value: data.messageCount },
              { label: 'Average reply', value: `${data.responseSeconds}s` },
              { label: 'Satisfaction', value: data.satisfaction ? `${data.satisfaction} / 5` : 'Not rated' },
              { label: 'Started', value: `${formatDate(data.createdAt)} at ${formatTime(data.createdAt)}` },
              {
                label: 'Actions taken',
                value: data.createdRequest ? (data.createdRequest.label ?? 'Service request') : 'Answered from the knowledge base',
              },
            ]}
          />
        </Panel>
      </Grid>
    </div>
  )
}
