import { useState } from 'react'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import { Callout } from '../../components/ui/Display'
import { Field, Input, Select } from '../../components/ui/Form'
import { PageHeader, Panel, Grid, Stat, InlineEmpty, ReferralNote } from '../../components/common/AdminUI'
import DataTable from '../../components/tables/DataTable'
import RangeFilter from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { REPORTS, generate, downloadCsv } from '../../services/reportService'
import { formatNumber } from '../../utils/format'

/**
 * Reports.
 *
 * The CSV is assembled in the browser from the same tables the screens read,
 * so a downloaded file always matches what was shown. Nothing is uploaded
 * anywhere — the export builds a Blob and hands it to the browser.
 */
export default function Reports() {
  useDocumentTitle('Reports')
  const { pushToast } = useAdmin()

  const [selected, setSelected] = useState(REPORTS[0].id)
  const [range, setRange] = useState('30d')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)

  /* Everything a report might need, loaded once. */
  const guests = useLoad(() => api.getGuests({ pageSize: 500 }), [])
  const hosts = useLoad(() => api.getHosts({ pageSize: 200 }), [])
  const partners = useLoad(() => api.getPartners({ pageSize: 300 }), [])
  const orders = useLoad(() => api.getOrders({ pageSize: 500 }), [])
  const transfers = useLoad(() => api.getTransfers({ pageSize: 300 }), [])
  const payments = useLoad(() => api.getPayments({ pageSize: 1000 }), [])
  const conversations = useLoad(() => api.getConversations({ pageSize: 500 }), [])
  const categories = useLoad(() => api.getCategories(), [])

  const loading = [guests, hosts, partners, orders, transfers, payments, conversations].some(
    (r) => r.loading,
  )

  const report = REPORTS.find((r) => r.id === selected)

  const run = async () => {
    setBusy(true)
    try {
      const output = await generate(selected, {
        guests: guests.data?.rows ?? [],
        hosts: hosts.data?.rows ?? [],
        partners: partners.data?.rows ?? [],
        orders: orders.data?.rows ?? [],
        transfers: transfers.data?.rows ?? [],
        payments: payments.data?.rows ?? [],
        conversations: conversations.data?.rows ?? [],
        categories: Array.isArray(categories.data) ? categories.data : [],
      })
      setResult(output)
      pushToast({ tone: 'success', title: `${output.report.name} generated`, message: `${output.rows.length} rows.` })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not generate', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const exportCsv = () => {
    if (!result) return
    const ok = downloadCsv(`my30a-${result.report.id}-${range}.csv`, result.csv)
    pushToast({
      tone: ok ? 'success' : 'info',
      title: ok ? 'CSV downloaded' : 'Download not available here',
      message: ok ? undefined : 'The preview below holds the same data.',
    })
  }

  const previewColumns = (result?.report.columns ?? []).map((label, i) => ({
    key: `c${i}`,
    label,
    primary: i === 0,
    render: (row) => {
      const value = Array.isArray(row) ? row[i] : row?.[i]
      if (value == null || value === '') return '—'
      if (typeof value === 'object') return '—'
      return String(value)
    },
  }))

  return (
    <div className="apage">
      <PageHeader
        title="Reports"
        subtitle="Generate a table, preview it, export it as CSV."
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <Grid cols={2}>
        <Panel title="Choose a report">
          <div className="u-stack" style={{ gap: 'var(--sp-2)' }}>
            {REPORTS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={`rolepick__btn${selected === r.id ? ' is-active' : ''}`}
                onClick={() => {
                  setSelected(r.id)
                  setResult(null)
                }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%' }}
              >
                <Icon name={r.icon} size={16} style={{ marginTop: 2, flex: 'none' }} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block' }}>{r.name}</span>
                  <span className="u-xs u-muted" style={{ display: 'block', fontWeight: 400, lineHeight: 1.45 }}>
                    {r.blurb}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title={report.name} subtitle={report.blurb}>
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Period">
              {(p) => (
                <Select {...p} value={range} onChange={(e) => setRange(e.target.value)}>
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="12m">Last 12 months</option>
                </Select>
              )}
            </Field>

            <div>
              <p className="stat__label" style={{ marginBottom: 6 }}>Columns</p>
              <div className="chiplist">
                {report.columns.map((column) => (
                  <span key={column} className="chip">{column}</span>
                ))}
              </div>
            </div>

            <div className="tone-row">
              <Button onClick={run} loading={busy} disabled={loading} icon="refresh">
                Generate report
              </Button>
              <Button onClick={exportCsv} variant="secondary" disabled={!result} icon="download">
                Export CSV
              </Button>
            </div>

            {selected === 'partner' || selected === 'referral' ? <ReferralNote compact /> : null}
          </div>
        </Panel>
      </Grid>

      <Panel
        title="Preview"
        subtitle={result ? `${formatNumber(result.rows.length)} rows` : 'Generate a report to see it here.'}
        flush
      >
        {!result ? (
          <InlineEmpty
            icon="upload"
            title="Nothing generated yet"
            body="Pick a report and a period, then press Generate."
          />
        ) : result.rows.length === 0 ? (
          <InlineEmpty icon="search" title="No rows in this period" />
        ) : (
          <DataTable
            columns={previewColumns}
            rows={result.rows.slice(0, 50)}
            rowKey={(row, index) =>
              Array.isArray(row) ? row.map((value) => (value == null ? '' : String(value))).join('|') : String(index)
            }
            caption={result.report.name}
          />
        )}
      </Panel>

      {result && result.rows.length > 50 && (
        <Callout icon="info">
          Showing the first 50 of {formatNumber(result.rows.length)} rows. The CSV export contains
          every row.
        </Callout>
      )}
    </div>
  )
}
