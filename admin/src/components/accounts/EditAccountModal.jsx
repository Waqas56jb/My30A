import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Field, Input, Select, Textarea } from '../ui/Form'

const blank = (value) => (value && value !== '—' ? String(value) : '')

const FIELDS = {
  guest: [
    { key: 'firstName', label: 'First name', required: true },
    { key: 'lastName', label: 'Last name', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone' },
    {
      key: 'languageCode',
      label: 'Language',
      type: 'select',
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
      ],
    },
  ],
  host: [
    { key: 'firstName', label: 'First name', required: true },
    { key: 'lastName', label: 'Last name', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
  ],
  partner: [
    { key: 'name', label: 'Business name', required: true },
    { key: 'ownerName', label: 'Owner' },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone' },
    { key: 'website', label: 'Website' },
    { key: 'town', label: 'Town' },
    { key: 'address', label: 'Address' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
}

function draftFrom(kind, row) {
  const next = {}
  for (const field of FIELDS[kind] ?? []) {
    next[field.key] = blank(row?.[field.key])
  }
  if (kind === 'guest' && !next.languageCode) next.languageCode = 'en'
  if (kind === 'partner' && !next.ownerName) next.ownerName = blank(row?.owner)
  return next
}

export default function EditAccountModal({ open, kind, row, onClose, onSave, loading = false }) {
  const [draft, setDraft] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && row) {
      setDraft(draftFrom(kind, row))
      setError('')
    }
  }, [open, kind, row])

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }))

  const submit = () => {
    const fields = FIELDS[kind] ?? []
    for (const field of fields) {
      if (field.required && !String(draft[field.key] ?? '').trim()) {
        setError(`${field.label} is required.`)
        return
      }
      if (field.type === 'email' && !String(draft[field.key] ?? '').includes('@')) {
        setError('Enter a valid email address.')
        return
      }
    }
    const patch = { ...draft }
    if (kind === 'guest') {
      patch.language = draft.languageCode
      delete patch.languageCode
    }
    onSave(patch)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit ${row?.name ?? 'account'}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} loading={loading} icon="edit">
            Save
          </Button>
        </>
      }
    >
      <div className="account-form">
        {(FIELDS[kind] ?? []).map((field) => (
          <Field key={field.key} label={field.label} required={field.required}>
            {(props) =>
              field.type === 'select' ? (
                <Select {...props} value={draft[field.key] ?? ''} onChange={(e) => set(field.key, e.target.value)}>
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  {...props}
                  rows={4}
                  value={draft[field.key] ?? ''}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              ) : (
                <Input
                  {...props}
                  type={field.type === 'email' ? 'email' : 'text'}
                  value={draft[field.key] ?? ''}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              )
            }
          </Field>
        ))}
        {error ? <p className="field__error">{error}</p> : null}
      </div>
    </Modal>
  )
}
