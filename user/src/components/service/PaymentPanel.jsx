import { useState } from 'react'
import Icon from '../ui/Icon'
import Button from '../ui/Button'
import { BottomSheet } from '../ui/Modal'
import { DefinitionList, Callout } from '../ui/Display'
import { RatingInput, Input, Field } from '../ui/Form'
import { formatCurrency } from '../../utils/format'

/**
 * Mock payment surfaces.
 *
 * These render the *shape* of the future Stripe flow without touching Stripe:
 * authorisation (a hold, nothing charged), payment (funds taken), capture
 * (a hold converted after service), and refund are kept visually distinct so
 * a guest is never confused about what has happened to their card.
 */

const CARD = { brand: 'Visa', last4: '4242', exp: '04 / 28' }

/** Explains, in one row, exactly where the money is. */
export function PaymentStateRow({ state, amount, method }) {
  const copy = {
    not_required: {
      icon: 'info',
      title: 'No payment due yet',
      body: 'We collect payment once our team confirms your request.',
    },
    authorization_required: {
      icon: 'lock',
      title: 'Card authorisation needed',
      body: 'We place a hold to reserve your vehicle. Nothing is charged until the ride is complete.',
    },
    authorized: {
      icon: 'lock',
      title: 'Card authorised',
      body: `A hold of ${formatCurrency(amount)} is in place on ${method ?? 'your card'}. It is captured after your service.`,
    },
    payment_required: {
      icon: 'creditCard',
      title: 'Payment required',
      body: 'Your shopper is ready to go as soon as this is paid.',
    },
    paid: {
      icon: 'checkCircle',
      title: 'Paid',
      body: `${formatCurrency(amount)} paid with ${method ?? 'your card'}.`,
    },
    captured: {
      icon: 'checkCircle',
      title: 'Payment captured',
      body: `${formatCurrency(amount)} captured from the authorisation on ${method ?? 'your card'}.`,
    },
    refunded: {
      icon: 'refresh',
      title: 'Refunded',
      body: `${formatCurrency(amount)} has been returned to ${method ?? 'your card'}.`,
    },
    failed: {
      icon: 'alert',
      title: 'Payment failed',
      body: 'We could not take the payment. Try another card.',
    },
  }[state] ?? { icon: 'info', title: 'Payment', body: '' }

  return (
    <div className="pay-state">
      <span className="pay-state__icon" aria-hidden="true">
        <Icon name={copy.icon} />
      </span>
      <div>
        <div className="u-small" style={{ fontWeight: 600 }}>
          {copy.title}
        </div>
        <div className="u-xs u-muted">{copy.body}</div>
      </div>
    </div>
  )
}

/**
 * Card sheet used for both authorisation and payment.
 * `mode` = 'authorize' | 'pay'.
 */
export function PaymentSheet({ open, onClose, onConfirm, mode = 'pay', amount, lines = [], busy }) {
  const [saving, setSaving] = useState(false)

  const confirm = async () => {
    setSaving(true)
    await onConfirm?.({ method: `${CARD.brand} •••• ${CARD.last4}` })
    setSaving(false)
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={mode === 'authorize' ? 'Authorise your card' : 'Complete payment'}
    >
      <div className="u-stack" style={{ gap: 'var(--sp-4)' }}>
        <Callout icon="lock" tone={mode === 'authorize' ? 'info' : undefined}>
          {mode === 'authorize'
            ? `We place a temporary hold of ${formatCurrency(amount)}. Your card is only charged after your transfer is complete.`
            : `You are paying ${formatCurrency(amount)} now. Groceries are charged at cost with the receipt attached.`}
        </Callout>

        <div className="pay-card-preview">
          <div className="u-between">
            <span className="u-xs" style={{ opacity: 0.75 }}>
              {CARD.brand}
            </span>
            <Icon name="creditCard" style={{ width: 20, height: 20, opacity: 0.8 }} />
          </div>
          <div className="pay-card-preview__num">•••• •••• •••• {CARD.last4}</div>
          <div className="u-between u-xs" style={{ opacity: 0.75 }}>
            <span>Saved card</span>
            <span>{CARD.exp}</span>
          </div>
        </div>

        {lines.length > 0 && <DefinitionList rows={lines} />}

        <Button block size="lg" onClick={confirm} loading={saving || busy} icon="lock">
          {mode === 'authorize'
            ? `Authorise ${formatCurrency(amount)}`
            : `Pay ${formatCurrency(amount)}`}
        </Button>

        <p className="lock-note">
          <Icon name="shield" />
          Mock payment screen — no card data is collected or transmitted in this prototype.
        </p>
      </div>
    </BottomSheet>
  )
}

