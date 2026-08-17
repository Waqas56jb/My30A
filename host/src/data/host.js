import { PHOTO } from '../assets/images'

/** The signed-in host account. Mock only — no real auth provider. */
export const mockHost = {
  id: 'host_michael',
  firstName: 'Michael',
  lastName: 'Reyes',
  email: 'michael@coastalkey30a.com',
  phone: '(850) 555-0142',
  company: 'Coastal Key Property Group',
  avatar: PHOTO.hostMichael,
  preferredContact: 'email',
  emailVerified: true,
  createdAt: '2025-03-14T09:40:00',
  settings: {
    emailNotifications: true,
    guestActivityAlerts: true,
    feedbackAlerts: true,
    vitoriaAlerts: true,
    weeklySummary: true,
    escalationAlerts: true,
  },
}

/** Any password works in the prototype; this is the account it signs you into. */
export const DEMO_CREDENTIALS = {
  email: 'michael@coastalkey30a.com',
  password: 'demo1234',
}

export const ONBOARDING_STEPS = [
  { key: 'account', label: 'Account', blurb: 'Who you are and how guests reach you.' },
  { key: 'property', label: 'Property', blurb: 'The basics: name, address, size.' },
  { key: 'guest', label: 'Guest information', blurb: 'WiFi, check-in, check-out, rules.' },
  { key: 'recommendations', label: 'Local recommendations', blurb: 'Your favourite places nearby.' },
  { key: 'photos', label: 'Photos', blurb: 'How the property looks to a guest.' },
  { key: 'review', label: 'Review', blurb: 'Check everything before it goes live.' },
  { key: 'publish', label: 'Publish', blurb: 'Turn on guest access and share the link.' },
]
