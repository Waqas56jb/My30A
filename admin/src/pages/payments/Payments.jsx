import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SearchBar, FilterChips, Field, Select } from '../../components/ui/Form'
import {
  PageHeader, Panel, StatusPill, Money, Stat, MockPaymentNote, Facts, ActivityList,
} from '../../components/common/AdminUI'
import DataTable, { Pagination, TableToolbar } from '../../components/tables/DataTable'
import RefundModal from '../../components/modals/RefundModal'
import { useTable } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { PAYMENT_STATUSES, PAYMENT_TYPES } from '../../data/payments'
import { formatDate, formatTime, formatShortDate } from '../../utils/format'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  ...Object.entries(PAYMENT_STATUSES).map(([value, meta]) => ({ value, label: meta.label })),
]

export default function Payments() {
  useDocumentTitle('Payments')
  const { pushToast } = useAdmin()
  const table = useTable(api.getPayments, { initial: { filters: { status: 'all', type: 'all' } } })
  const [open, setOpen] = useState(null)
  const [refunding, setRefunding] = useState(null)
  const [busy, setBusy] = useState(false)

  const refund = async ({ amount, reason }) => {
    setBusy(true)
    try {
      await api.refundPayment(refunding.id, { amount, reason })
      pushToast({ tone: 'success', title: 'Refund raised', message: `${refunding.id} marked refunded.` })
      setRefunding(null)
      setOpen(null)
      table.reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not refund', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Payment',
      primary: true,
      render: (row) => <span className="dtable__strong dtable__mono">{row.id}</span>,
    },
    {
      key: 'guestName',
      label: 'Guest',
      render: (row) =>
        row.guestId ? (
          <Link to={`/admin/guests/${row.guestId}`} onClick={(e) => e.stopPropagation()}>
            {row.guestName}
          </Link>
        ) : (
          row.guestName
        ),
    },
    { key: 'type', label: 'Type', render: (row) => PAYMENT_TYPES[row.type]?.label ?? row.type },
    { key: 'amount', label: 'Amount', align: 'right', render: (row) => <Money amount={row.amount} /> },
    { key: 'method', label: 'Method', hideOn: 'card' },
    { key: 'status', label: 'Status', render: (row) => <StatusPill map={PAYMENT_STATUSES} value={row.status} /> },
    {
      key: 'relatedLabel',
      label: 'Related',
      hideOn: 'card',
      render: (row) =>
        row.relatedLink ? (
          <Link to={row.relatedLink} onClick={(e) => e.stopPropagation()}>{row.relatedLabel}</Link>
        ) : (
          '—'
        ),
    },
    { key: 'createdAt', label: 'Created', hideOn: 'card', render: (row) => formatShortDate(row.createdAt) },
  ]

  const captured = table.rows.filter((p) => p.status === 'captured')

  return (
    <div className="apage">
      <PageHeader
        title="Transactions"
        subtitle="Every payment My30A takes: grocery baskets, service fees, transfers, tips and host subscriptions."
        actions={
          <>
            <Button to="/admin/payments/refunds" variant="secondary" icon="refresh">Refunds</Button>
            <Button to="/admin/payments/tips" variant="secondary" icon="heart">Tips</Button>
          </>
        }
      />

      <MockPaymentNote />

      <div className="astats">
        <Stat label="On this page" value={table.total} icon="creditCard" tone="sea" />
        <Stat
          label="Captured"
          value={<Money amount={captured.reduce((s, p) => s + p.amount, 0)} />}
          icon="checkCircle"
          tone="success"
        />
        <Stat
          label="Authorised, not captured"
          value={table.rows.filter((p) => p.status === 'authorized').length}
          icon="lock"
          tone="info"
          hint="Transfer holds awaiting completion"
        />
        <Stat
          label="Failed"
          value={table.rows.filter((p) => p.status === 'failed').length}
          icon="alert"
          tone="danger"
          to="/admin/payments?status=failed"
        />
      </div>

      <Panel flush>
        <TableToolbar>
          <SearchBar
            value={table.search}
            onChange={table.setSearch}
            placeholder="Search payment id, guest or related order"
            label="Search payments"
          />
          <Field label="Type">
            {(props) => (
              <Select
                {...props}
                value={table.filters.type}
                onChange={(e) => table.setFilter('type', e.target.value)}
              >
                <option value="all">All types</option>
                {Object.entries(PAYMENT_TYPES).map(([value, meta]) => (
                  <option key={value} value={value}>{meta.label}</option>
                ))}
              </Select>
            )}
          </Field>
          <FilterChips
            options={STATUS_FILTERS}
            value={table.filters.status}
            onChange={(value) => table.setFilter('status', value)}
            label="Filter by status"
            wrap
          />
        </TableToolbar>

        <DataTable
          columns={columns}
          rows={table.rows}
          loading={table.loading}
          error={table.error}
          onRetry={table.reload}
          onRowClick={(row) => setOpen(row)}
          caption="Payments"
          empty={{ icon: 'creditCard', title: 'No payments match those filters' }}
        />

        <Pagination
          page={table.page}
          pages={table.pages}
          total={table.total}
          pageSize={table.pageSize}
          onPage={table.setPage}
        />
      </Panel>

      {/* -------------------------- Payment detail ------------------------ */}
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={open ? `Payment ${open.id}` : ''}
        subtitle={open ? `${open.guestName} · ${PAYMENT_TYPES[open.type]?.label}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>
            {open && ['captured', 'authorized'].includes(open.status) && (
              <Button variant="danger" icon="refresh" onClick={() => setRefunding(open)}>
                Refund
              </Button>
            )}
          </>
        }
      >
        {open && (
          <>
            <Facts
              items={[
                { label: 'Payment id', value: open.id },
                { label: 'Guest', value: open.guestName },
                { label: 'Type', value: PAYMENT_TYPES[open.type]?.label ?? open.type },
                { label: 'Amount', value: <Money amount={open.amount} /> },
                { label: 'Status', value: <StatusPill map={PAYMENT_STATUSES} value={open.status} /> },
                { label: 'Method', value: open.method },
                { label: 'Related', value: open.relatedLabel ?? '—' },
                open.failureReason && { label: 'Failure', value: open.failureReason },
              ]}
            />

            <div style={{ marginTop: 'var(--sp-4)' }}>
              <p className="stat__label" style={{ marginBottom: 8 }}>Timeline</p>
              <ActivityList
                items={[
                  open.createdAt && {
                    id: 'created', icon: 'plus', title: 'Created',
                    meta: `${formatDate(open.createdAt)} ${formatTime(open.createdAt)}`,
                  },
                  open.authorizedAt && {
                    id: 'authorized', icon: 'lock', title: 'Authorised',
                    body: 'A hold was placed on the card — not a charge.',
                    meta: `${formatDate(open.authorizedAt)} ${formatTime(open.authorizedAt)}`,
                  },
                  open.capturedAt && {
                    id: 'captured', icon: 'checkCircle', title: 'Captured',
                    body: 'The hold became a charge.',
                    meta: `${formatDate(open.capturedAt)} ${formatTime(open.capturedAt)}`,
                  },
                  open.refundedAt && {
                    id: 'refunded', icon: 'refresh', title: 'Refunded',
                    meta: `${formatDate(open.refundedAt)} ${formatTime(open.refundedAt)}`,
                  },
                ].filter(Boolean)}
              />
            </div>

            <MockPaymentNote />
          </>
        )}
      </Modal>

      <RefundModal
        open={!!refunding}
        payment={refunding}
        loading={busy}
        onClose={() => setRefunding(null)}
        onConfirm={refund}
      />
    </div>
  )
}
