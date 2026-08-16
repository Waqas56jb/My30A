import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { BottomSheet } from '../components/ui/Modal'
import { Section, Avatar, DefinitionList, Callout } from '../components/ui/Display'
import { Field, Input, Checkbox } from '../components/ui/Form'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDateRange, pluralize } from '../utils/format'

const CUISINES = [
  'Seafood',
  'Coastal Italian',
  'Sushi',
  'Barbecue',
  'Mexican',
  'Steakhouse',
  'Vegetarian',
  'Southern',
]

const ACTIVITIES = [
  'Beach days',
  'Paddleboarding',
  'Live music',
  'Sunset photography',
  'Golf',
  'Boating',
  'Cycling',
  'Wellness',
  'Farmers markets',
]

/**
 * Guest profile and the preference set Vitoria personalises against. Editing
 * here writes through the mock API — the same call the AI memory service will
 * own once the backend exists.
 */
export default function Profile() {
  const { guest, property, savedIds, updatePreferences, pushToast, settings } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState(null)
  useDocumentTitle('Profile')

  const prefs = guest?.preferences ?? {}

  const openEdit = () => {
    setDraft({
      cuisines: [...(prefs.cuisines ?? [])],
      dietary: (prefs.dietary ?? []).join(', '),
      activities: [...(prefs.activities ?? [])],
      travelingWithKids: !!prefs.travelingWithKids,
      pace: prefs.pace ?? '',
    })
    setEditOpen(true)
  }

  const toggleIn = (key, value) =>
    setDraft((d) => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter((v) => v !== value) : [...d[key], value],
    }))

  const save = async () => {
    await updatePreferences({
      cuisines: draft.cuisines,
      activities: draft.activities,
      travelingWithKids: draft.travelingWithKids,
      pace: draft.pace,
      dietary: draft.dietary
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    })
    setEditOpen(false)
    pushToast({
      tone: 'success',
      title: 'Preferences saved',
      message: 'Vitoria will use these for her recommendations.',
    })
  }

  return (
    <div className="page">
      <PageHeader
        title="Profile"
        subtitle="Who you are, and what Vitoria should remember."
        actions={
          <Button size="sm" variant="secondary" to="/settings" icon="settings">
            Settings
          </Button>
        }
      />

      <div className="profile-head">
        <Avatar src={guest?.avatar} name={guest?.firstName} size="lg" />
        <div className="u-grow" style={{ minWidth: 0 }}>
          <div className="profile-head__name">
            {guest?.firstName} {guest?.lastName}
          </div>
          <div className="profile-head__meta u-truncate">{guest?.email}</div>
          <div className="profile-head__meta">
            {guest?.returning
              ? `${pluralize(guest.previousStays, 'previous stay')} with My30A`
              : 'First stay with My30A'}
          </div>
        </div>
      </div>

      <Section title="Your stay">
        <div className="card card--pad">
          <DefinitionList
            rows={[
              { key: 'Property', value: property?.name },
              {
                key: 'Dates',
                value: guest?.stay
                  ? formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)
                  : '—',
              },
              { key: 'Confirmation', value: guest?.stay?.confirmationCode },
              { key: 'Email', value: guest?.email },
              { key: 'Phone', value: guest?.phone },
            ]}
          />
          <div className="u-row u-wrap" style={{ marginTop: 'var(--sp-4)' }}>
            <Button size="sm" to="/my-stay" icon="key">
              Stay details
            </Button>
            <Button size="sm" variant="secondary" to="/my-trip" icon="suitcase">
              My trip
            </Button>
          </div>
        </div>
      </Section>

      <Section title="Preferences" subtitle="Vitoria uses these to filter what she suggests">
        <div className="card card--pad">
          <div className="pref-group">
            <div className="pref-row">
              <span className="pref-row__k">Favourite cuisine</span>
              <span className="pref-row__v">
                {(prefs.cuisines ?? []).map((c) => (
                  <span key={c} className="tag">
                    {c}
                  </span>
                ))}
              </span>
            </div>
            <div className="pref-row">
              <span className="pref-row__k">Dietary</span>
              <span className="pref-row__v">
                {(prefs.dietary ?? []).length ? (
                  prefs.dietary.map((d) => (
                    <span key={d} className="tag">
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="u-xs u-muted">None recorded</span>
                )}
              </span>
            </div>
            <div className="pref-row">
              <span className="pref-row__k">Kids</span>
              <span className="pref-row__v">
                <span className="tag">
                  {prefs.travelingWithKids
                    ? `Yes · ages ${(prefs.kidAges ?? []).join(' & ')}`
                    : 'Travelling without kids'}
                </span>
              </span>
            </div>
            <div className="pref-row">
              <span className="pref-row__k">Favourite activities</span>
              <span className="pref-row__v">
                {(prefs.activities ?? []).map((a) => (
                  <span key={a} className="tag">
                    {a}
                  </span>
                ))}
              </span>
            </div>
            <div className="pref-row">
              <span className="pref-row__k">Pace</span>
              <span className="pref-row__v">
                <span className="tag">{prefs.pace}</span>
              </span>
            </div>
            <div className="pref-row">
              <span className="pref-row__k">Budget</span>
              <span className="pref-row__v">
                <span className="tag">{prefs.budget}</span>
              </span>
            </div>
          </div>

          <Button size="sm" icon="edit" onClick={openEdit} style={{ marginTop: 'var(--sp-4)' }}>
            Edit preferences
          </Button>
        </div>
      </Section>

      <Section title="Vitoria’s memory">
        {settings.vitoriaMemory ? (
          <div className="u-stack">
            {(guest?.memories ?? []).map((memory) => (
              <div key={memory.id} className="memory-card">
                <span className="memory-card__icon" aria-hidden="true">
                  <Icon name="sparkles" />
                </span>
                <div>
                  <p className="u-small">{memory.note}</p>
                  <p className="u-xs u-muted" style={{ marginTop: 2 }}>
                    {memory.source}
                  </p>
                </div>
              </div>
            ))}
            {(guest?.memories ?? []).length === 0 && (
              <Callout icon="sparkles">
                Nothing remembered yet. As you chat with Vitoria she’ll pick up on what you like.
              </Callout>
            )}
          </div>
        ) : (
          <Callout icon="lock">
            Personalisation is turned off, so Vitoria won’t reference previous stays. You can turn it
            back on in <Link to="/settings" style={{ textDecoration: 'underline' }}>Settings</Link>.
          </Callout>
        )}
      </Section>

      <Section title="Saved places" linkTo="/my-trip" linkLabel="View trip">
        <div className="card card--pad u-between">
          <div className="u-row">
            <span className="order-card__icon" aria-hidden="true">
              <Icon name="heart" />
            </span>
            <div>
              <div className="u-small" style={{ fontWeight: 600 }}>
                {savedIds.length} saved {savedIds.length === 1 ? 'place' : 'places'}
              </div>
              <div className="u-xs u-muted">Restaurants, beaches, and partners you’ve hearted</div>
            </div>
          </div>
          <Icon name="chevronRight" style={{ color: 'var(--ink-300)' }} />
        </div>
      </Section>

      {/* ----------------------------- Edit sheet ---------------------------- */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit preferences">
        {draft && (
          <div className="u-stack" style={{ gap: 'var(--sp-5)' }}>
            <Field label="Favourite cuisines" hint="Tap to toggle">
              <div className="chips chips--wrap">
                {CUISINES.map((cuisine) => (
                  <button
                    key={cuisine}
                    type="button"
                    className="chip"
                    aria-pressed={draft.cuisines.includes(cuisine)}
                    onClick={() => toggleIn('cuisines', cuisine)}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Dietary needs" hint="Separate with commas">
              {(props) => (
                <Input
                  {...props}
                  value={draft.dietary}
                  placeholder="Shellfish allergy, vegetarian"
                  onChange={(e) => setDraft((d) => ({ ...d, dietary: e.target.value }))}
                />
              )}
            </Field>

            <Field label="Favourite activities" hint="Tap to toggle">
              <div className="chips chips--wrap">
                {ACTIVITIES.map((activity) => (
                  <button
                    key={activity}
                    type="button"
                    className="chip"
                    aria-pressed={draft.activities.includes(activity)}
                    onClick={() => toggleIn('activities', activity)}
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Pace of your trip">
              {(props) => (
                <Input
                  {...props}
                  value={draft.pace}
                  placeholder="Relaxed mornings, one activity a day"
                  onChange={(e) => setDraft((d) => ({ ...d, pace: e.target.value }))}
                />
              )}
            </Field>

            <Checkbox
              checked={draft.travelingWithKids}
              onChange={(value) => setDraft((d) => ({ ...d, travelingWithKids: value }))}
            >
              I’m travelling with children — prioritise family-friendly suggestions.
            </Checkbox>

            <Button block onClick={save} icon="check">
              Save preferences
            </Button>
          </div>
        )}
      </BottomSheet>

      <div style={{ height: 'var(--sp-8)' }} />
    </div>
  )
}
