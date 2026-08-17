import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import SmartImage from '../../components/ui/SmartImage'
import Modal from '../../components/ui/Modal'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Field, Input, Textarea, Select, Switch } from '../../components/ui/Form'
import {
  PageHeader, Panel, Grid, Stat, Facts, StatusPill, InlineEmpty,
} from '../../components/common/AdminUI'
import DataTable from '../../components/tables/DataTable'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { PROPERTY_STATUSES } from '../../data/properties'
import { GUEST_STATUSES } from '../../data/guests'
import { GROCERY_STATUSES } from '../../data/orders'
import { TRANSFER_STATUSES } from '../../data/transfers'
import { formatDate, formatShortDate } from '../../utils/format'

export default function PropertyDetail() {
  const { id } = useParams()
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getProperty(id), [id])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  useDocumentTitle(data ? data.property.name : 'Property')

  if (loading) return <SkeletonPage />
  if (error) return <ErrorState error={error} onRetry={reload} title="We could not open that" />

  const { property, host, guests, orders, transfers, conversations } = data
  const inResidence = guests.filter((g) => g.status === 'active')

  const openEditor = () => {
    setForm({
      name: property.name,
      status: property.status,
      type: property.type,
      address: property.address,
      wifiNetwork: property.wifi.network,
      wifiPassword: property.wifi.password,
      checkIn: property.checkIn.time,
      checkOut: property.checkOut.time,
      accessInstructions: property.checkIn.instructions,
      checkOutInstructions: property.checkOut.instructions,
      parking: property.parking,
      rules: property.rules.join('\n'),
      emergencyName: property.emergency.contactName,
      emergencyPhone: property.emergency.contactPhone,
      hospital: property.emergency.hospital,
      vitoriaEnabled: property.vitoria.enabled,
      vitoriaTone: property.vitoria.tone,
      vitoriaNotes: property.vitoria.specialNotes,
    })
    setEditing(true)
  }

  const save = async () => {
    setBusy(true)
    try {
      await api.updateProperty(id, {
        name: form.name,
        status: form.status,
        type: form.type,
        address: form.address,
        wifi: { ...property.wifi, network: form.wifiNetwork, password: form.wifiPassword },
        checkIn: { time: form.checkIn, instructions: form.accessInstructions },
        checkOut: { time: form.checkOut, instructions: form.checkOutInstructions },
        parking: form.parking,
        rules: form.rules.split('\n').map((r) => r.trim()).filter(Boolean),
        emergency: {
          ...property.emergency,
          contactName: form.emergencyName,
          contactPhone: form.emergencyPhone,
          hospital: form.hospital,
        },
        vitoria: {
          ...property.vitoria,
          enabled: form.vitoriaEnabled,
          tone: form.vitoriaTone,
          specialNotes: form.vitoriaNotes,
        },
      })
      pushToast({ tone: 'success', title: 'Property updated' })
      setEditing(false)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="apage">
      <PageHeader
        title={property.name}
        subtitle={`${property.address} · ${property.type} · ${property.bedrooms} bed, sleeps ${property.sleeps}`}
        back={{ to: '/admin/properties', label: 'All properties' }}
        actions={
          <>
            <StatusPill map={PROPERTY_STATUSES} value={property.status} />
            <Button size="sm" icon="edit" onClick={openEditor}>Edit property</Button>
          </>
        }
      />

      <div className="astats">
        <Stat label="In residence" value={inResidence.length} icon="users" tone="success" />
        <Stat label="Guests all time" value={guests.length} icon="user" tone="sea" />
        <Stat label="Conversations" value={conversations.length} icon="sparkles" tone="gold" />
        <Stat
          label="Satisfaction"
          value={property.stats.satisfaction ?? '—'}
          suffix={property.stats.satisfaction ? ' / 5' : ''}
          icon="star"
          tone="info"
        />
      </div>

      <Grid cols={2}>
        <Panel title="Property">
          <Facts
            items={[
              { label: 'Name', value: property.name },
              { label: 'Type', value: property.type },
              {
                label: 'Host',
                value: host ? <Link to={`/admin/hosts/${host.id}`}>{host.name}</Link> : '—',
              },
              { label: 'Address', value: property.address },
              { label: 'Bedrooms', value: property.bedrooms },
              { label: 'Bathrooms', value: property.bathrooms },
              { label: 'Sleeps', value: property.sleeps },
              { label: 'Added', value: formatDate(property.createdAt) },
            ]}
          />
        </Panel>

        <Panel title="Arrival and departure">
          <Facts
            items={[
              { label: 'Check-in', value: property.checkIn.time },
              { label: 'Check-out', value: property.checkOut.time },
              { label: 'WiFi network', value: property.wifi.network },
              { label: 'WiFi password', value: property.wifi.password },
              { label: 'Parking', value: property.parking },
            ]}
          />
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <p className="stat__label" style={{ marginBottom: 4 }}>Access instructions</p>
            <p className="u-small" style={{ lineHeight: 1.6 }}>{property.checkIn.instructions}</p>
          </div>
          <div style={{ marginTop: 'var(--sp-3)' }}>
            <p className="stat__label" style={{ marginBottom: 4 }}>Check-out steps</p>
            <p className="u-small" style={{ lineHeight: 1.6 }}>{property.checkOut.instructions}</p>
          </div>
        </Panel>
      </Grid>

      <Grid cols={2}>
        <Panel title="House rules">
          <ul className="u-stack" style={{ gap: 8, margin: 0, paddingLeft: 18 }}>
            {property.rules.map((rule) => (
              <li key={rule} className="u-small" style={{ lineHeight: 1.55 }}>{rule}</li>
            ))}
          </ul>
        </Panel>

        <Panel title="Emergency contacts">
          <Facts
            items={[
              { label: 'Primary contact', value: property.emergency.contactName },
              { label: 'Phone', value: property.emergency.contactPhone },
              { label: 'Property manager', value: property.emergency.managerPhone },
              { label: 'Nearest hospital', value: property.emergency.hospital },
            ]}
          />
        </Panel>
      </Grid>

      <Panel
        title="Vitoria configuration"
        subtitle="How the concierge behaves for guests staying here."
      >
        <Facts
          items={[
            { label: 'Enabled', value: property.vitoria.enabled ? 'Yes' : 'No' },
            { label: 'Tone', value: property.vitoria.tone },
            { label: 'Escalate after', value: `${property.vitoria.escalateAfter} unresolved replies` },
            { label: 'Local recommendations', value: `${property.recommendations} from the host` },
            {
              label: 'Special notes',
              value: property.vitoria.specialNotes || 'None — Vitoria uses the property information above.',
            },
          ]}
        />
      </Panel>

      <Panel title="Photographs">
        <div className="mediagrid">
          {property.images.map((photoId, i) => (
            <div className="mediacard" key={`${photoId}-${i}`}>
              <div className="mediacard__img">
                <SmartImage photoId={photoId} alt={`${property.name} photo ${i + 1}`} fill width={500} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Grid cols={2}>
        <Panel title="Guests" flush>
          <DataTable
            columns={[
              { key: 'name', label: 'Guest', primary: true },
              { key: 'checkIn', label: 'Arrival', render: (r) => formatShortDate(r.checkIn) },
              { key: 'status', label: 'Status', render: (r) => <StatusPill map={GUEST_STATUSES} value={r.status} /> },
            ]}
            rows={guests.slice(0, 10)}
            rowTo={(r) => `/admin/guests/${r.id}`}
            caption="Guests at this property"
            empty={{ icon: 'users', title: 'No guests yet' }}
          />
        </Panel>

        <Panel title="Service activity" flush>
          <DataTable
            columns={[
              { key: 'id', label: 'Request', primary: true, render: (r) => <span className="dtable__mono">{r.id}</span> },
              { key: 'kind', label: 'Type', render: (r) => (r.id.startsWith('GR') ? 'Grocery' : 'Transfer') },
              {
                key: 'status',
                label: 'Status',
                render: (r) =>
                  r.id.startsWith('GR') ? (
                    <StatusPill map={GROCERY_STATUSES} value={r.status} />
                  ) : (
                    <StatusPill map={TRANSFER_STATUSES} value={r.status} />
                  ),
              },
            ]}
            rows={[...orders, ...transfers].slice(0, 10)}
            rowTo={(r) => (r.id.startsWith('GR') ? `/admin/grocery/${r.id}` : `/admin/transfers/${r.id}`)}
            caption="Service requests at this property"
            empty={{ icon: 'bag', title: 'No service requests' }}
          />
        </Panel>
      </Grid>

      {/* -------------------------------- Editor -------------------------- */}
      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        title="Edit property"
        subtitle={property.name}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} loading={busy} icon="check">Save changes</Button>
          </>
        }
      >
        {form && (
          <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
            <Field label="Property name">
              {(p) => <Input {...p} value={form.name} onChange={(e) => set('name')(e.target.value)} />}
            </Field>

            <Grid cols={2}>
              <Field label="Status">
                {(p) => (
                  <Select {...p} value={form.status} onChange={(e) => set('status')(e.target.value)}>
                    {Object.entries(PROPERTY_STATUSES).map(([key, meta]) => (
                      <option key={key} value={key}>{meta.label}</option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Type">
                {(p) => <Input {...p} value={form.type} onChange={(e) => set('type')(e.target.value)} />}
              </Field>
            </Grid>

            <Field label="Address">
              {(p) => <Input {...p} value={form.address} onChange={(e) => set('address')(e.target.value)} />}
            </Field>

            <Grid cols={2}>
              <Field label="WiFi network">
                {(p) => <Input {...p} value={form.wifiNetwork} onChange={(e) => set('wifiNetwork')(e.target.value)} />}
              </Field>
              <Field label="WiFi password">
                {(p) => <Input {...p} value={form.wifiPassword} onChange={(e) => set('wifiPassword')(e.target.value)} />}
              </Field>
              <Field label="Check-in time">
                {(p) => <Input {...p} value={form.checkIn} onChange={(e) => set('checkIn')(e.target.value)} />}
              </Field>
              <Field label="Check-out time">
                {(p) => <Input {...p} value={form.checkOut} onChange={(e) => set('checkOut')(e.target.value)} />}
              </Field>
            </Grid>

            <Field label="Access instructions">
              {(p) => (
                <Textarea {...p} rows={3} value={form.accessInstructions} onChange={(e) => set('accessInstructions')(e.target.value)} />
              )}
            </Field>

            <Field label="Check-out steps">
              {(p) => (
                <Textarea {...p} rows={2} value={form.checkOutInstructions} onChange={(e) => set('checkOutInstructions')(e.target.value)} />
              )}
            </Field>

            <Field label="Parking">
              {(p) => <Textarea {...p} rows={2} value={form.parking} onChange={(e) => set('parking')(e.target.value)} />}
            </Field>

            <Field label="House rules" hint="One rule per line.">
              {(p) => <Textarea {...p} rows={5} value={form.rules} onChange={(e) => set('rules')(e.target.value)} />}
            </Field>

            <Grid cols={2}>
              <Field label="Emergency contact">
                {(p) => <Input {...p} value={form.emergencyName} onChange={(e) => set('emergencyName')(e.target.value)} />}
              </Field>
              <Field label="Emergency phone">
                {(p) => <Input {...p} value={form.emergencyPhone} onChange={(e) => set('emergencyPhone')(e.target.value)} />}
              </Field>
            </Grid>

            <Field label="Nearest hospital">
              {(p) => <Input {...p} value={form.hospital} onChange={(e) => set('hospital')(e.target.value)} />}
            </Field>

            <div className="setting-row">
              <span className="setting-row__text">
                <span className="setting-row__title">Vitoria enabled</span>
                <span className="setting-row__sub">
                  Turning this off means guests here get no concierge answers.
                </span>
              </span>
              <span className="setting-row__control">
                <Switch
                  checked={form.vitoriaEnabled}
                  onChange={set('vitoriaEnabled')}
                  label="Vitoria enabled"
                />
              </span>
            </div>

            <Field label="Vitoria tone">
              {(p) => (
                <Select {...p} value={form.vitoriaTone} onChange={(e) => set('vitoriaTone')(e.target.value)}>
                  <option>Warm and local</option>
                  <option>Concise</option>
                  <option>Playful</option>
                </Select>
              )}
            </Field>

            <Field label="Special notes for Vitoria" hint="Anything unusual about this house.">
              {(p) => (
                <Textarea {...p} rows={3} value={form.vitoriaNotes} onChange={(e) => set('vitoriaNotes')(e.target.value)} placeholder="The pool heater takes four hours; tell guests to switch it on the night before." />
              )}
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
