import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Field, Input, Switch } from '../components/ui/Form'
import { ConfirmModal } from '../components/ui/Modal'
import { Callout, DefinitionList } from '../components/ui/Display'
import { Panel, StatusPill } from '../components/PartnerUI'
import { usePartner } from '../context/PartnerContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as partnerService from '../services/partnerService'
import { formatDate } from '../utils/format'

function Row({ icon, title, sub, control, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag className="setting-row" onClick={onClick} type={onClick ? 'button' : undefined}>
      <span className="setting-row__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="setting-row__text">
        <span className="setting-row__title">{title}</span>
        {sub && <span className="setting-row__sub">{sub}</span>}
      </span>
      {control ?? (onClick ? <Icon name="chevronRight" size={18} className="setting-row__chev" /> : null)}
    </Tag>
  )
}

const NOTIFICATION_SETTINGS = [
  ['pushNotifications', 'Push notifications', 'Browser and lock-screen alerts for listing and performance updates.'],
  ['emailNotifications', 'Email notifications', 'Everything below, delivered to your inbox.'],
  ['performanceReports', 'Performance reports', 'A monthly summary of views and taps.'],
  ['profileUpdates', 'Profile updates', 'When your listing status or details change.'],
]

export default function Settings() {
  const navigate = useNavigate()
  const {
    partner,
    session,
    signOut,
    applyPartner,
    settings,
    updateSettings,
    resetDemoData,
    pushToast,
  } = usePartner()
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Settings')

  const initial = useMemo(
    () =>
      partner
        ? { ownerName: partner.ownerName, email: partner.email, phone: partner.phone }
        : { ownerName: '', email: '', phone: '' },
    [partner],
  )
  const [account, setAccount] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => setAccount(initial), [initial])
  if (!partner) return null

  const dirty = JSON.stringify(account) !== JSON.stringify(initial)

  const saveAccount = async () => {
    const next = {}
    if (!account.ownerName.trim()) next.ownerName = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(account.email)) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      applyPartner(await partnerService.updatePartner(partner.id, account))
      pushToast({ tone: 'success', title: 'Account updated' })
    } catch (error) {
      pushToast({ tone: 'error', title: 'We could not save that', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="ppage ppage--narrow">
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Settings</h1>
        <p className="u-small u-muted" style={{ marginTop: 4 }}>
          Your account, what you hear about, and how your listing appears.
        </p>
      </header>

      <div className="pstack" style={{ gap: 'var(--sp-4)' }}>
        {/* ------------------------------ Account ---------------------------- */}
        <div className="form-card">
          <div>
            <h2 className="form-card__title">Account</h2>
            <p className="form-card__sub">Who we contact about this listing.</p>
          </div>

          <Field label="Name" required error={errors.ownerName}>
            {(props) => (
              <Input
                {...props}
                value={account.ownerName}
                onChange={(e) => setAccount((a) => ({ ...a, ownerName: e.target.value }))}
              />
            )}
          </Field>

          <div className="field-row field-row--2">
            <Field label="Email" required error={errors.email}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  value={account.email}
                  onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
                />
              )}
            </Field>
            <Field label="Phone">
              {(props) => (
                <Input
                  {...props}
                  type="tel"
                  value={account.phone}
                  onChange={(e) => setAccount((a) => ({ ...a, phone: e.target.value }))}
                />
              )}
            </Field>
          </div>

          <div className="prow">
            <Button onClick={saveAccount} loading={saving} disabled={!dirty} icon="check">
              Save account
            </Button>
            <Button variant="ghost" onClick={() => navigate('/partner/forgot-password')} icon="lock">
              Change password
            </Button>
          </div>
        </div>

        {/* ------------------------------ Business --------------------------- */}
        <Panel title="Business" flush>
          <Row
            icon="building"
            title={partner.businessName}
            sub={`${partner.category} · ${partner.city}, ${partner.state}`}
            onClick={() => navigate('/partner/profile')}
          />
          <Row
            icon="globe"
            title="Website"
            sub={partner.website || 'Not provided'}
            onClick={() => navigate('/partner/profile')}
          />
          <Row
            icon="phone"
            title="Business phone"
            sub={partner.phone || 'Not provided'}
            onClick={() => navigate('/partner/profile')}
          />
          <Row
            icon="image"
            title="Photos"
            sub={`${(partner.photos ?? []).length} on your listing`}
            onClick={() => navigate('/partner/photos')}
          />
        </Panel>

        {/* --------------------------- Notifications ------------------------- */}
        <Panel title="Notifications" subtitle="What we email you about" flush>
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
                checked={!!settings[key]}
                onChange={(value) => updateSettings({ [key]: value })}
                label={label}
              />
            </div>
          ))}
        </Panel>

        {/* ------------------------------ Privacy ---------------------------- */}
        <Panel title="Privacy" flush>
          <div className="setting-row">
            <span className="setting-row__icon" aria-hidden="true">
              <Icon name="eye" />
            </span>
            <span className="setting-row__text">
              <span className="setting-row__title">Account visibility</span>
              <span className="setting-row__sub">
                Show my business to guests browsing 30A. Turning this off hides your listing without
                deleting anything.
              </span>
            </span>
            <Switch
              checked={!!settings.publicVisibility}
              onChange={(value) => {
                updateSettings({ publicVisibility: value })
                pushToast({
                  tone: value ? 'success' : 'info',
                  title: value ? 'Listing visible' : 'Listing hidden',
                  message: value
                    ? 'Guests can find your business again.'
                    : 'Guests will not see your business until you switch this back on.',
                })
              }}
              label="Account visibility"
            />
          </div>
        </Panel>

        <Callout icon="info">
          My30A never takes payment from guests on your behalf, and never charges you commission.
          There is nothing to cancel and no card on file.
        </Callout>

        {/* --------------------------- Prototype tools ----------------------- */}
        <Panel title="Prototype tools" subtitle="Not part of the real product" flush>
          <Row
            icon="alert"
            title="Simulate API failures"
            sub="Forces every mock request to fail so you can see the error states"
            control={
              <Switch
                checked={settings.simulateErrors}
                onChange={(value) => {
                  updateSettings({ simulateErrors: value })
                  pushToast({
                    tone: value ? 'error' : 'success',
                    title: value ? 'Failure mode on' : 'Failure mode off',
                  })
                }}
                label="Simulate API failures"
              />
            }
          />
          <Row
            icon="refresh"
            title="Reset demo data"
            sub="Restore the shipped businesses, photos and notifications"
            onClick={() => setConfirm('reset')}
          />
        </Panel>

        {/* ------------------------------- About ----------------------------- */}
        <Panel title="About">
          <DefinitionList
            rows={[
              { key: 'Application', value: 'My30A Partner Portal' },
              { key: 'Version', value: '1.0.0 · frontend prototype' },
              { key: 'Data', value: 'Mock data only — no backend connected' },
              { key: 'Listing status', value: <StatusPill status={partner.status} /> },
              {
                key: 'Member since',
                value: formatDate(partner.submittedAt, { month: 'long', year: 'numeric' }),
              },
              { key: 'Signed in as', value: session?.email },
            ]}
          />
        </Panel>

        {/* ------------------------------ Danger ----------------------------- */}
        <Panel title="Danger zone" flush>
          <Row icon="logout" title="Sign out" sub={session?.email} onClick={() => setConfirm('signout')} />
          <Row
            icon="trash"
            title="Delete account"
            sub="Permanently remove your business and all of its data"
            onClick={() => setConfirm('delete')}
          />
        </Panel>
      </div>

      <ConfirmModal
        open={confirm === 'signout'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await signOut()
          navigate('/partner/login')
        }}
        title="Sign out?"
        message="Your listing stays exactly as it is. You can sign back in any time."
        confirmLabel="Sign out"
      />

      <ConfirmModal
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          setBusy(true)
          await resetDemoData()
          setBusy(false)
          setConfirm(null)
        }}
        loading={busy}
        title="Reset demo data?"
        message="This restores the original businesses, photos and notifications. Anything you created or edited in this session is discarded."
        confirmLabel="Reset"
        tone="danger"
      />

      <ConfirmModal
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null)
          pushToast({
            tone: 'info',
            title: 'Account deletion is not wired up',
            message: 'In the real product this would open a confirmation email flow.',
          })
        }}
        title={`Delete ${partner.businessName}?`}
        message="This removes your listing, your photos and your analytics history. Guests will no longer be able to find you through My30A. This cannot be undone."
        confirmLabel="Delete my account"
        tone="danger"
      />

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
