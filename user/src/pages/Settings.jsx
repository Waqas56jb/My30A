import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Switch } from '../components/ui/Form'
import { Section, Callout, DefinitionList } from '../components/ui/Display'
import { ConfirmModal, BottomSheet } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getAnalyticsLog, subscribeToAnalytics, clearAnalyticsLog } from '../services/analytics'
import { listGuests } from '../services/mockApi'
import { getPropertyById } from '../data/mockProperties'
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
  const { settings, updateSettings, resetDemoData, guestSlug, setGuestSlug, pushToast, signOut } =
    useApp()
  const navigate = useNavigate()
  const [resetOpen, setResetOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [log, setLog] = useState(getAnalyticsLog())
  useDocumentTitle('Settings')

  useEffect(() => subscribeToAnalytics(() => setLog(getAnalyticsLog())), [])

  const guests = listGuests()

  return (
    <div className="page">
      <PageHeader title="Settings" subtitle="Notifications, personalisation, and prototype tools." back backTo="/profile" />

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
          Delivery is mocked in this prototype — nothing is actually sent. These toggles map onto the
          notification preferences the backend will store.
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
            onClick={() => (guestSlug ? setSwitchOpen(true) : navigate('/access'))}
          />
          {guestSlug && (
            <SettingRow
              icon="logout"
              title="Sign out of this stay"
              sub="Keeps browsing open, clears your property details"
              onClick={signOut}
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

      <Section title="Prototype tools" subtitle="Not part of the guest experience">
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingRow
            icon="alert"
            title="Simulate API failures"
            sub="Forces every mock request to fail so you can see error states"
            control={
              <Switch
                checked={settings.simulateErrors}
                onChange={(value) => {
                  updateSettings({ simulateErrors: value })
                  pushToast({
                    tone: value ? 'error' : 'success',
                    title: value ? 'Failure mode on' : 'Failure mode off',
                    message: value ? 'Requests will now fail on purpose.' : 'Requests are healthy again.',
                  })
                }}
                label="Simulate API failures"
              />
            }
          />
          <SettingRow
            icon="grid"
            title="Analytics log"
            sub={`${log.length} events captured this session`}
            onClick={() => setLogOpen(true)}
          />
          <SettingRow
            icon="refresh"
            title="Reset demo data"
            sub="Restore the shipped requests, messages, and notifications"
            onClick={() => setResetOpen(true)}
          />
        </div>
      </Section>

      <Section title="About">
        <div className="card card--pad">
          <DefinitionList
            rows={[
              { key: 'Application', value: 'My30A Guest Experience' },
              { key: 'Version', value: '1.0.0 · frontend prototype' },
              { key: 'Data', value: 'Mock data only — no backend connected' },
              { key: 'Concierge', value: 'Vitoria (mock conversational service)' },
            ]}
          />
          <p className="u-xs u-muted" style={{ marginTop: 12 }}>
            Local businesses shown in this app are independent partners. My30A connects guests with
            them and measures views, website clicks, and phone clicks only.
          </p>
        </div>
      </Section>

      {/* --------------------------- Guest switcher -------------------------- */}
      <BottomSheet open={switchOpen} onClose={() => setSwitchOpen(false)} title="Open a different guest link">
        <div className="u-stack">
          <p className="u-small u-muted">
            In production each guest receives their own link after booking. Switch between the demo
            links below to see how the app adapts.
          </p>
          {guests.map((guest) => {
            const property = getPropertyById(guest.propertyId)
            return (
              <button
                key={guest.id}
                type="button"
                className="card order-card"
                onClick={() => {
                  setGuestSlug(guest.slug)
                  setSwitchOpen(false)
                  navigate('/')
                }}
              >
                <span className="order-card__icon" aria-hidden="true">
                  <Icon name="key" />
                </span>
                <span className="u-grow" style={{ minWidth: 0 }}>
                  <span className="order-card__title">
                    {guest.firstName} {guest.lastName}
                  </span>
                  <span className="order-card__meta">
                    {property?.name} · /guest/{guest.slug}
                  </span>
                </span>
                {guest.slug === guestSlug && (
                  <Icon name="check" size={18} style={{ color: 'var(--sea-700)', flex: 'none' }} />
                )}
              </button>
            )
          })}
        </div>
      </BottomSheet>

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

      <ConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={async () => {
          await resetDemoData()
          setResetOpen(false)
        }}
        title="Reset demo data?"
        message="This restores the original mock requests, conversation, and notifications. Anything you created in this session is discarded."
        confirmLabel="Reset"
        tone="danger"
      />

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
