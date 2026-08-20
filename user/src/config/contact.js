/**
 * Official My30A Host contact.
 *
 * The phone number is for grocery and airport-transfer clients only — never
 * put it on public landing, help, footer, flyers, or business cards.
 */
export const HOST_CONTACT = {
  name: 'My30A Host',
  email: 'my30ahost@gmail.com',
  phoneDisplay: '+1 (850) 955-4577',
  phoneTel: 'tel:+18509554577',
  phoneSms: 'sms:+18509554577',
  instagram: 'Coming soon',
  facebook: 'Coming soon',
  hours: '7:00 AM – 9:00 PM CT, daily',
  responseTime: 'Usually within an hour',
}

export function serviceBookingRevealsPhone(status) {
  return Boolean(status) && status !== 'cancelled'
}

function asList(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.rows)) return value.rows
  return []
}

export function anyBookingRevealsPhone(orders, transfers) {
  return [...asList(orders), ...asList(transfers)].some((row) => serviceBookingRevealsPhone(row?.status))
}
