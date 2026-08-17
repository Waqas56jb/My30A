import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Switch } from '../components/ui/Form'
import { ConfirmModal } from '../components/ui/Modal'
import { Callout, DefinitionList } from '../components/ui/Display'
import { Panel } from '../components/HostUI'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

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

export default function Settings() {
  const navigate = useNavigate()
  const { host, signOut } = useAuth()
  const { settings, updateWorkspaceSettings, resetDemoData, pushToast, properties } = useWorkspace()
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  useDocumentTitle('Settings')

  return (
    <div className="hpage" style={{ maxWidth: 860 }}>
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <h1 style={{ fontSize: 'var(--fs-h1)' }}>Settings</h1>
        <p className="u-small u-muted" style={{ marginTop: 4 }}>
          Account, privacy, and prototype tools.
        </p>
      </header>

      <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
        <Panel title="Account" flush>
          <Row icon="user" title="Profile" sub="Name, email, phone, company" onClick={() => navigate('/host/profile')} />
          <Row
            icon="bell"
            title="Notification preferences"
            sub="What you get emailed about"
            onClick={() => navigate('/host/profile')}
          />
          <Row
            icon="lock"
            title="Change password"
            sub="You will be sent a reset link"
            onClick={() => navigate('/host/forgot-password')}
          />
          <Row icon="logout" title="Sign out" sub={host?.email} onClick={() => setConfirm('signout')} />
        </Panel>

        <Panel title="Privacy" flush>
          <Row
            icon="eyeOff"
            title="Mask secrets by default"
            sub="Hide WiFi passwords and door codes until you choose to show them"
            control={
              <Switch
                checked={settings.maskSecrets}
                onChange={(value) => updateWorkspaceSettings({ maskSecrets: value })}
                label="Mask secrets by default"
              />
            }
          />
        </Panel>

        <Callout icon="lock">
          Private property information — WiFi, door codes, house rules, parking, emergency contacts —
          is only shown to guests holding your access link. It never appears on the public 30A pages
          that anyone can browse.
        </Callout>

        <Panel title="Prototype tools" subtitle="Not part of the real product" flush>
          <Row
            icon="alert"
            title="Simulate API failures"
            sub="Forces every mock request to fail so you can see the error states"
            control={
              <Switch
                checked={settings.simulateErrors}
                onChange={(value) => {
                  updateWorkspaceSettings({ simulateErrors: value })
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
            sub="Restore the shipped properties, recommendations and notifications"
            onClick={() => setConfirm('reset')}
          />
        </Panel>

        <Panel title="About">
          <DefinitionList
            rows={[
              { key: 'Application', value: 'My30A Host' },
              { key: 'Version', value: '1.0.0 · frontend prototype' },
              { key: 'Data', value: 'Mock data only — no backend connected' },
              { key: 'Properties', value: properties.length },
            ]}
          />
          <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-3)', lineHeight: 1.65 }}>
            No payments, no subscription, no card on file. The guest experience is free, and hosts
            have an account purely so private property information stays private.
          </p>
          <Button
            size="sm"
            variant="secondary"
            style={{ marginTop: 'var(--sp-3)' }}
            to="/host/help"
            icon="info"
          >
            Help centre
          </Button>
        </Panel>
      </div>

      <ConfirmModal
        open={confirm === 'signout'}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          await signOut()
          navigate('/host/login')
        }}
        title="Sign out?"
        message="Your properties and guest data stay exactly as they are. You can sign back in any time."
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
        message="This restores the original properties, recommendations and notifications. Anything you created or edited in this session is discarded."
        confirmLabel="Reset"
        tone="danger"
      />

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
