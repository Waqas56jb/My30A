import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal, { ConfirmModal } from '../../components/ui/Modal'
import { SkeletonList } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { SearchBar, FilterChips, Field, Input, Textarea, Select, Switch } from '../../components/ui/Form'
import { PageHeader, Panel, Stat, InlineEmpty } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { KNOWLEDGE_SOURCES, KNOWLEDGE_TYPES } from '../../data/knowledge'
import { formatDate, formatNumber } from '../../utils/format'

const SOURCE_FILTERS = [
  { value: 'all', label: 'All sources' },
  ...Object.entries(KNOWLEDGE_SOURCES).map(([value, meta]) => ({ value, label: meta.label })),
]

const EMPTY = { question: '', answer: '', type: KNOWLEDGE_TYPES[0], source: 'admin' }

/**
 * The knowledge base Vitoria answers from.
 *
 * This is the editorial surface only — there is no vector database, no
 * embeddings and no retrieval here. What a human actually operates is the
 * workflow around the content: who wrote it, where it came from, whether it is
 * live. That part is real; the retrieval underneath it is not built yet.
 */
export default function Knowledge() {
  useDocumentTitle('Vitoria knowledge')
  const { pushToast } = useAdmin()

  const [search, setSearch] = useState('')
  const [source, setSource] = useState('all')
  const [type, setType] = useState('all')
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const { data, loading, error, reload } = useLoad(
    () => api.getKnowledge({ search, source, type }),
    [search, source, type],
  )

  const save = async () => {
    if (!editing.question.trim() || !editing.answer.trim()) {
      pushToast({ tone: 'error', title: 'A question and an answer are both required' })
      return
    }
    setBusy(true)
    try {
      await api.saveKnowledge(editing)
      pushToast({ tone: 'success', title: editing.id ? 'Entry updated' : 'Entry added' })
      setEditing(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.deleteKnowledge(confirmDelete.id)
      pushToast({ tone: 'success', title: 'Entry deleted' })
      setConfirmDelete(null)
      reload()
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (entry) => {
    await api.saveKnowledge({ ...entry, enabled: !entry.enabled })
    pushToast({
      tone: 'info',
      title: entry.enabled ? 'Entry disabled' : 'Entry enabled',
      message: entry.enabled ? 'Vitoria will stop using this answer.' : 'Vitoria can use this answer again.',
    })
    reload()
  }

  const rows = Array.isArray(data) ? data : []

  return (
    <div className="apage">
      <PageHeader
        title="Knowledge"
        subtitle="What Vitoria knows, and where each answer came from."
        actions={<Button icon="plus" onClick={() => setEditing({ ...EMPTY })}>Add entry</Button>}
      />

      <Callout icon="info">
        <strong style={{ display: 'block', marginBottom: 2 }}>Management interface only</strong>
        Entries will eventually be embedded and retrieved when Vitoria answers. No vector database
        is connected yet — this screen manages the content, not the retrieval.
      </Callout>

      <div className="astats">
        <Stat label="Entries" value={rows.length} icon="info" tone="sea" />
        <Stat label="Enabled" value={rows.filter((r) => r.enabled).length} icon="checkCircle" tone="success" />
        <Stat label="Disabled" value={rows.filter((r) => !r.enabled).length} icon="eyeOff" tone="danger" />
        <Stat
          label="Times used"
          value={rows.reduce((sum, r) => sum + (Number(r.usedCount) || 0), 0)}
          icon="chart"
          tone="gold"
        />
      </div>

      <Panel flush>
        <div className="ttoolbar">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search questions and answers"
            label="Search knowledge"
          />
          <Field label="Type">
            {(props) => (
              <Select {...props} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="all">All types</option>
                {KNOWLEDGE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            )}
          </Field>
          <FilterChips options={SOURCE_FILTERS} value={source} onChange={setSource} label="Filter by source" />
        </div>

        <div style={{ padding: 'var(--sp-4)' }}>
          {loading && <SkeletonList count={5} />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && rows.length === 0 && (
            <InlineEmpty
              icon="info"
              title="Nothing matches those filters"
              body="Try a different source or clear the search."
            />
          )}

          {!loading && !error && rows.length > 0 && (
            <ul className="activity">
              {rows.map((entry) => {
                const meta = KNOWLEDGE_SOURCES[entry.source]
                return (
                  <li className="activity__row" key={entry.id} style={{ alignItems: 'flex-start' }}>
                    <span className="activity__icon" aria-hidden="true">
                      <Icon name={meta?.icon ?? 'info'} size={15} />
                    </span>
                    <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                      <span className="activity__title">{entry.question}</span>
                      <span className="activity__body" style={{ marginTop: 3 }}>{entry.answer}</span>
                      <span className="chiplist" style={{ marginTop: 8 }}>
                        <Badge tone={meta?.tone}>{meta?.label ?? entry.source}</Badge>
                        <Badge>{entry.type}</Badge>
                        {!entry.enabled && <Badge tone="muted">Disabled</Badge>}
                        <span className="u-xs u-muted">
                          Used {formatNumber(entry.usedCount)} times · updated {formatDate(entry.updatedAt)} by{' '}
                          {entry.author}
                        </span>
                      </span>
                    </span>
                    <span className="tone-row" style={{ flex: 'none' }}>
                      <Switch
                        checked={entry.enabled}
                        onChange={() => toggle(entry)}
                        label={`${entry.enabled ? 'Disable' : 'Enable'} ${entry.question}`}
                      />
                      <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(entry)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" icon="trash" onClick={() => setConfirmDelete(entry)}>
                        Delete
                      </Button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Panel>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit entry' : 'Add a knowledge entry'}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} loading={busy} icon="check">Save entry</Button>
          </>
        }
      >
        {editing && (
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Question" hint="How a guest would actually phrase it." required>
              {(p) => (
                <Input
                  {...p}
                  value={editing.question}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                  placeholder="Can we have a bonfire on the beach?"
                />
              )}
            </Field>

            <Field label="Answer" hint="Vitoria's words. Be specific and say what she must not promise." required>
              {(p) => (
                <Textarea
                  {...p}
                  rows={5}
                  value={editing.answer}
                  onChange={(e) => setEditing({ ...editing, answer: e.target.value })}
                />
              )}
            </Field>

            <Field label="Type">
              {(p) => (
                <Select
                  {...p}
                  value={editing.type}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                >
                  {KNOWLEDGE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Source" hint="Where this knowledge comes from.">
              {(p) => (
                <Select
                  {...p}
                  value={editing.source}
                  onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                >
                  {Object.entries(KNOWLEDGE_SOURCES).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={remove}
        loading={busy}
        title="Delete this entry?"
        message={
          confirmDelete
            ? `"${confirmDelete.question}" will be removed. If you only want Vitoria to stop using it, disable it instead — that keeps the history.`
            : ''
        }
        confirmLabel="Delete entry"
        tone="danger"
      />
    </div>
  )
}
