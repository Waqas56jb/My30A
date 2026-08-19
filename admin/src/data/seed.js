/**
 * Deterministic pseudo-randomness.
 *
 * Every fixture below is generated, not hand-typed, because a hundred guests
 * typed by hand end up looking like ten guests typed ten times. But a demo
 * that reshuffles itself on every reload is impossible to talk about in a
 * meeting, so the generator is seeded: the same numbers appear every run, on
 * every machine, and screenshots stay true.
 */
export function rng(seed) {
  let state = seed >>> 0 || 1
  return () => {
    // xorshift32
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 100000) / 100000
  }
}

export const pick = (random, list) => list[Math.floor(random() * list.length) % list.length]

export const pickWeighted = (random, pairs) => {
  const total = pairs.reduce((sum, [, weight]) => sum + weight, 0)
  let n = random() * total
  for (const [value, weight] of pairs) {
    n -= weight
    if (n <= 0) return value
  }
  return pairs[pairs.length - 1][0]
}

export const between = (random, min, max) => min + Math.floor(random() * (max - min + 1))

export const some = (random, list, count) => {
  const copy = [...list]
  const out = []
  for (let i = 0; i < count && copy.length; i += 1) {
    out.push(copy.splice(Math.floor(random() * copy.length), 1)[0])
  }
  return out
}

/**
 * "Today" is fixed for the same reason the seed is: a fixture that says
 * "arriving tomorrow" must still say that next month.
 */
export const TODAY = '2026-08-17'

function dayKey(from = TODAY) {
  if (!from) return TODAY
  if (from instanceof Date) {
    return Number.isNaN(from.getTime()) ? TODAY : from.toISOString().slice(0, 10)
  }
  const match = String(from).match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : TODAY
}

export function shiftDate(days, from = TODAY) {
  const date = new Date(`${dayKey(from)}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return TODAY
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function shiftTime(days, hour = 9, minute = 0, from = TODAY) {
  const date = new Date(`${dayKey(from)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return null
  date.setUTCDate(date.getUTCDate() + days)
  date.setUTCHours(hour, minute, 0, 0)
  try {
    return date.toISOString()
  } catch {
    return null
  }
}

/* --------------------------- Name pools --------------------------------- */

export const FIRST_NAMES = [
  'Sarah', 'Michael', 'Daniel', 'Priya', 'James', 'Elena', 'Marcus', 'Aisha',
  'Thomas', 'Camille', 'Jordan', 'Nadia', 'Ethan', 'Sofia', 'Liam', 'Grace',
  'Noah', 'Maya', 'Owen', 'Isabel', 'Caleb', 'Renée', 'Victor', 'Harper',
  'Julian', 'Nora', 'Andre', 'Leah', 'Miles', 'Tessa', 'Rafael', 'Amara',
  'Hugo', 'Clara', 'Dominic', 'Yara', 'Peter', 'Anouk', 'Simon', 'Ines',
]

export const LAST_NAMES = [
  'Whitmore', 'Okafor', 'Delgado', 'Nakamura', 'Bennett', 'Rasmussen', 'Alvarez',
  'Kowalski', 'Thompson', 'Moreau', 'Kim', 'Haddad', 'Sinclair', 'Ferreira',
  'Novak', 'Osei', 'Lindqvist', 'Barrett', 'Castellanos', 'Weaver', 'Dubois',
  'Petrov', 'Nguyen', 'Halloran', 'Mensah', 'Rossi', 'Ibrahim', 'Blackwood',
  'Fontaine', 'Silva', 'Ashford', 'Marchetti', 'Bell', 'Okonkwo', 'Vance',
]

export const TOWNS = [
  'Rosemary Beach', 'Alys Beach', 'Seaside', 'Watercolor', 'Watersound',
  'Grayton Beach', 'Seacrest', 'Inlet Beach', 'Blue Mountain Beach',
  'Santa Rosa Beach', 'Dune Allen', 'Seagrove Beach',
]

export const STREETS = [
  'Barrett Square', 'Bridgetown Ave', 'Somerset Bridge Ln', 'Quarter Moon Ln',
  'Village Green', 'Ruskin Place', 'Central Square', 'Butterwood Ln',
  'Sea Dune Dr', 'Camp Creek Point', 'Pompano St', 'Sandcastle Ct',
  'Heron Way', 'Magnolia St', 'Coquina Ct',
]

export const emailFor = (first, last, domain = 'example.com') =>
  `${first.toLowerCase().replace(/[^a-z]/g, '')}.${last.toLowerCase().replace(/[^a-z]/g, '')}@${domain}`

/** Reserved fictional range — never a number that could ring a real person. */
export const phoneFor = (random) =>
  `(${between(random, 205, 985)}) 555-0${String(between(random, 100, 199))}`
