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
