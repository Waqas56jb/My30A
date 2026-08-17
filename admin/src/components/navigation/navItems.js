/**
 * The navigation tree, in one place.
 *
 * `permission` names the area from the role matrix — a Finance operator does
 * not need the Content section in their way. Hiding is a convenience, not a
 * security boundary; nothing is enforced without a server.
 *
 * `badge` names a key from the attention feed so a queue with work in it shows
 * a count without every screen having to know about the sidebar.
 */
export const NAV_TREE = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'grid', end: true },
  { to: '/admin/operations', label: 'Operations', icon: 'compass', badge: 'operations' },

  {
    label: 'Users',
    icon: 'users',
    permission: 'users',
    children: [
      { to: '/admin/guests', label: 'Guests', icon: 'user' },
      { to: '/admin/hosts', label: 'Hosts', icon: 'building', badge: 'hosts', permission: 'hosts' },
      { to: '/admin/partners', label: 'Partners', icon: 'sparkles', badge: 'partners', permission: 'partners' },
      { to: '/admin/admin-users', label: 'Admin Users', icon: 'shield', permission: 'settings' },
    ],
  },

  { to: '/admin/properties', label: 'Properties', icon: 'key', permission: 'properties' },

  {
    label: 'Local Guide',
    icon: 'compass',
    permission: 'content',
    children: [
      { to: '/admin/local-guide/categories', label: 'Categories', icon: 'list' },
      { to: '/admin/local-guide/listings', label: 'Listings', icon: 'grid' },
      { to: '/admin/local-guide/featured', label: 'Featured Places', icon: 'star' },
    ],
  },

  {
    label: 'Services',
    icon: 'bag',
    permission: 'orders',
    children: [
      { to: '/admin/grocery', label: 'Grocery Orders', icon: 'bag', badge: 'orders' },
      { to: '/admin/transfers', label: 'Airport Transfers', icon: 'car', badge: 'transfers' },
      { to: '/admin/service-requests', label: 'Service Requests', icon: 'clock' },
    ],
  },

  {
    label: 'Vitoria AI',
    icon: 'sparkles',
    children: [
      { to: '/admin/vitoria', label: 'Overview', icon: 'grid', end: true },
      { to: '/admin/vitoria/conversations', label: 'Conversations', icon: 'message', badge: 'escalations' },
      { to: '/admin/vitoria/activity', label: 'AI Activity', icon: 'refresh' },
      { to: '/admin/vitoria/knowledge', label: 'Knowledge', icon: 'info' },
      { to: '/admin/vitoria/automation', label: 'Automation', icon: 'send' },
    ],
  },

  {
    label: 'Payments',
    icon: 'creditCard',
    permission: 'payments',
    children: [
      { to: '/admin/payments', label: 'Transactions', icon: 'creditCard', end: true, badge: 'payments' },
      { to: '/admin/payments/refunds', label: 'Refunds', icon: 'refresh', badge: 'refunds' },
      { to: '/admin/payments/tips', label: 'Tips', icon: 'heart' },
      { to: '/admin/subscriptions', label: 'Host Subscriptions', icon: 'building' },
    ],
  },

  {
    label: 'Analytics',
    icon: 'chart',
    permission: 'analytics',
    children: [
      { to: '/admin/analytics', label: 'Overview', icon: 'grid', end: true },
      { to: '/admin/analytics/guests', label: 'Guest Analytics', icon: 'users' },
      { to: '/admin/analytics/partners', label: 'Partner Analytics', icon: 'sparkles' },
      { to: '/admin/analytics/services', label: 'Service Analytics', icon: 'bag' },
      { to: '/admin/analytics/revenue', label: 'Revenue Analytics', icon: 'dollar' },
    ],
  },

  { to: '/admin/reviews', label: 'Reviews', icon: 'star', badge: 'reviews' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/admin/content', label: 'Content', icon: 'image', permission: 'content' },
  { to: '/admin/media', label: 'Media', icon: 'camera', permission: 'content' },
  { to: '/admin/reports', label: 'Reports', icon: 'upload', permission: 'analytics' },
  { to: '/admin/audit', label: 'Audit Logs', icon: 'shield' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings', permission: 'settings' },
]

/** Flattened list of leaf routes — used by search and the breadcrumb trail. */
export const NAV_LEAVES = NAV_TREE.flatMap((item) =>
  item.children ? item.children.map((c) => ({ ...c, group: item.label })) : [item],
)

export const labelForPath = (pathname) => {
  const exact = NAV_LEAVES.find((item) => item.to === pathname)
  if (exact) return exact.label
  const prefix = NAV_LEAVES.filter((item) => pathname.startsWith(item.to)).sort(
    (a, b) => b.to.length - a.to.length,
  )[0]
  return prefix?.label ?? 'Admin'
}

/** Roles only ever hide branches; they never unlock one that is not in the tree. */
export function visibleTree(can) {
  return NAV_TREE.map((item) => {
    if (item.permission && !can(item.permission)) return null
    if (!item.children) return item
    const children = item.children.filter((c) => !c.permission || can(c.permission))
    return children.length ? { ...item, children } : null
  }).filter(Boolean)
}
