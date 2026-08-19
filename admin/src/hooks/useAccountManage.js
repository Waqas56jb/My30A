import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'
import * as api from '../services/adminApi'

const SPECS = {
  guest: {
    update: api.updateGuest,
    status: api.setGuestStatus,
    remove: api.deleteGuest,
    listPath: '/admin/guests',
    blockStatus: 'blocked',
    liveStatus: 'active',
  },
  host: {
    update: api.updateHost,
    status: api.setHostStatus,
    remove: api.deleteHost,
    listPath: '/admin/hosts',
    blockStatus: 'suspended',
    liveStatus: 'active',
  },
  partner: {
    update: api.updatePartner,
    status: api.setPartnerStatus,
    remove: api.deletePartner,
    listPath: '/admin/partners',
    blockStatus: 'suspended',
    liveStatus: 'approved',
  },
}

export function isBlocked(kind, row) {
  if (!row) return false
  if (kind === 'guest') return (row.accountStatus ?? 'active') === 'blocked'
  return row.status === 'suspended' || row.status === 'rejected'
}

export function useAccountManage(kind, { onDone } = {}) {
  const spec = SPECS[kind]
  const { pushToast } = useAdmin()
  const navigate = useNavigate()
  const [editRow, setEditRow] = useState(null)
  const [blockRow, setBlockRow] = useState(null)
  const [deleteRow, setDeleteRow] = useState(null)
  const [busy, setBusy] = useState(false)

  const save = async (patch) => {
    if (!editRow?.id) return
    setBusy(true)
    try {
      await spec.update(editRow.id, patch)
      pushToast({ tone: 'success', title: 'Profile updated' })
      setEditRow(null)
      onDone?.()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not save', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const confirmBlock = async (reason) => {
    const row = blockRow
    if (!row?.id) return
    const blocked = isBlocked(kind, row)
    const next = blocked ? spec.liveStatus : spec.blockStatus
    setBusy(true)
    try {
      await spec.status(row.id, next, reason)
      pushToast({
        tone: blocked ? 'success' : 'info',
        title: blocked ? `${row.name} can sign in again` : `${row.name} is blocked`,
      })
      setBlockRow(null)
      onDone?.()
    } catch (err) {
      pushToast({ tone: 'error', title: 'That did not go through', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    const row = deleteRow
    if (!row?.id) return
    setBusy(true)
    try {
      await spec.remove(row.id)
      pushToast({ tone: 'success', title: `${row.name} was removed` })
      setDeleteRow(null)
      onDone?.()
      if (typeof window !== 'undefined' && window.location.pathname.includes(row.id)) {
        navigate(spec.listPath)
      }
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not delete', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  return {
    kind,
    editRow,
    setEditRow,
    blockRow,
    setBlockRow,
    deleteRow,
    setDeleteRow,
    busy,
    save,
    confirmBlock,
    confirmDelete,
  }
}
