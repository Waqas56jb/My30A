import { IconButton } from '../ui/Button'
import { isBlocked } from '../../hooks/useAccountManage'

export default function AccountActions({ kind, row, manage }) {
  const blocked = isBlocked(kind, row)
  return (
    <span className="rowact" onClick={(e) => e.stopPropagation()}>
      <IconButton icon="edit" label="Edit" onClick={() => manage.setEditRow(row)} />
      <IconButton
        icon={blocked ? 'checkCircle' : 'lock'}
        label={blocked ? 'Unblock' : 'Block'}
        onClick={() => manage.setBlockRow(row)}
      />
      <IconButton icon="trash" label="Delete" onClick={() => manage.setDeleteRow(row)} />
    </span>
  )
}
