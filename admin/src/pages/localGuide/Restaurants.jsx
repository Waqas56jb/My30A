import { useMemo, useState } from 'react'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, Input, Textarea, Select, Switch, SearchBar, FilterChips } from '../../components/ui/Form'
import { PageHeader, Panel, Stat, InlineEmpty } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { SkeletonList } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { formatDate } from '../../utils/format'

const PLATFORMS = [
  { value: 'opentable', label: 'OpenTable' },
  { value: 'resy', label: 'Resy' },
  { value: 'sevenrooms', label: 'SevenRooms' },
  { value: 'website_widget', label: 'Website widget' },
  { value: 'phone_only', label: 'Phone only' },
]

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'stale', label: 'Needs review' },
  ...PLATFORMS,
]

const EMPTY = {
  name: '',
  cuisine: '',
  description: '',
  location: '',
  phone: '',
  website: '',
  bookingPlatform: 'opentable',
  bookingUrl: '',
  bookingNotes: '',
  featured: false,
  active: true,
}

const platformLabel = (value) => PLATFORMS.find((p) => p.value === value)?.label ?? value ?? '—'

/**
 * Guest restaurant directory — per-venue booking handoff, not a booking engine.
 *
 * OpenTable / Resy / SevenRooms / website / phone is stored on the restaurant
 * row. Never assume a global OpenTable search. last_verified_date going stale
 * is the signal to re-check the restaurant’s own site.
 */
export default function Restaurants() {
  useDocumentTitle('Restaurants')
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getAdminRestaurants(), [])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : []
    return list.filter((row) => {
      const hay = `${row.name} ${row.location} ${row.phone}`.toLowerCase()
      if (search && !hay.includes(search.toLowerCase())) return false
      if (filter === 'stale') return row.stale
      if (filter !== 'all') return row.bookingPlatform === filter
      return true
    })
  }, [data, search, filter])

  const staleCount = (Array.isArray(data) ? data : []).filter((row) => row.stale).length

  const save = async () => {
    if (!editing?.name?.trim()) {
      pushToast({ tone: 'error', title: 'A restaurant needs a name' })
      return
    }
    if (editing.bookingPlatform !== 'phone_only' && !String(editing.bookingUrl ?? '').trim()) {
      pushToast({ tone: 'error', title: 'Add the restaurant’s direct booking URL' })
      return
    }
    setBusy(true)
    try {
      await api.saveRestaurant(editing)
      pushToast({ tone: 'success', title: editing.id ? 'Restaurant updated' : 'Restaurant added' })
      setEditing(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const verify = async (row) => {
    try {
      await api.verifyRestaurant(row.id)
      pushToast({ tone: 'success', title: `Marked ${row.name} verified today` })
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not verify', message: err.message })
    }
  }

  return (
    <div className="apage">
      <PageHeader
        title="Restaurants"
        subtitle="Each venue has its own reservation path. Visit South Walton is a first pass — re-check restaurant websites every few months."
        actions={
          <Button icon="plus" onClick={() => setEditing({ ...EMPTY })}>
            Add restaurant
          </Button>
        }
      />

      <div className="stat-grid" style={{ marginBottom: 'var(--sp-5)' }}>
        <Stat label="Directory" value={Array.isArray(data) ? data.length : '—'} icon="utensils" />
        <Stat label="Needs review" value={staleCount} hint="Not verified in 90 days" icon="clock" />
      </div>

      <Panel
        title="Booking records"
        subtitle="Direct venue URLs only. A search-result link is fragile and will send guests to the wrong place."
      >
        <div style={{ padding: '0 var(--sp-5) var(--sp-5)' }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search name, town, or phone"
            label="Search restaurants"
          />
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <FilterChips
              options={FILTERS}
              value={filter}
              onChange={(next) => setFilter(next === 'All' ? 'all' : next)}
              label="Filter restaurants"
            />
          </div>

          {loading && <SkeletonList count={6} />}
          {error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && rows.length === 0 && (
            <InlineEmpty title="No restaurants matched" />
          )}
          {!loading && !error && rows.length > 0 && (
            <ul className="activity" style={{ marginTop: 'var(--sp-4)' }}>
              {rows.map((row) => (
                <li key={row.id} className="activity__row" style={{ alignItems: 'center' }}>
                  <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                    <span className="activity__title">{row.name}</span>
                    <span className="activity__body">
                      {row.location} · {platformLabel(row.bookingPlatform)}
                      {row.phone ? ` · ${row.phone}` : ''}
                    </span>
                    {row.bookingUrl && (
                      <span className="activity__body u-truncate">{row.bookingUrl}</span>
                    )}
                  </span>
                  <span className="tone-row" style={{ flex: 'none', flexWrap: 'nowrap' }}>
                    {row.stale ? (
                      <Badge tone="warn">Needs review</Badge>
                    ) : (
                      <Badge tone="ok">Verified {formatDate(row.lastVerifiedDate)}</Badge>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => verify(row)}>
                      Mark verified
                    </Button>
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(row)}>
                      Edit
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Edit restaurant booking' : 'Add restaurant'}
        subtitle="Use the restaurant’s own reservation page, not a search URL."
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy} icon="check">
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Name" required>
              {(p) => (
                <Input
                  {...p}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              )}
            </Field>
            <Field label="Town">
              {(p) => (
                <Input
                  {...p}
                  value={editing.location ?? ''}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                />
              )}
            </Field>
            <Field label="Phone" hint="Required for phone-only restaurants, and the fallback for everyone else.">
              {(p) => (
                <Input
                  {...p}
                  value={editing.phone ?? ''}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              )}
            </Field>
            <Field label="Booking platform" required>
              {(p) => (
                <Select
                  {...p}
                  value={editing.bookingPlatform ?? ''}
                  onChange={(e) => setEditing({ ...editing, bookingPlatform: e.target.value })}
                >
                  {PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {editing.bookingPlatform !== 'phone_only' && (
              <Field
                label="Direct booking URL"
                required
                hint="The restaurant’s specific page (resy.com/.../venues/the-citizen), never a search result."
              >
                {(p) => (
                  <Input
                    {...p}
                    value={editing.bookingUrl ?? ''}
                    onChange={(e) => setEditing({ ...editing, bookingUrl: e.target.value })}
                    placeholder="https://"
                  />
                )}
              </Field>
            )}
            <Field label="Website">
              {(p) => (
                <Input
                  {...p}
                  value={editing.website ?? ''}
                  onChange={(e) => setEditing({ ...editing, website: e.target.value })}
                />
              )}
            </Field>
            <Field label="Notes" hint="Where this path was confirmed, and anything that went stale.">
              {(p) => (
                <Textarea
                  {...p}
                  rows={3}
                  value={editing.bookingNotes ?? ''}
                  onChange={(e) => setEditing({ ...editing, bookingNotes: e.target.value })}
                />
              )}
            </Field>
            {editing.id && (
              <div className="setting-row">
                <span className="setting-row__text">
                  <span className="setting-row__title">Visible to guests</span>
                  <span className="setting-row__sub">Hide a listing without deleting the booking record.</span>
                </span>
                <span className="setting-row__control">
                  <Switch
                    checked={editing.active !== false}
                    onChange={(value) => setEditing({ ...editing, active: value })}
                    label="Visible to guests"
                  />
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
