import { mockGuests } from './guests'
import { mockPartners } from './partners'
import { rng, between, pick, pickWeighted, shiftTime } from './seed'

export const REVIEW_STATUSES = {
  published: { label: 'Published', tone: 'success' },
  hidden: { label: 'Hidden', tone: 'muted' },
  flagged: { label: 'Flagged', tone: 'danger' },
}

export const REVIEW_SUBJECTS = {
  stay: { label: 'Stay', icon: 'building' },
  grocery: { label: 'Grocery delivery', icon: 'bag' },
  transfer: { label: 'Airport transfer', icon: 'car' },
  partner: { label: 'Partner', icon: 'sparkles' },
  vitoria: { label: 'Vitoria', icon: 'sparkles' },
}

const POSITIVE = [
  'Asked for a table for six on a Friday in August and had one in four minutes.',
  'The fridge was full when we walked in. The holiday started at the airport instead of the supermarket.',
  'Driver was waiting at baggage claim with a sign and both car seats already fitted.',
  'The bonfire recommendation made the trip. The kids still talk about it.',
  'Vitoria answered at 11pm about the pool heater and actually knew the answer.',
  'House was spotless and the check-in instructions were exactly right.',
  'Shopper texted a photo of the substitutions before buying them. Small thing, big difference.',
  'Best beach guide we have used — the parking notes alone saved us an hour.',
]

const MIXED = [
  'Good overall, though the delivery window slipped by about an hour.',
  'Great house, but the WiFi in the bunk room barely reached.',
  'Transfer was fine. The driver was quiet, which honestly suited us.',
  'Groceries were right but a few things were substituted without asking.',
]

const NEGATIVE = [
  'Waited forty minutes past the pickup window and could not reach anyone.',
  'The AC failed on the second night and it took until the next afternoon.',
  'Half the list was missing and the total was higher than the estimate.',
  'Listing said the cart seated six. It seated four.',
]

const FLAGGED = [
  'Absolutely appalling — see my full post on social media, tagging the owner @[redacted]',
  'Contact me directly at the number below for the real story about this company',
]

function buildReviews() {
  const random = rng(3947)
  const partners = mockPartners.filter((p) => p.status === 'approved')

  return Array.from({ length: 124 }, (_, i) => {
    const guest = mockGuests[(i * 7 + 3) % mockGuests.length]
    const subject = pickWeighted(random, [
      ['stay', 34], ['grocery', 22], ['transfer', 18], ['partner', 18], ['vitoria', 8],
    ])
    const rating = pickWeighted(random, [[5, 58], [4, 24], [3, 9], [2, 5], [1, 4]])
    const flagged = i % 41 === 0

    const comment = flagged
      ? pick(random, FLAGGED)
      : rating >= 4
        ? pick(random, POSITIVE)
        : rating === 3
          ? pick(random, MIXED)
          : pick(random, NEGATIVE)

    const partner = subject === 'partner' ? partners[(i * 3) % partners.length] : null

    return {
      id: `rev_${String(i + 1).padStart(3, '0')}`,
      guestId: guest.id,
      guestName: guest.name,
      propertyId: guest.propertyId,
      propertyName: guest.propertyName,
      hostName: guest.hostName,
      partnerId: partner?.id ?? null,
      partnerName: partner?.name ?? null,
      subject,
      rating,
      comment,
      status: flagged ? 'flagged' : rating <= 2 && random() < 0.2 ? 'hidden' : 'published',
      flagReason: flagged ? 'Contains contact details and an off-platform call to action' : null,
      createdAt: shiftTime(-between(random, 0, 180), between(random, 8, 22), 0),
    }
  })
}

export const mockReviews = buildReviews()

export function reviewSummary(reviews) {
  const list = Array.isArray(reviews) ? reviews : reviews?.rows ?? []
  const visible = list.filter((r) => r.status === 'published')
  const total = visible.length
  const average = total ? visible.reduce((sum, r) => sum + r.rating, 0) / total : 0
  /* Ascending, so index 0 is the 1-star count. `StarBreakdown` reads
     `breakdown[star - 1]`, and an object here renders as nothing at all. */
  const breakdown = [1, 2, 3, 4, 5].map(
    (stars) => visible.filter((r) => r.rating === stars).length,
  )
  return {
    total,
    average,
    breakdown,
    flagged: list.filter((r) => r.status === 'flagged').length,
    hidden: list.filter((r) => r.status === 'hidden').length,
  }
}
