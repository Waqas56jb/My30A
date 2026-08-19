import { ConfirmModal } from '../ui/Modal'
import ReviewDecisionModal from '../modals/ReviewDecisionModal'
import EditAccountModal from './EditAccountModal'
import { isBlocked } from '../../hooks/useAccountManage'

export default function AccountModals({ manage }) {
  const blocked = isBlocked(manage.kind, manage.blockRow)
  return (
    <>
      <EditAccountModal
        open={!!manage.editRow}
        kind={manage.kind}
        row={manage.editRow}
        onClose={() => manage.setEditRow(null)}
        onSave={manage.save}
        loading={manage.busy}
      />
      <ReviewDecisionModal
        open={!!manage.blockRow}
        onClose={() => manage.setBlockRow(null)}
        onConfirm={manage.confirmBlock}
        subject={manage.blockRow?.name ?? 'this account'}
        decision={blocked ? 'restore' : 'block'}
        loading={manage.busy}
      />
      <ConfirmModal
        open={!!manage.deleteRow}
        onClose={() => manage.setDeleteRow(null)}
        onConfirm={manage.confirmDelete}
        title={`Delete ${manage.deleteRow?.name ?? 'this account'}?`}
        message="They will disappear from this list and will not be able to sign in. Stay history and listings are kept on file."
        confirmLabel="Delete"
        tone="danger"
        loading={manage.busy}
      />
    </>
  )
}
