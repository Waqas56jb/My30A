import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { Field, Textarea } from '../ui/Form'
import { cx } from '../../utils/format'

/**
 * Approve / reject / suspend / block, in one dialog.
 *
 * A rejection or a suspension *must* carry a reason: the partner or host sees
 * it, and it is the only way they know what to fix before resubmitting. An
 * approval does not need one, so the field only appears when it matters —
 * asking for justification on the happy path just slows the queue down.
 */
export default function ReviewDecisionModal({
  open,
  onClose,
  onConfirm,
  subject,
  decision, // 'approve' | 'reject' | 'suspend' | 'reinstate'
  loading = false,
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setReason('')
      setError('')
    }
  }, [open, decision])

  const copy = {
    approve: {
      title: `Approve ${subject}?`,
      body: 'The listing becomes visible to guests browsing the Local Guide straight away. Views, website clicks, phone clicks and directions start being counted from this moment.',
      confirm: 'Approve',
      tone: 'primary',
      icon: 'checkCircle',
      needsReason: false,
    },
    reject: {
      title: `Reject ${subject}?`,
      body: 'The application is declined and the listing stays hidden. The reason you give is what they see, and it is what they will work from when they resubmit — be specific.',
      confirm: 'Reject application',
      tone: 'danger',
      icon: 'x',
      needsReason: true,
    },
    suspend: {
      title: `Suspend ${subject}?`,
      body: 'The listing is pulled from the guest app immediately. Nothing is deleted — analytics history is kept and the listing can be restored later.',
      confirm: 'Suspend listing',
      tone: 'danger',
      icon: 'alert',
      needsReason: true,
    },
    reinstate: {
      title: `Return ${subject} to review?`,
      body: 'The listing goes back into the pending queue so it can be checked again before it is visible to guests.',
      confirm: 'Move to review',
      tone: 'primary',
      icon: 'refresh',
      needsReason: false,
    },
    block: {
      title: `Block ${subject}?`,
      body: 'They will not be able to sign in until you unblock them. Their records stay on file.',
      confirm: 'Block account',
      tone: 'danger',
      icon: 'lock',
      needsReason: true,
    },
    restore: {
      title: `Unblock ${subject}?`,
      body: 'They will be able to sign in again. Nothing else about the account is changed.',
      confirm: 'Unblock',
      tone: 'primary',
      icon: 'checkCircle',
      needsReason: false,
    },
  }[decision] ?? {}

  const submit = () => {
    if (copy.needsReason && reason.trim().length < 10) {
      setError('Give at least a sentence — this is what they see and act on.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={copy.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={copy.tone === 'danger' ? 'danger' : 'primary'}
            onClick={submit}
            loading={loading}
            icon={copy.icon}
          >
            {copy.confirm}
          </Button>
        </>
      }
    >
      <div className={cx('decision', `decision--${copy.tone}`)}>
        <span className="decision__icon" aria-hidden="true">
          <Icon name={copy.icon} />
        </span>
        <p className="decision__body">{copy.body}</p>
      </div>

      {copy.needsReason && (
        <Field
          label="Reason"
          error={error}
          hint="Shared with the applicant. Say what is wrong and what would fix it."
          required
        >
          {(props) => (
            <Textarea
              {...props}
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
              placeholder="Photos show stock imagery rather than the actual service. Replace them with your own and resubmit."
            />
          )}
        </Field>
      )}
    </Modal>
  )
}
