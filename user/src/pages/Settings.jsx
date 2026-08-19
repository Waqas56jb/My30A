import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Switch } from '../components/ui/Form'
import { Section, Callout, DefinitionList } from '../components/ui/Display'
import { BottomSheet } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getAnalyticsLog, subscribeToAnalytics, clearAnalyticsLog } from '../services/analytics'
import { formatTime } from '../utils/format'

function SettingRow({ icon, title, sub, control, onClick, as = 'div' }) {
  const Tag = onClick ? 'button' : as
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

/**
 * Settings plus the prototype's inspection tools: swap guest link, force API
 * failures to exercise error states, reset mock data, and read the analytics
 * buffer that will later be pointed at a real provider.
 */
export default function Settings() {
  const {
    settings,
    updateSettings,
    guestSlug,
    leaveStay,
    account,
  } = useApp()
  const navigate = useNavigate()
  const [logOpen, setLogOpen] = useState(false)
  const [log, setLog] = useState(getAnalyticsLog())
  useDocumentTitle('Settings')

  useEffect(() => subscribeToAnalytics(() => setLog(getAnalyticsLog())), [])

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Notifications and personalisation." back backTo="/profile" />

      <Section title="Notifications">
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingRow
            icon="bell"
            title="Push notifications"
            sub="Status changes for groceries and transfers"
            control={
              <Switch
                checked={settings.pushEnabled}
                onChange={(value) => updateSettings({ pushEnabled: value })}
                label="Push notifications"
              />
            }
          />
          <SettingRow
            icon="message"
            title="Email updates"
            sub="Confirmations and receipts to your inbox"
            control={
              <Switch
                checked={settings.emailEnabled}
                onChange={(value) => updateSettings({ emailEnabled: value })}
                label="Email updates"
              />
            }
          />
          <SettingRow
            icon="phone"
            title="SMS"
            sub="Driver and shopper messages by text"
            control={
              <Switch
                checked={settings.smsEnabled}
                onChange={(value) => updateSettings({ smsEnabled: value })}
                label="SMS updates"
              />
            }
          />
        </div>
        <Callout icon="info" className="section">
          These preferences are stored on your account and used when we send status updates.
        </Callout>
      </Section>

      <Section title="Personalisation">
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingRow
            icon="sparkles"
            title="Let Vitoria remember me"
            sub="Uses previous stays and preferences to tailor suggestions"
            control={
              <Switch
                checked={settings.vitoriaMemory}
                onChange={(value) => updateSettings({ vitoriaMemory: value })}
                label="Vitoria memory"
              />
            }
          />
          <SettingRow
            icon="user"
            title="Preferences"
            sub="Cuisines, dietary needs, activities"
            onClick={() => navigate('/profile')}
          />
        </div>
      </Section>

      <Section title="Your access">
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingRow
            icon="key"
            title={guestSlug ? 'Guest link' : 'Unlock your stay'}
            sub={guestSlug ? `/guest/${guestSlug}` : 'Enter the access code from your host'}
            onClick={() => navigate('/access')}
          />
          {guestSlug && (
            <SettingRow
              icon="key"
              title="Remove this stay"
              sub="Keeps you logged in, clears your property details"
              onClick={leaveStay}
            />
          )}
          <SettingRow
            icon="building"
            title="My Stay"
            sub="Door code, WiFi, house rules"
            onClick={() => navigate('/my-stay')}
          />
        </div>
      </Section>

      <Section title="Your account">
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingRow
            icon="user"
            title={account ? `${account.firstName} ${account.lastName}` : 'Your profile'}
            sub={account?.email ?? 'Name, contact details and preferences'}
            onClick={() => navigate('/profile')}
          />
          <SettingRow
            icon="lock"
            title="Change your password"
            sub="Sends a reset link to your email"
            onClick={() => navigate('/forgot-password')}
          />
          <SettingRow
            icon="logout"
            title="Sign out"
            sub="Signs you out on this device and returns to the website"
            onClick={() => navigate('/logout')}
          />
        </div>
      </Section>

      <Section title="Activity">
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingRow
            icon="grid"
            title="Analytics log"
            sub={`${log.length} events captured this session`}
            onClick={() => setLogOpen(true)}
          />
        </div>
      </Section>

      <Section title="About">
        <div className="card card--pad">
          <DefinitionList
            rows={[
              { key: 'Application', value: 'My30A Guest Experience' },
              { key: 'Version', value: '1.0.0' },
              { key: 'Data', value: 'Live My30A API' },
              { key: 'Concierge', value: 'Vitoria' },
            ]}
          />
          <p className="u-xs u-muted" style={{ marginTop: 12 }}>
            Local businesses shown in this app are independent partners. My30A connects guests with
            them and measures views, website clicks, and phone clicks only.
          </p>
        </div>
      </Section>

      {/* --------------------------- Analytics log --------------------------- */}
      <BottomSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        title="Analytics events"
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              clearAnalyticsLog()
              setLog([])
            }}
          >
            Clear
          </Button>
        }
      >
        {log.length === 0 ? (
          <p className="u-small u-muted">
            No events captured yet. Browse a partner or send Vitoria a message and they’ll appear here.
          </p>
        ) : (
          <div className="u-stack" style={{ gap: 6 }}>
            {log.slice(0, 50).map((entry) => (
              <div
                key={entry.id}
                className="card card--tint"
                style={{ padding: 'var(--sp-3)', boxShadow: 'none' }}
              >
                <div className="u-between">
                  <span className="u-small" style={{ fontWeight: 600 }}>
                    {entry.event}
                  </span>
                  <span className="u-xs u-muted">{formatTime(entry.at)}</span>
                </div>
                <pre
                  style={{
                    margin: '6px 0 0',
                    fontSize: '0.7rem',
                    color: 'var(--ink-500)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {JSON.stringify(entry.properties)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </BottomSheet>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
