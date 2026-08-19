import { useEffect, useRef, useState } from 'react'
import Button from '../../components/ui/Button'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Field, Input } from '../../components/ui/Form'
import { PageHeader, Panel, Grid, Facts } from '../../components/common/AdminUI'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { ROLES } from '../../data/adminUsers'
import { initials } from '../../utils/format'

function readBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(new Error('That file could not be read.'))
    reader.readAsDataURL(file)
  })
}

export default function Profile() {
  useDocumentTitle('Your profile')
  const { pushToast, refreshUser } = useAdmin()
  const { data, loading, error, reload, setData } = useLoad(() => api.getMe(), [])
  const fileRef = useRef(null)

  const [form, setForm] = useState({ name: '', title: '', phone: '', email: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  useEffect(() => {
    if (!data) return
    setForm({
      name: data.name ?? '',
      title: data.title ?? '',
      phone: data.phone ?? '',
      email: data.email ?? '',
    })
    refreshUser({
      name: data.name,
      email: data.email,
      title: data.title,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
    })
  }, [data, refreshUser])

  if (loading && !data) return <SkeletonPage />
  if (error && !data) return <ErrorState error={error} onRetry={reload} title="We could not open your profile" />

  const roleMeta = ROLES[data?.role] ?? { label: data?.role?.replace(/_/g, ' ') }

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async () => {
    if (!form.name.trim()) {
      pushToast({ tone: 'error', title: 'A name is required' })
      return
    }
    setBusy(true)
    try {
      const next = await api.updateMe(form)
      setData(next)
      refreshUser({
        name: next.name,
        email: next.email,
        title: next.title,
        phone: next.phone,
        avatarUrl: next.avatarUrl,
      })
      pushToast({ tone: 'success', title: 'Profile saved' })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const onPickPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      pushToast({ tone: 'error', title: 'Use a JPEG, PNG, or WebP image' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      pushToast({ tone: 'error', title: 'That photo is too large', message: 'The limit is 5 MB.' })
      return
    }
    setPhotoBusy(true)
    try {
      const next = await api.uploadMyAvatar({ mimeType: file.type, base64: await readBase64(file) })
      setData(next)
      refreshUser({ avatarUrl: next.avatarUrl, name: next.name })
      pushToast({ tone: 'success', title: 'Photo updated' })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not upload that photo', message: err.message })
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = async () => {
    setPhotoBusy(true)
    try {
      const next = await api.removeMyAvatar()
      setData(next)
      refreshUser({ avatarUrl: null })
      pushToast({ tone: 'success', title: 'Photo removed' })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not remove the photo', message: err.message })
    } finally {
      setPhotoBusy(false)
    }
  }

  const changePassword = async () => {
    if (passwords.newPassword.length < 8) {
      pushToast({ tone: 'error', title: 'Use at least 8 characters' })
      return
    }
    if (passwords.newPassword !== passwords.confirm) {
      pushToast({ tone: 'error', title: 'The new passwords do not match' })
      return
    }
    setBusy(true)
    try {
      await api.changeMyPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      })
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' })
      pushToast({ tone: 'success', title: 'Password changed' })
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not change password', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="apage">
      <PageHeader
        title="Your profile"
        subtitle="This is how you appear to the rest of the operations team. Role permissions are unchanged here."
        actions={
          <Button onClick={save} loading={busy} icon="check">
            Save profile
          </Button>
        }
      />

      <Grid cols={2}>
        <Panel title="Photo" subtitle="JPEG, PNG or WebP · up to 5 MB.">
          <div className="profile-photo">
            <span className="profile-photo__frame" aria-hidden="true">
              {data?.avatarUrl ? (
                <img src={data.avatarUrl} alt="" />
              ) : (
                <span>{initials(form.name || 'Admin')}</span>
              )}
            </span>
            <div className="profile-photo__actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={onPickPhoto}
              />
              <Button
                variant="secondary"
                icon="upload"
                loading={photoBusy}
                onClick={() => fileRef.current?.click()}
              >
                Upload photo
              </Button>
              {data?.avatarUrl && (
                <Button variant="ghost" icon="trash" disabled={photoBusy} onClick={removePhoto}>
                  Remove
                </Button>
              )}
              <p className="u-xs u-muted" style={{ margin: 0, lineHeight: 1.5 }}>
                A square crop looks best in the sidebar and top bar.
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="Account">
          <Facts
            items={[
              { label: 'Role', value: roleMeta.label },
              { label: 'Status', value: data?.status ?? 'active' },
              { label: 'Email', value: data?.email },
            ]}
          />
        </Panel>
      </Grid>

      <Panel title="Details">
        <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
          <Grid cols={2}>
            <Field label="Full name" required>
              {(p) => (
                <Input
                  {...p}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Alex Rivera"
                />
              )}
            </Field>
            <Field label="Job title" hint="Shown under your name in the sidebar.">
              {(p) => (
                <Input
                  {...p}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Operations lead"
                />
              )}
            </Field>
            <Field label="Work email" required>
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  autoComplete="email"
                />
              )}
            </Field>
            <Field label="Phone">
              {(p) => (
                <Input
                  {...p}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="850-555-0140"
                  autoComplete="tel"
                />
              )}
            </Field>
          </Grid>
        </div>
      </Panel>

      <Panel title="Password" subtitle="Leave blank unless you want to change it.">
        <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
          <Grid cols={2}>
            <Field label="Current password">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  autoComplete="current-password"
                />
              )}
            </Field>
            <span />
            <Field label="New password" hint="At least 8 characters.">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))}
                  autoComplete="new-password"
                />
              )}
            </Field>
            <Field label="Confirm new password">
              {(p) => (
                <Input
                  {...p}
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))}
                  autoComplete="new-password"
                />
              )}
            </Field>
          </Grid>
          <div>
            <Button
              variant="secondary"
              icon="shield"
              loading={busy}
              onClick={changePassword}
              disabled={!passwords.currentPassword || !passwords.newPassword}
            >
              Change password
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  )
}
