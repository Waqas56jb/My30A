import { rng, between, pick, shiftTime } from './seed'

export const NOTIFICATION_AUDIENCES = {
  guest: { label: 'Guests', tone: 'sea', icon: 'users' },
  host: { label: 'Hosts', tone: 'info', icon: 'building' },
  partner: { label: 'Partners', tone: 'success', icon: 'sparkles' },
  admin: { label: 'Admin team', tone: 'gold', icon: 'shield' },
}

export const NOTIFICATION_CHANNELS = {
  push: { label: 'Push', icon: 'bell' },
  email: { label: 'Email', icon: 'mail' },
  both: { label: 'Push + email', icon: 'send' },
}

export const NOTIFICATION_STATUSES = {
  sent: { label: 'Sent', tone: 'ok' },
  partial: { label: 'Partial', tone: 'warn' },
  failed: { label: 'Failed', tone: 'danger' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  draft: { label: 'Draft', tone: 'sand' },
}

const SEED = [
  ['Your transfer has been confirmed', 'A driver is reserved for your flight. You will be asked to authorise your card — a hold, not a charge.', 'guest', 'both', 'sent'],
  ['Your groceries are on the way', 'Your shopper has finished and is heading to the house now.', 'guest', 'push', 'sent'],
  ['Welcome to 30A', 'Everything about your stay is in one place — WiFi, door code, and a concierge who knows the house.', 'guest', 'both', 'sent'],
  ['One day until check-in', 'Your door code and arrival instructions are ready in the app.', 'guest', 'push', 'sent'],
  ['How was your stay?', 'A quick rating helps your host and the local businesses you used.', 'guest', 'email', 'sent'],
  ['Your listing is live', 'Guests browsing 30A can now find you in the Local Guide.', 'partner', 'email', 'sent'],
  ['Your weekly interest report', 'Views, website clicks, phone clicks and directions for the past seven days.', 'partner', 'email', 'sent'],
  ['Action needed: update your photos', 'Listings with three or more photographs get roughly twice the interest.', 'partner', 'email', 'scheduled'],
  ['New guest arriving Thursday', 'Sarah W. checks in at Rosemary Beach House on 20 August.', 'host', 'push', 'sent'],
  ['Your subscription payment failed', 'We could not charge the card on file. Update it to keep your properties live.', 'host', 'both', 'sent'],
  ['Setup incomplete', 'Two sections of your property still need filling in before Vitoria can answer guests properly.', 'host', 'email', 'sent'],
  ['August operations summary', 'Requests, completions, revenue and partner interactions for the month.', 'admin', 'email', 'scheduled'],
  ['Storm advisory for the corridor', 'Tropical storm watch issued for Walton County. Review upcoming transfers.', 'guest', 'both', 'draft'],
  ['New local partners this week', 'Three new businesses have joined the Local Guide.', 'guest', 'push', 'draft'],
  ['Reminder: quiet hours from 10 PM', 'Sound carries between houses on 30A more than most guests expect.', 'guest', 'push', 'failed'],
]

function buildNotifications() {
  const random = rng(6612)
  return SEED.map(([title, message, audience, channel, status], i) => {
    const recipients = between(random, 24, 2840)
    return {
      id: `ntf_${String(i + 1).padStart(3, '0')}`,
      title,
      message,
      audience,
      channel,
      status,
      recipients: status === 'draft' ? 0 : recipients,
      opened: status === 'sent' ? Math.round(recipients * (0.4 + random() * 0.45)) : 0,
      read: status === 'sent' && random() < 0.6,
      sentAt: status === 'sent' ? shiftTime(-between(random, 0, 45), between(random, 7, 20), 0) : null,
      scheduledFor: status === 'scheduled' ? shiftTime(between(random, 1, 12), 9, 0) : null,
      createdBy: pick(random, ['Operations', 'Content Manager', 'Super Admin']),
      createdAt: shiftTime(-between(random, 1, 60), between(random, 7, 20), 0),
      failureReason: status === 'failed' ? 'Push provider rejected the payload — message body exceeded the length limit.' : null,
    }
  })
}

export const mockNotifications = buildNotifications()
