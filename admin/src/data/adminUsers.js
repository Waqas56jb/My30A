import { rng, between, pick, shiftTime } from './seed'

/**
 * Admin users, roles and the permission matrix.
 *
 * The matrix is display-only in this build: nothing is enforced, because there
 * is no server to enforce it. It exists so the shape of the eventual model can
 * be agreed before anyone writes the middleware.
 */

export const PERMISSION_AREAS = [
  { key: 'users', label: 'Users & guests' },
  { key: 'hosts', label: 'Hosts' },
  { key: 'partners', label: 'Partners' },
  { key: 'properties', label: 'Properties' },
  { key: 'orders', label: 'Orders & transfers' },
  { key: 'payments', label: 'Payments & refunds' },
  { key: 'content', label: 'Content & media' },
  { key: 'analytics', label: 'Analytics & reports' },
  { key: 'settings', label: 'Settings & admin users' },
]

export const LEVELS = {
  full: { label: 'Full', tone: 'success' },
  edit: { label: 'Edit', tone: 'info' },
  view: { label: 'View', tone: 'neutral' },
  none: { label: 'None', tone: 'muted' },
}

export const ROLES = {
  super_admin: {
    id: 'super_admin', label: 'Super Admin', tone: 'gold',
    blurb: 'Everything, including admin users and commercial settings.',
    permissions: {
      users: 'full', hosts: 'full', partners: 'full', properties: 'full',
      orders: 'full', payments: 'full', content: 'full', analytics: 'full', settings: 'full',
    },
  },
  operations: {
    id: 'operations', label: 'Operations', tone: 'sea',
    blurb: 'Runs the daily queue: approvals, orders, transfers, guests.',
    permissions: {
      users: 'edit', hosts: 'edit', partners: 'full', properties: 'edit',
      orders: 'full', payments: 'view', content: 'view', analytics: 'view', settings: 'none',
    },
  },
  finance: {
    id: 'finance', label: 'Finance', tone: 'info',
    blurb: 'Payments, refunds, tips and host subscriptions.',
    permissions: {
      users: 'view', hosts: 'view', partners: 'view', properties: 'view',
      orders: 'view', payments: 'full', content: 'none', analytics: 'full', settings: 'view',
    },
  },
  content_manager: {
    id: 'content_manager', label: 'Content Manager', tone: 'success',
    blurb: 'Local Guide, featured places, imagery and guest-facing copy.',
    permissions: {
      users: 'none', hosts: 'none', partners: 'edit', properties: 'view',
      orders: 'none', payments: 'none', content: 'full', analytics: 'view', settings: 'none',
    },
  },
  support: {
    id: 'support', label: 'Support', tone: 'warn',
    blurb: 'Answers escalations from Vitoria and looks after guests.',
    permissions: {
      users: 'edit', hosts: 'view', partners: 'view', properties: 'view',
      orders: 'edit', payments: 'view', content: 'none', analytics: 'view', settings: 'none',
    },
  },
}

export const ROLE_LIST = Object.values(ROLES)

const PEOPLE = [
  ['Alicia Brandt', 'super_admin', 'alicia@my30a.com'],
  ['Marcus Feld', 'operations', 'marcus@my30a.com'],
  ['Renée Duval', 'operations', 'renee@my30a.com'],
  ['Priya Raman', 'finance', 'priya@my30a.com'],
  ['Tom Whitaker', 'content_manager', 'tom@my30a.com'],
  ['Sofia Marchetti', 'support', 'sofia@my30a.com'],
  ['Dev Sandhu', 'support', 'dev@my30a.com'],
  ['Nora Kessler', 'operations', 'nora@my30a.com'],
]

function buildAdminUsers() {
  const random = rng(2244)
  return PEOPLE.map(([name, role, email], i) => ({
    id: `adm_${String(i + 1).padStart(3, '0')}`,
    name,
    email,
    role,
    status: i === 7 ? 'invited' : 'active',
    twoFactor: role === 'super_admin' || role === 'finance' || random() < 0.5,
    lastActiveAt: shiftTime(-between(random, 0, 12), between(random, 7, 21), 0),
    createdAt: shiftTime(-between(random, 40, 700), 10, 0),
    actionsThisMonth: between(random, 12, 640),
  }))
}

export const mockAdminUsers = buildAdminUsers()

/** The signed-in operator for this prototype. */
export const DEMO_ADMIN_ACCOUNTS = [
  { email: 'alicia@my30a.com', password: 'admin1234', role: 'super_admin', name: 'Alicia Brandt' },
  { email: 'marcus@my30a.com', password: 'admin1234', role: 'operations', name: 'Marcus Feld' },
  { email: 'priya@my30a.com', password: 'admin1234', role: 'finance', name: 'Priya Raman' },
  { email: 'tom@my30a.com', password: 'admin1234', role: 'content_manager', name: 'Tom Whitaker' },
  { email: 'sofia@my30a.com', password: 'admin1234', role: 'support', name: 'Sofia Marchetti' },
]