const TIP_PRESETS = [0.1, 0.18, 0.2]

/** Post-service tipping. */
export function TipPanel({ base, currentTip, onSubmit }) {
  const [selected, setSelected] = useState(currentTip ?? null)
  const [custom, setCustom] = useState('')
  const [mode, setMode] = useState(currentTip ? 'preset' : null)
  const [saving, setSaving] = useState(false)

  const submit = async (amount) => {
    setSaving(true)
    await onSubmit?.(amount)
    setSaving(false)
  }

  if (currentTip !== null && currentTip !== undefined) {
    return (
      <Callout icon="checkCircle" tone="ok">
        You added a {formatCurrency(currentTip)} tip — it goes entirely to your shopper. Thank you.
      </Callout>
    )
  }

  return (
    <div className="u-stack">
      <p className="u-small u-muted">
        100% of your tip goes to the person who did the work. Entirely optional.
      </p>
      <div className="tip-grid">
        {TIP_PRESETS.map((pct) => {
          const amount = Math.round(base * pct)
          return (
            <button
              key={pct}
              type="button"
              className="tip-option"
              aria-pressed={mode === 'preset' && selected === amount}
              onClick={() => {
                setMode('preset')
                setSelected(amount)
              }}
            >
              <span className="tip-option__pct">{Math.round(pct * 100)}%</span>
              <span className="tip-option__amt">{formatCurrency(amount)}</span>
            </button>
          )
        })}
        <button
          type="button"
          className="tip-option"
          aria-pressed={mode === 'custom'}
          onClick={() => setMode('custom')}
        >
          <span className="tip-option__pct">Custom</span>
          <span className="tip-option__amt">Your amount</span>
        </button>
        <button
          type="button"
          className="tip-option"
          aria-pressed={mode === 'none'}
          onClick={() => {
            setMode('none')
            setSelected(0)
          }}
        >
          <span className="tip-option__pct" style={{ fontSize: '0.95rem' }}>
            No thanks
          </span>
        </button>
      </div>

      {mode === 'custom' && (
        <Field label="Custom tip amount">
          {(props) => (
            <Input
              {...props}
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              placeholder="0"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
          )}
        </Field>
      )}

      <Button
        block
        loading={saving}
        disabled={mode === null || (mode === 'custom' && !custom)}
        onClick={() => submit(mode === 'custom' ? Number(custom) : selected)}
      >
        {mode === 'none' ? 'Continue without a tip' : 'Add tip'}
      </Button>
    </div>
  )
}

const RATING_LABELS = ['Not good', 'Below par', 'Fine', 'Great', 'Perfect']

/** Post-service rating with optional written feedback. */
export function RatingPanel({ title, existing, onSubmit }) {
  const [stars, setStars] = useState(existing?.stars ?? 0)
  const [feedback, setFeedback] = useState(existing?.feedback ?? '')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(!!existing)

  if (done) {
    return (
      <Callout icon="checkCircle" tone="ok">
        Thank you — you rated this {stars} out of 5.{' '}
        {feedback ? <em style={{ display: 'block', marginTop: 4 }}>“{feedback}”</em> : null}
      </Callout>
    )
  }

  const submit = async () => {
    setSaving(true)
    await onSubmit?.({ stars, feedback })
    setSaving(false)
    setDone(true)
  }

  return (
    <div className="rating-panel">
      <h3 style={{ fontSize: '1.05rem' }}>{title}</h3>
      <RatingInput value={stars} onChange={setStars} labels={RATING_LABELS} />
      <Field label="Anything you'd like to add?" className="u-grow" hint="Optional">
        {(props) => (
          <textarea
            {...props}
            className="textarea"
            rows={3}
            value={feedback}
            placeholder="What went well, or what we should do differently…"
            onChange={(e) => setFeedback(e.target.value)}
            style={{ minHeight: 90 }}
          />
        )}
      </Field>
      <Button block disabled={stars === 0} loading={saving} onClick={submit}>
        Submit rating
      </Button>
    </div>
  )
}
