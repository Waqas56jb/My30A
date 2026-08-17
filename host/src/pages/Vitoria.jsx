import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { SearchBar, FilterChips, Checkbox } from '../components/ui/Form'
import { Callout } from '../components/ui/Display'
import { EmptyState, ErrorState } from '../components/ui/States'
import { SkeletonList } from '../components/ui/Skeleton'
import { Panel, Kpi } from '../components/HostUI'
import { RankBars, Donut } from '../components/charts/Charts'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as vitoriaService from '../services/vitoriaService'
import { CONVERSATION_TOPICS } from '../data/conversations'
import { formatRelative, formatTime } from '../utils/format'

/**
 * Vitoria, from the host's side: what guests asked, what she could not answer,
 * and how her introduction to this property is configured.
 */
export default function Vitoria() {
  const { activeProperty } = useWorkspace()
  const [params, setParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState('All')
  const [onlyUnresolved, setOnlyUnresolved] = useState(false)
  const [open, setOpen] = useState(null)

  useDocumentTitle('Vitoria')

  const propertyId = activeProperty?.id
  const summary = useAsync(() => vitoriaService.getVitoriaSummary(propertyId), [propertyId])
  const conversations = useAsync(
    () => vitoriaService.listConversations({ propertyId, search, topic, onlyUnresolved }),
    [propertyId, search, topic, onlyUnresolved],
  )

  // Deep link from a guest page: ?conversation=conv_3
  useEffect(() => {
    const id = params.get('conversation')
    if (!id || !conversations.data) return
    const found = conversations.data.find((conv) => conv.id === id)
    if (found) setOpen(found)
  }, [params, conversations.data])

  const closeConversation = () => {
    setOpen(null)
    if (params.get('conversation')) setParams({}, { replace: true })
  }

  const rows = conversations.data ?? []
  const data = summary.data

  return (
    <div className="hpage">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Vitoria</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            What your guests are asking at {activeProperty?.name ?? 'your property'}.
          </p>
        </div>
        {activeProperty && (
          <Button variant="secondary" to={`/host/properties/${activeProperty.id}/vitoria`} icon="settings">
            Configure Vitoria
          </Button>
        )}
      </header>

      <div className="kpi-grid">
        <Kpi icon="sparkles" label="Conversations" value={data?.total ?? '—'} />
        <Kpi icon="checkCircle" label="Answered" value={data?.resolved ?? '—'} />
        <Kpi
          icon="alert"
          label="Needs your input"
          value={data?.escalated ?? '—'}
          hint="Questions Vitoria could not answer"
        />
        <Kpi
          icon="star"
          label="Guest rating"
          value={data?.satisfaction ?? '—'}
          suffix={data?.satisfaction ? '★' : ''}
        />
      </div>

      <div className="hgrid hgrid--main-aside hsection">
        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          {(data?.escalated ?? 0) > 0 && (
            <Callout icon="alert">
              <strong style={{ display: 'block', marginBottom: 2 }}>
                {data.escalated} question{data.escalated === 1 ? '' : 's'} went unanswered
              </strong>
              Vitoria tells guests honestly when she does not know rather than guessing. Each one is
              usually a gap in your property information.
              <div style={{ marginTop: 'var(--sp-3)' }}>
                <Button size="sm" variant="secondary" onClick={() => setOnlyUnresolved(true)}>
                  Show only those
                </Button>
              </div>
            </Callout>
          )}

          <Panel title="Conversations" flush>
            <div style={{ padding: 'var(--sp-4)' }}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search conversations"
                label="Search conversations"
              />
              <div className="u-between u-wrap" style={{ gap: 'var(--sp-3)', marginTop: 'var(--sp-3)' }}>
                <FilterChips
                  options={CONVERSATION_TOPICS}
                  value={topic}
                  onChange={setTopic}
                  label="Filter by topic"
                  wrap
                />
                <Checkbox checked={onlyUnresolved} onChange={setOnlyUnresolved}>
                  Unanswered only
                </Checkbox>
              </div>
            </div>

            {conversations.loading && (
              <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
                <SkeletonList count={3} />
              </div>
            )}
            {conversations.error && (
              <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
                <ErrorState error={conversations.error} onRetry={conversations.reload} />
              </div>
            )}

            {!conversations.loading && rows.length === 0 && (
              <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
                <EmptyState
                  icon="sparkles"
                  title={search || topic !== 'All' || onlyUnresolved ? 'Nothing matched' : 'No conversations yet'}
                  message={
                    search || topic !== 'All' || onlyUnresolved
                      ? 'Try clearing the filters.'
                      : 'Once a guest opens their link and asks Vitoria something, summaries appear here.'
                  }
                  plain
                />
              </div>
            )}

            {!conversations.loading &&
              rows.map((conv) => (
                <button key={conv.id} type="button" className="activity-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(conv)}>
                  <span
                    className="activity-row__icon"
                    aria-hidden="true"
                    style={
                      conv.resolved ? undefined : { background: 'var(--warn-bg)', color: 'var(--warn)' }
                    }
                  >
                    <Icon name={conv.resolved ? 'message' : 'alert'} />
                  </span>
                  <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <div className="activity-row__title">{conv.summary}</div>
                    <div className="activity-row__time">
                      {conv.guestName} · {conv.topic} · {formatRelative(conv.at)} · {conv.messages}{' '}
                      messages
                      {!conv.resolved && ' · unanswered'}
                    </div>
                  </div>
                  <Icon name="chevronRight" size={16} style={{ color: 'var(--ink-300)', flex: 'none' }} />
                </button>
              ))}
          </Panel>
        </div>

        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel title="Most common questions" subtitle="Across all guests at this property">
            {summary.loading && <SkeletonList count={2} />}
            {!summary.loading && (
              <RankBars
                data={(data?.topQuestions ?? []).map((item) => ({
                  label: item.question,
                  value: item.count,
                  tone: item.answered ? undefined : 'sand',
                }))}
              />
            )}
            <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-4)' }}>
              <span
                className="chart__swatch"
                style={{ background: 'var(--sand-500)', display: 'inline-block', verticalAlign: '-1px', marginRight: 6 }}
              />
              Sand bars are questions Vitoria could not fully answer.
            </p>
          </Panel>

          {data && data.total > 0 && (
            <Panel title="Answer rate">
              <Donut
                segments={[
                  { label: 'Answered', value: data.resolved, color: 'var(--sea-500)' },
                  { label: 'Needs you', value: data.escalated, color: 'var(--sand-500)' },
                ]}
                centerValue={`${Math.round((data.resolved / data.total) * 100)}%`}
                centerLabel="answered"
              />
            </Panel>
          )}

          <Panel title="How Vitoria works here">
            <p className="u-small u-muted" style={{ lineHeight: 1.65 }}>
              She answers property questions from the information you have entered, and 30A questions
              from our local directory. You do not need to reply to guests yourself.
            </p>
            {activeProperty && (
              <Link
                to={`/host/properties/${activeProperty.id}/vitoria`}
                className="u-small"
                style={{ color: 'var(--sea-700)', fontWeight: 600, display: 'inline-block', marginTop: 10 }}
              >
                Edit her welcome message →
              </Link>
            )}
          </Panel>
        </div>
      </div>

      {/* --------------------------- Transcript --------------------------- */}
      <Modal
        open={!!open}
        onClose={closeConversation}
        wide
        title={open?.topic}
        subtitle={open ? `${open.guestName} · ${formatRelative(open.at)}` : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={closeConversation}>
              Close
            </Button>
            {open && !open.resolved && activeProperty && (
              <Button to={`/host/properties/${activeProperty.id}/information`} icon="edit">
                Update property info
              </Button>
            )}
          </>
        }
      >
        {open && (
          <>
            {!open.resolved && (
              <Callout icon="alert" className="hsection" style={{ marginTop: 0, marginBottom: 'var(--sp-4)' }}>
                Vitoria could not answer this from your property information.
              </Callout>
            )}
            <div className="convo">
              {open.transcript.map((message, i) => (
                <div
                  key={i}
                  className={`convo__msg convo__msg--${message.role === 'guest' ? 'guest' : 'ai'}`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <p className="convo__time" style={{ marginTop: 'var(--sp-4)', textAlign: 'center' }}>
              {open.messages} messages · last at {formatTime(open.at)}
            </p>
          </>
        )}
      </Modal>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
