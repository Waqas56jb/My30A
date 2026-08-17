import { useEffect, useMemo, useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Form'
import { MockPaymentNote } from '../common/AdminUI'
import { formatCurrency } from '../../utils/format'

/**
 * Refund a payment.
 *
 * The preview is the point: an operator should see the fee, the amount going
 * back, and what is left, before they commit. Getting a refund wrong is the
 * kind of mistake that ends up in a support thread a week later.
 */
export default function RefundModal({ open, onClose, onConfirm, payment, suggestedFee = 0, loading = false }) {
  const [fee, setFee] = useState(String(suggestedFee))
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setFee(String(suggestedFee))
      setReason('')
      setError('')
    }
  }, [open, suggestedFee])

  const original = payment?.amount ?? 0
  const feeValue = Math.max(0, Math.min(original, Number(fee) || 0))
  const refund = useMemo(() => original - feeValue, [original, feeValue])

  const submit = () => {
    if (reason.trim().length < 5) {
      setError('Say why — this ends up in the audit log and on the guest’s record.')
      return
    }
    onConfirm({ amount: refund, fee: feeValue, reason: reason.trim() })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Refund this payment"
      subtitle={payment ? `${payment.id} · ${payment.guestName}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={loading} icon="refresh">
            Refund {formatCurrency(refund)}
          </Button>
        </>
      }
    >
      <div className="refund-preview">
        <div className="refund-preview__row">
          <span>Original amount</span>
          <strong>{formatCurrency(original)}</strong>
        </div>
        <div className="refund-preview__row">
          <span>Cancellation fee retained</span>
          <strong>-{formatCurrency(feeValue)}</strong>
        </div>
        <div className="refund-preview__row refund-preview__row--total">
          <span>Refund to guest</span>
          <strong>{formatCurrency(refund)}</strong>
        </div>
      </div>

      <Field label="Fee retained" hint="Set to 0 for a full refund.">
        {(props) => (
          <Input
            {...props}
            type="number"
            min="0"
            max={original}
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />
        )}
      </Field>

      <Field label="Reason" error={error} required>
        {(props) => (
          <Textarea
            {...props}
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError('')
            }}
            placeholder="Flight cancelled, guest notified us 30 hours before pickup."
          />
        )}
      </Field>

      <MockPaymentNote />
    </Modal>
  )
}
