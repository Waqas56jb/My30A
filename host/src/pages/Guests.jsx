import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { SearchBar, FilterChips, Checkbox } from '../components/ui/Form'
import { Avatar } from '../components/ui/Display'
import { EmptyState, ErrorState } from '../components/ui/States'
import { SkeletonList } from '../components/ui/Skeleton'
import { Panel, AccessBadge } from '../components/HostUI'
import DataTable from '../components/DataTable'
import { useWorkspace } from '../context/WorkspaceContext'
import { useAsync } from '../hooks/useAsync'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import * as guestService from '../services/guestService'
import { formatDateRange, formatRelative } from '../utils/format'

const STATUS_FILTERS = [
  { value: 'All', label: 'All' },
  { value: 'active', label: 'In the house' },
  { value: 'invited', label: 'Arriving' },
  { value: 'expired', label: 'Past stays' },
]

export default function Guests() {
  const { activeProperty } = useWorkspace()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [thisPropertyOnly, setThisPropertyOnly] = useState(true)
  useDocumentTitle('Guests')

  const propertyId = thisPropertyOnly ? activeProperty?.id : null

  const guests = useAsync(
    () => guestService.listGuests({ propertyId, search, status }),
    [propertyId, search, status],
  )

  const rows = guests.data ?? []

  const columns = [
    {
      key: 'stay',
      header: 'Stay',
      render: (guest) => formatDateRange(guest.checkIn, guest.checkOut),
    },
    {
      key: 'status',
      header: 'Access',
      primary: true,
      render: (guest) => <AccessBadge status={guest.accessStatus} />,
    },
    {
      key: 'lastActive',
      header: 'Last active',
      render: (guest) => (guest.lastActive ? formatRelative(guest.lastActive) : 'Not yet'),
    },
    {
      key: 'conversations',
      header: 'Conversations',
      render: (guest) => guest.conversations,
    },
    {
      key: 'satisfaction',
      header: 'Rating',
      render: (guest) =>
        guest.satisfaction ? (
          <span className="u-row" style={{ gap: 4 }}>
            <Icon name="star" size={14} style={{ color: 'var(--gold)' }} />
            {guest.satisfaction}
          </span>
        ) : (
          <span className="u-muted">—</span>
        ),
    },
    {
      key: 'party',
      header: 'Party',
      render: (guest) => `${guest.partySize} guests`,
    },
  ]

  return (
    <div className="hpage">
      <header className="u-between u-wrap" style={{ gap: 'var(--sp-4)', marginBottom: 'var(--sp-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-h1)' }}>Guests</h1>
          <p className="u-small u-muted" style={{ marginTop: 4 }}>
            Who has your link, whether it worked, and how their stay is going.
          </p>
        </div>
      </header>

      <div className="hrow" style={{ marginBottom: 'var(--sp-3)' }}>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email"
          label="Search guests"
          className="u-grow"
        />
      </div>

      <div className="u-between u-wrap" style={{ gap: 'var(--sp-3)' }}>
        <FilterChips
          options={STATUS_FILTERS}
          value={status}
          onChange={setStatus}
          label="Filter guests by access status"
          wrap
        />
        {activeProperty && (
          <Checkbox checked={thisPropertyOnly} onChange={setThisPropertyOnly}>
            {activeProperty.name} only
          </Checkbox>
        )}
      </div>

      <div style={{ marginTop: 'var(--sp-4)' }}>
        {guests.loading && <SkeletonList count={4} />}
        {guests.error && <ErrorState error={guests.error} onRetry={guests.reload} />}

        {!guests.loading && !guests.error && rows.length === 0 && (
          <EmptyState
            icon="users"
            title={search || status !== 'All' ? 'No guests matched' : 'No guests yet'}
            message={
              search || status !== 'All'
                ? 'Try a different search or filter.'
                : 'Once you share your guest link and someone opens it, they will appear here with their stay dates and activity.'
            }
            actionLabel={search || status !== 'All' ? undefined : 'Set up guest access'}
            actionTo={
              search || status !== 'All'
                ? undefined
                : activeProperty
                  ? `/host/properties/${activeProperty.id}/guest-access`
                  : '/host/properties'
            }
          />
        )}

        {!guests.loading && rows.length > 0 && (
          <Panel flush>
            <DataTable
              rows={rows}
              columns={columns}
              caption="Guests and their access status"
              rowKey={(guest) => guest.id}
              cardTitle={(guest) => guest.name}
              cardMedia={(guest) => <Avatar src={guest.avatar} name={guest.name} size="sm" />}
              onRowClick={(guest) => navigate(`/host/guests/${guest.id}`)}
            />
          </Panel>
        )}
      </div>

      <p className="u-xs u-muted" style={{ marginTop: 'var(--sp-5)', maxWidth: '70ch' }}>
        <Icon name="lock" size={13} style={{ verticalAlign: '-2px', marginRight: 4 }} />
        You see stay dates, access status and activity summaries. Guest conversations with Vitoria are
        summarised rather than exposed in full, and personal contact details are only shown where you
        need them to reach someone.
      </p>

      <div style={{ height: 'var(--sp-7)' }} />
    </div>
  )
}
