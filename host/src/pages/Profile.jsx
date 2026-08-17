import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Field, Input, Select, Switch } from '../components/ui/Form'
import { Avatar, Callout, DefinitionList } from '../components/ui/Display'
import { Panel } from '../components/HostUI'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { validateEmail } from '../services/authService'
import { formatDate } from '../utils/format'

const NOTIFICATION_SETTINGS = [
  ['emailNotifications', 'Email notifications', 'Everything below, delivered to your inbox.'],
  ['guestActivityAlerts', 'Guest activity', 'When a guest first opens their link.'],
  ['feedbackAlerts', 'Guest feedback', 'When someone rates their stay.'],
  ['vitoriaAlerts', 'Vitoria escalations', 'When she cannot answer a guest question.'],
  ['weeklySummary', 'Weekly summary', 'One email a week with the numbers.'],
]

export default function Profile() {
  const { host, updateProfile, updateSettings } = useAuth()
  const { pushToast, properties } = useWorkspace()
  useDocumentTitle('Profile')

  const initial = useMemo(
    () => ({
      firstName: host?.firstName ?? '',
      lastName: host?.lastName ?? '',
      email: host?.email ?? '',
      phone: host?.phone ?? '',
      company: host?.company ?? '',
      preferredContact: host?.preferredContact ?? 'email',
    }),
    [host],
  )

  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  useEffect(() => setForm(initial), [initial])
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    const next = {}
    if (!form.firstName.trim()) next.firstName = 'Enter your first name.'
    if (!validateEmail(form.email)) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy(true)
    try {
      await updateProfile(form)
      pushToast({ tone: 'success', title: 'Profile saved' })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not save that', message: error.message })
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (key, value) => {
    try {
      await updateSettings({ [key]: value })
    } catch (error) {
      pushToast({ tone: 'error', title: 'That did not save', message: error.message })
    }
  }

  if (!host) return null

  return (
    <div className="hpage" style={{ maxWidth: 920 }}>
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Profile</h1>
        <p className="u-small u-muted" style={{ marginTop: 4 }}>
          Your details, and what you want to hear about.
        </p>
      </header>

      <div className="hgrid hgrid--main-aside">
        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <div className="form-card">
            <div className="u-row" style={{ gap: 'var(--sp-4)' }}>
              <Avatar src={host.avatar} name={host.firstName} size="lg" />
              <div style={{ minWidth: 0 }}>
                <h2 className="form-card__title">
                  {host.firstName} {host.lastName}
                </h2>
                <p className="form-card__sub">{host.company || 'Independent host'}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                style={{ marginLeft: 'auto' }}
                onClick={() =>
                  pushToast({
                    tone: 'info',
                    title: 'Photo upload is mocked',
                    message: 'Real uploads arrive with the backend.',
                  })
                }
              >
                Change photo
              </Button>
            </div>

            <div className="field-row field-row--2">
              <Field label="First name" required error={errors.firstName}>
                {(props) => (
                  <Input {...props} value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} />
                )}
              </Field>
              <Field label="Last name">
                {(props) => (
                  <Input {...props} value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} />
                )}
              </Field>
            </div>

            <Field label="Email" required error={errors.email}>
              {(props) => (
                <Input {...props} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
              )}
            </Field>

            <div className="field-row field-row--2">
              <Field label="Phone">
                {(props) => (
                  <Input {...props} type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                )}
              </Field>
              <Field label="Preferred contact">
                {(props) => (
                  <Select
                    {...props}
                    value={form.preferredContact}
                    onChange={(e) => set({ preferredContact: e.target.value })}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="sms">Text message</option>
                  </Select>
                )}
              </Field>
            </div>

            <Field label="Company or property management name" hint="Shown to guests alongside your name.">
              {(props) => (
                <Input {...props} value={form.company} onChange={(e) => set({ company: e.target.value })} />
              )}
            </Field>
          </div>

          <div className="formbar">
            <span className="formbar__note">{dirty ? 'You have unsaved changes.' : 'All changes saved.'}</span>
            {dirty && (
              <Button variant="ghost" onClick={() => setForm(initial)} disabled={busy}>
                Discard
              </Button>
            )}
            <Button onClick={save} loading={busy} disabled={!dirty} icon="check">
              Save profile
            </Button>
          </div>

          <Panel title="Notifications" subtitle="What you want to hear about" flush>
            {NOTIFICATION_SETTINGS.map(([key, label, sub]) => (
              <div className="setting-row" key={key}>
                <span className="setting-row__icon" aria-hidden="true">
                  <Icon name="bell" />
                </span>
                <span className="setting-row__text">
                  <span className="setting-row__title">{label}</span>
                  <span className="setting-row__sub">{sub}</span>
                </span>
                <Switch
                  checked={!!host.settings?.[key]}
                  onChange={(value) => toggle(key, value)}
                  label={label}
                />
              </div>
            ))}
          </Panel>

          <Callout icon="info">
            Notification delivery is mocked in this prototype — nothing is actually emailed or pushed.
          </Callout>
        </div>

        <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
          <Panel title="Account">
            <DefinitionList
              rows={[
                { key: 'Email verified', value: host.emailVerified ? 'Yes' : 'Not yet' },
                { key: 'Member since', value: formatDate(host.createdAt, { month: 'long', year: 'numeric' }) },
                { key: 'Properties', value: properties.length },
              ]}
            />
            {!host.emailVerified && (
              <Button size="sm" variant="secondary" block style={{ marginTop: 'var(--sp-3)' }} to="/host/verify-email">
                Verify email
              </Button>
            )}
          </Panel>

          <Panel title="Guests see">
            <p className="u-small u-muted" style={{ lineHeight: 1.65 }}>
              Your name and company, and — if you have turned it on for a property — your phone and
              email so they can reach you directly.
            </p>
          </Panel>
        </div>
      </div>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
