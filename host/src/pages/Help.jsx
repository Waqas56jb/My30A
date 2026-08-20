import { useMemo, useState } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { SearchBar, Field, Input, Textarea } from '../components/ui/Form'
import { DefinitionList, Callout } from '../components/ui/Display'
import { EmptyState, SuccessState } from '../components/ui/States'
import { Panel } from '../components/HostUI'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { helpTopics, supportContact } from '../data/help'

export default function Help() {
  const { host } = useAuth()
  const { pushToast } = useWorkspace()
  const [search, setSearch] = useState('')
  const [openKey, setOpenKey] = useState('getting-started-0')
  const [form, setForm] = useState({ subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Help')

  const topics = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return helpTopics
    return helpTopics
      .map((topic) => ({
        ...topic,
        articles: topic.articles.filter((article) =>
          `${article.q} ${article.a}`.toLowerCase().includes(needle),
        ),
      }))
      .filter((topic) => topic.articles.length > 0)
  }, [search])

  const submit = (event) => {
    event.preventDefault()
    const next = {}
    if (!form.subject.trim()) next.subject = 'Give it a subject so we can route it.'
    if (form.message.trim().length < 10) next.message = 'A little more detail helps us help you.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    window.setTimeout(() => {
      setBusy(false)
      setSent(true)
      pushToast({ tone: 'success', title: 'Message sent', message: 'We usually reply within a few hours.' })
    }, 600)
  }

  return (
    <div className="hpage" style={{ maxWidth: 940 }}>
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Help centre</h1>
        <p className="u-small u-muted" style={{ marginTop: 4 }}>
          How the host panel works, and how to reach a person.
        </p>
      </header>

      <SearchBar value={search} onChange={setSearch} placeholder="Search help" label="Search help articles" />

      <div className="hgrid hgrid--main-aside hsection">
        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          {topics.length === 0 && (
            <EmptyState
              icon="search"
              title="Nothing matched"
              message="Try a different word, or send us a message below — we would rather answer than have you hunt."
            />
          )}

          {topics.map((topic) => (
            <Panel
              key={topic.id}
              title={
                <span className="u-row" style={{ gap: 8 }}>
                  <Icon name={topic.icon} size={18} style={{ color: 'var(--sea-700)' }} />
                  {topic.title}
                </span>
              }
              flush
            >
              {topic.articles.map((article, index) => {
                const key = `${topic.id}-${index}`
                const isOpen = openKey === key
                return (
                  <div key={key}>
                    <button
                      type="button"
                      className="help-q"
                      aria-expanded={isOpen}
                      onClick={() => setOpenKey(isOpen ? null : key)}
                    >
                      <span className="u-small" style={{ fontWeight: 600, flex: '1 1 auto', minWidth: 0 }}>
                        {article.q}
                      </span>
                      <Icon
                        name={isOpen ? 'chevronUp' : 'chevronDown'}
                        size={18}
                        style={{ color: 'var(--ink-400)', flex: 'none' }}
                      />
                    </button>
                    {isOpen && <p className="help-a">{article.a}</p>}
                  </div>
                )
              })}
            </Panel>
          ))}

          <Panel title="Contact support">
            {sent ? (
              <SuccessState
                title="Message sent"
                message={`We have it, and we will reply to ${host?.email ?? 'your email'} — usually within a few hours.`}
              >
                <Button size="sm" variant="secondary" onClick={() => setSent(false)}>
                  Send another
                </Button>
              </SuccessState>
            ) : (
              <form onSubmit={submit} className="hstack" style={{ gap: 'var(--sp-4)' }} noValidate>
                <Field label="Subject" required error={errors.subject}>
                  {(props) => (
                    <Input
                      {...props}
                      value={form.subject}
                      placeholder="Guest cannot open my link"
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    />
                  )}
                </Field>
                <Field label="What is going on?" required error={errors.message}>
                  {(props) => (
                    <Textarea
                      {...props}
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    />
                  )}
                </Field>
                <Button type="submit" loading={busy} icon="send" style={{ alignSelf: 'flex-start' }}>
                  Send message
                </Button>
              </form>
            )}
          </Panel>
        </div>

        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel title="Talk to us">
            <DefinitionList
              rows={[
                { key: 'Email', value: supportContact.email },
                { key: 'Hours', value: supportContact.hours },
                { key: 'Typical reply', value: supportContact.responseTime },
                { key: 'Instagram', value: supportContact.instagram },
                { key: 'Facebook', value: supportContact.facebook },
              ]}
            />
            <div className="hstack" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-3)' }}>
              <Button size="sm" variant="secondary" block icon="mail" href={`mailto:${supportContact.email}`} target="_self">
                Email support
              </Button>
            </div>
          </Panel>

          <Panel title="Quick links">
            <div className="hstack" style={{ gap: 'var(--sp-2)' }}>
              <Button size="sm" variant="ghost" block to="/host/properties" icon="building">
                My properties
              </Button>
              <Button size="sm" variant="ghost" block to="/host/vitoria" icon="sparkles">
                Vitoria activity
              </Button>
              <Button size="sm" variant="ghost" block to="/host/settings" icon="settings">
                Settings
              </Button>
            </div>
          </Panel>

          <Callout icon="info">
            This is a prototype — the contact form does not send anything yet, and no data leaves your
            browser.
          </Callout>
        </div>
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
