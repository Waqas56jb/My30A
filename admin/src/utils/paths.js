/** Public-looking admin paths. Prefer a slug over a raw UUID in the address bar. */

export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function resourceKey(row, extraKeys = []) {
  if (!row) return ''
  for (const key of ['slug', ...extraKeys, 'id']) {
    const value = row[key]
    if (value) return String(value)
  }
  return ''
}

export function propertyPath(row) {
  const key = row?.slug || row?.propertySlug || row?.property_slug || row?.propertyId || row?.property_id || row?.id
  return `/admin/properties/${key || ''}`
}

export function partnerPath(row) {
  return `/admin/partners/${resourceKey(row)}`
}

export function guestPath(row) {
  return `/admin/guests/${resourceKey(row)}`
}

export function hostPath(row) {
  return `/admin/hosts/${resourceKey(row)}`
}
