import { mockAdminUsers } from './adminUsers'
import { rng, between, pick, shiftTime } from './seed'

/**
 * Audit log.
 *
 * Every state change an operator makes in this panel appends a row here, live,
 * through `auditService`. The rows below are the history that existed before
 * this session — without them the log looks broken on first load.
 *
 * The IP column is a placeholder. There is no request, so there is no address;
 * showing a plausible-looking one would be inventing evidence.
 */

export const AUDIT_STATUSES = {
  success: { label: 'Success', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
}

const ACTIONS = [
  ['Approved partner', 'Partner', 'ptr_g04'],
  ['Rejected partner', 'Partner', 'ptr_g11'],
  ['Suspended partner', 'Partner', 'ptr_g19'],
  ['Featured partner', 'Partner', 'ptr_golfcarts'],
  ['Approved host', 'Host', 'host_014'],
  ['Suspended host', 'Host', 'host_022'],
  ['Updated property', 'Property', 'prop_017'],
  ['Updated property', 'Property', 'prop_031'],
  ['Confirmed grocery order', 'Grocery order', 'GR-1042'],
  ['Marked order delivered', 'Grocery order', 'GR-1019'],
  ['Cancelled grocery order', 'Grocery order', 'GR-1055'],
  ['Confirmed transfer', 'Transfer', 'TR-2018'],
  ['Assigned driver', 'Transfer', 'TR-2031'],
  ['Marked transfer completed', 'Transfer', 'TR-2007'],
  ['Issued refund', 'Payment', 'pay_tr_2044'],
  ['Retried failed payment', 'Payment', 'pay_sub_004'],
  ['Edited guest information', 'Guest', 'guest_061'],
  ['Hid review', 'Review', 'rev_042'],
  ['Restored review', 'Review', 'rev_018'],
  ['Published content block', 'Content', 'cnt_006'],
  ['Uploaded media', 'Media', 'med_031'],
  ['Created notification', 'Notification', 'ntf_012'],
  ['Enabled automation', 'Automation', 'auto_weekly'],
  ['Updated knowledge entry', 'Knowledge', 'kb_006'],
  ['Changed service fee tiers', 'Settings', 'settings.fees'],
  ['Invited admin user', 'Admin user', 'adm_008'],
  ['Disabled category', 'Category', 'cat_shopping'],
  ['Reordered categories', 'Category', 'cat_bikes'],
]

function buildAudit() {
  const random = rng(9911)
  return Array.from({ length: 96 }, (_, i) => {
    const [action, entity, entityId] = ACTIONS[i % ACTIONS.length]
    const user = mockAdminUsers[(i * 3) % mockAdminUsers.length]
    return {
      id: `aud_${String(i + 1).padStart(4, '0')}`,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entity,
      entityId,
      status: i % 29 === 0 ? 'failed' : 'success',
      detail: i % 29 === 0 ? 'Rejected by the mock service — retried successfully afterwards.' : '',
      ip: '—', // no request, no address; a fake one would be inventing evidence
      at: shiftTime(-between(random, 0, 40), between(random, 6, 22), between(random, 0, 59)),
    }
  }).sort((a, b) => (a.at < b.at ? 1 : -1))
}

export const mockAudit = buildAudit()
