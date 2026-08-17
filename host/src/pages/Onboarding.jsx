import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import SmartImage from '../components/ui/SmartImage'
import { Callout } from '../components/ui/Display'
import { EmptyState } from '../components/ui/States'
import { Panel, SetupChecklist, PropertyStatusBadge } from '../components/HostUI'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ONBOARDING_STEPS } from '../data/host'
import { setupProgress } from '../data/properties'
import { writeStore, readStore, STORAGE_KEYS } from '../utils/storage'
import { PHOTO } from '../assets/images'

/**
 * Onboarding is a guided view over the same setup checklist the dashboard
 * shows — not a separate wizard with its own state. That way a host who
 * abandons it halfway has still made real progress on their property.
 */
export default function Onboarding() {
  const navigate = useNavigate()
  const { host } = useAuth()
  const { properties, activeProperty, recommendationCount } = useWorkspace()
  const [dismissed, setDismissed] = useState(() => readStore(STORAGE_KEYS.onboarding)?.dismissed ?? false)
  useDocumentTitle('Welcome')

  const progress = useMemo(
    () => (activeProperty ? setupProgress(activeProperty, recommendationCount(activeProperty.id)) : null),
    [activeProperty, recommendationCount],
  )

  const stepState = useMemo(() => {
    if (!activeProperty || !progress) {
      return ONBOARDING_STEPS.map((step, i) => ({ ...step, done: i === 0 }))
    }
    const has = (key) => progress.items.find((item) => item.key === key)?.done
    return ONBOARDING_STEPS.map((step) => {
      switch (step.key) {
        case 'account':
          return { ...step, done: true }
        case 'property':
          return { ...step, done: has('information') }
        case 'guest':
          return { ...step, done: has('wifi') && has('checkIn') && has('checkOut') && has('rules') }
        case 'recommendations':
          return { ...step, done: has('recommendations') }
        case 'photos':
          return { ...step, done: has('photos') }
        case 'review':
          return { ...step, done: progress.percent >= 80 }
        case 'publish':
          return { ...step, done: activeProperty.status === 'published' }
        default:
          return { ...step, done: false }
      }
    })
  }, [activeProperty, progress])

  const completed = stepState.filter((step) => step.done).length
  const percent = Math.round((completed / stepState.length) * 100)

  const saveForLater = () => {
    writeStore(STORAGE_KEYS.onboarding, { dismissed: true })
    setDismissed(true)
    navigate('/host/dashboard')
  }

  return (
    <div className="hpage" style={{ maxWidth: 1040 }}>
      <header style={{ marginBottom: 'var(--sp-5)' }}>
        <p className="u-eyebrow">Welcome to My30A Host</p>
        <h1 style={{ fontSize: 'var(--fs-h1)', marginTop: 6 }}>
          {host?.firstName ? `Let's get you set up, ${host.firstName}.` : "Let's set up your property."}
        </h1>
        <p className="u-small u-muted" style={{ marginTop: 8, maxWidth: '58ch' }}>
          Fifteen minutes now saves a season of answering the same questions by text. You can stop at
          any point and pick it back up from your dashboard.
        </p>
      </header>

      {properties.length === 0 ? (
        <Panel flush>
          <SmartImage photoId={PHOTO.houseWhite} alt="" ratio="21x9" width={1000} />
          <div style={{ padding: 'var(--sp-6)' }}>
            <EmptyState
              icon="building"
              title="Start with your property"
              message="Add the basics — name, address, size — and we will walk you through the rest section by section."
              actionLabel="Add your property"
              actionTo="/host/properties/new"
              plain
            />
          </div>
        </Panel>
      ) : (
        <div className="wizard">
          {/* --------------------------- Steps --------------------------- */}
          <nav className="wizard__rail" aria-label="Setup steps">
            {stepState.map((step, index) => (
              <div
                key={step.key}
                className={`wizard__step${step.done ? ' wizard__step--done' : ''}${
                  !step.done && stepState.slice(0, index).every((s) => s.done) ? ' wizard__step--active' : ''
                }`}
              >
                <span className="wizard__num">
                  {step.done ? <Icon name="check" size={13} strokeWidth={3} /> : index + 1}
                </span>
                {step.label}
              </div>
            ))}
          </nav>

          {/* -------------------------- Content -------------------------- */}
          <div className="hstack" style={{ gap: 'var(--sp-4)' }}>
            <Panel
              title={`${percent}% complete`}
              subtitle={
                percent === 100
                  ? 'Everything is done. Your guests are in good hands.'
                  : `${completed} of ${stepState.length} steps finished`
              }
            >
              <div className="setup__bar" style={{ marginTop: 0 }}>
                <span className="setup__fill" style={{ width: `${percent}%` }} />
              </div>

              <div className="hstack" style={{ gap: 'var(--sp-2)', marginTop: 'var(--sp-4)' }}>
                {stepState.map((step) => (
                  <div key={step.key} className="u-row" style={{ alignItems: 'flex-start', gap: 10 }}>
                    <Icon
                      name={step.done ? 'checkCircle' : 'circle'}
                      size={17}
                      style={{ color: step.done ? 'var(--sea-500)' : 'var(--line-strong)', flex: 'none', marginTop: 2 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div className="u-small" style={{ fontWeight: 600 }}>
                        {step.label}
                      </div>
                      <div className="u-xs u-muted">{step.blurb}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {activeProperty && progress && (
              <Panel
                title={activeProperty.name}
                subtitle="Jump straight to whatever is still missing"
                action={<PropertyStatusBadge status={activeProperty.status} />}
              >
                <SetupChecklist progress={progress} propertyId={activeProperty.id} />
              </Panel>
            )}

            {activeProperty?.status !== 'published' && progress?.percent >= 80 && (
              <Callout icon="checkCircle" tone="ok">
                <strong style={{ display: 'block', marginBottom: 2 }}>Ready to publish</strong>
                Your property has everything a guest needs. Publishing turns on guest access and
                generates the link and QR code.
                <div style={{ marginTop: 'var(--sp-3)' }}>
                  <Button size="sm" to={`/host/properties/${activeProperty.id}/guest-access`} icon="qr">
                    Go to guest access
                  </Button>
                </div>
              </Callout>
            )}

            <div className="hrow">
              <Button
                to={
                  activeProperty
                    ? `/host/properties/${activeProperty.id}/${
                        progress?.items.find((item) => !item.done)?.route ?? 'guest-access'
                      }`
                    : '/host/properties/new'
                }
                iconRight="arrowRight"
              >
                {progress?.percent === 100 ? 'Review property' : 'Continue setup'}
              </Button>
              <Button variant="secondary" onClick={saveForLater}>
                Save and continue later
              </Button>
              <Button variant="ghost" to="/host/dashboard">
                Skip to dashboard
              </Button>
            </div>

            {dismissed && (
              <p className="u-xs u-muted">
                Saved. You can always pick this up from the setup card on your{' '}
                <Link to="/host/dashboard" style={{ color: 'var(--sea-700)' }}>
                  dashboard
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      )}

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
