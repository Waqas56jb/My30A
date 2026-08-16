/**
 * Status vocabularies shared by the UI. Keeping them here means the future
 * backend only has to match these keys — no component knows the strings.
 */

export const GROCERY_STATUSES = [
  {
    key: 'pending',
    label: 'Pending review',
    short: 'Pending',
    tone: 'warn',
    description: 'Your request is with our concierge team. We usually confirm within an hour.',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    short: 'Confirmed',
    tone: 'info',
    description: 'We have your list and a shopper is assigned. Payment is collected before shopping.',
  },
  {
    key: 'shopping',
    label: 'Shopping',
    short: 'Shopping',
    tone: 'info',
    description: 'Your shopper is in the store. They will text about any substitutions.',
  },
  {
    key: 'on_the_way',
    label: 'On the way',
    short: 'On the way',
    tone: 'info',
    description: 'Groceries are packed and heading to the property.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    short: 'Delivered',
    tone: 'ok',
    description: 'Everything has been put away. Cold items go in first.',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    short: 'Cancelled',
    tone: 'danger',
    description: 'This request was cancelled.',
  },
]

export const TRANSFER_STATUSES = [
  {
    key: 'pending',
    label: 'Pending review',
    short: 'Pending',
    tone: 'warn',
    description: 'We are confirming a driver for your flight.',
  },
  {
    key: 'confirmed',
    label: 'Confirmed',
    short: 'Confirmed',
    tone: 'info',
    description: 'A driver is reserved. We will authorise your card next.',
  },
  {
    key: 'payment_required',
    label: 'Card authorisation required',
    short: 'Action needed',
    tone: 'warn',
    description: 'Authorise your card to lock the vehicle. Nothing is charged until the ride is complete.',
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    short: 'Scheduled',
    tone: 'info',
    description: 'Your driver and vehicle are assigned. Details arrive 24 hours before pickup.',
  },
  {
    key: 'completed',
    label: 'Completed',
    short: 'Completed',
    tone: 'ok',
    description: 'Ride complete. Your authorisation has been captured.',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    short: 'Cancelled',
    tone: 'danger',
    description: 'This transfer was cancelled.',
  },
]

/** Stripe-shaped payment vocabulary — mock only, no SDK involved yet. */
export const PAYMENT_STATES = {
  not_required: { label: 'No payment due', tone: 'neutral' },
  authorization_required: { label: 'Authorisation required', tone: 'warn' },
  authorized: { label: 'Card authorised', tone: 'info' },
  payment_required: { label: 'Payment required', tone: 'warn' },
  paid: { label: 'Paid', tone: 'ok' },
  captured: { label: 'Payment captured', tone: 'ok' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  failed: { label: 'Payment failed', tone: 'danger' },
}

export const getStatusMeta = (list, key) =>
  list.find((s) => s.key === key) ?? { key, label: key, short: key, tone: 'neutral', description: '' }

/** Index of a status inside the happy path (cancelled returns -1). */
export const statusIndex = (list, key) => list.findIndex((s) => s.key === key)

export const GROCERY_FLOW = GROCERY_STATUSES.filter((s) => s.key !== 'cancelled')
export const TRANSFER_FLOW = TRANSFER_STATUSES.filter((s) => s.key !== 'cancelled')
