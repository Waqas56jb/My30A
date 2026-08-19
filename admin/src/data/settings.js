import { DEFAULT_PLANS } from './hosts'
import { DEFAULT_SERVICE_FEES } from './orders'
import { DEFAULT_CANCELLATION_RULES } from './transfers'

/**
 * Platform settings.
 *
 * Commercial rules — plans, fees, cancellation tiers — live here rather than
 * being hardcoded in the screens that display them, because the final numbers
 * are not agreed yet and will change more than once before launch.
 */
export const DEFAULT_SETTINGS = {
  general: {
    platformName: 'My30A',
    supportEmail: 'help@my30a.com',
    supportPhone: '(850) 555-0100',
    timezone: 'America/Chicago',
    currency: 'USD',
    serviceArea: 'Scenic Highway 30A, Walton County, Florida',
  },
  business: {
    plans: DEFAULT_PLANS,
    trialDays: 14,
    requireHostApproval: true,
    requirePartnerApproval: true,
    autoPublishApprovedPartners: true,
  },
  payments: {
    serviceFees: DEFAULT_SERVICE_FEES,
    cancellationRules: DEFAULT_CANCELLATION_RULES,
    tipPresets: [10, 18, 20],
    captureTransfersOnCompletion: true,
    processorLabel: 'Not connected — all payment records in this build are mock',
  },
  notifications: {
    pushEnabled: true,
    emailEnabled: true,
    dailyOpsDigest: true,
    digestTime: '07:00',
    alertOnFailedPayment: true,
    alertOnEscalation: true,
  },
  ai: {
    assistantName: 'Vitoria',
    tone: 'Warm, local, concise',
    escalateAfterUnresolved: 2,
    canCreateRequests: true,
    canQuotePartnerPrices: false,
    languages: ['English', 'Spanish', 'French', 'German'],
    modelLabel: 'Not connected — replies in this build come from scripted fixtures',
  },
  localGuide: {
    defaultSort: 'Featured first',
    showPricesWhenKnown: true,
    fallbackPriceLabel: 'Contact for pricing',
    maxFeaturedPerCategory: 3,
  },
  partners: {
    trackedEvents: ['partner_view', 'website_click', 'phone_click', 'directions_click'],
    weeklyReportEnabled: true,
    allowSelfServiceEdits: true,
    requireApprovalOnEdit: false,
  },
  hosts: {
    requireSetupBeforePublish: true,
    minimumSetupSections: 5,
    allowGuestLinkSharing: true,
    subscriptionRequired: false,
  },
  security: {
    requireTwoFactor: false,
    sessionHours: 12,
    auditRetentionDays: 365,
    ipAllowlist: '',
  },
}

function asObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    } catch {
      /* ignore malformed jsonb strings */
    }
  }
  return null
}

function asList(value, fallback) {
  const fallbackList = Array.isArray(fallback) ? fallback : []
  if (Array.isArray(value)) return value.filter((item) => item != null)
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.filter((item) => item != null)
    } catch {
      /* ignore */
    }
  }
  return fallbackList
}

function asScalar(value, fallback) {
  if (Array.isArray(fallback)) return asList(value, fallback)
  if (value == null || value === '') return fallback
  if (typeof fallback === 'boolean') return value === true || value === 'true' || value === 1 || value === '1'
  if (typeof fallback === 'number') {
    const n = Number(value)
    return Number.isFinite(n) ? n : fallback
  }
  if (typeof fallback === 'string') {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
    return fallback
  }
  return value ?? fallback
}

/** Fill every settings section from defaults so a sparse live API cannot crash a tab. */
export function mergeSettings(raw) {
  const source = asObject(raw) ?? {}
  const next = {}
  for (const [key, defaults] of Object.entries(DEFAULT_SETTINGS)) {
    const incoming = asObject(source[key]) ?? {}
    const merged = {}
    for (const [field, fallback] of Object.entries(defaults)) {
      merged[field] = asScalar(incoming[field], fallback)
    }
    next[key] = { ...incoming, ...merged }
  }
  return next
}

export const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: 'settings', blurb: 'Platform name, support contacts, timezone.' },
  { id: 'business', label: 'Business', icon: 'building', blurb: 'Host plans, trials and approval requirements.' },
  { id: 'payments', label: 'Payments', icon: 'creditCard', blurb: 'Service fees, cancellation rules and tips.' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', blurb: 'Push, email and the daily operations digest.' },
  { id: 'ai', label: 'AI', icon: 'sparkles', blurb: 'Vitoria’s tone, limits and escalation rules.' },
  { id: 'localGuide', label: 'Local Guide', icon: 'compass', blurb: 'How listings sort and how prices display.' },
  { id: 'partners', label: 'Partner settings', icon: 'users', blurb: 'What is tracked and what partners can edit.' },
  { id: 'hosts', label: 'Host settings', icon: 'key', blurb: 'Setup requirements before a property goes live.' },
  { id: 'security', label: 'Security', icon: 'shield', blurb: 'Two-factor, sessions and audit retention.' },
]
