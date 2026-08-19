import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import SmartImage from '../../components/ui/SmartImage'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import {
  PageHeader, Panel, Grid, Stat, Facts, StatusPill, Money, ReferralNote, InlineEmpty,
} from '../../components/common/AdminUI'
import { RankBars } from '../../components/charts/Charts'
import ReviewDecisionModal from '../../components/modals/ReviewDecisionModal'
import AccountModals from '../../components/accounts/AccountModals'
import { useLoad } from '../../hooks/useTable'
import { useAccountManage } from '../../hooks/useAccountManage'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { PARTNER_STATUSES, TRACKED_EVENTS, NOT_TRACKED, partnerCtr } from '../../data/partners'
import { formatDate, formatNumber, formatShortDate } from '../../utils/format'
import { useCanonicalSlug } from '../../hooks/useCanonicalSlug'

/**
 * One partner: the application, the listing, and the referral numbers.
 *
 * The approval flow lives here rather than only in a table row, because a
 * decision should be made after looking at the photographs and the contact
 * details — not from a list.
 */
export default function PartnerDetail() {
  const { id } = useParams()
  const { pushToast } = useAdmin()
  const { data, loading, error, reload } = useLoad(() => api.getPartner(id), [id])
  const manage = useAccountManage('partner', { onDone: reload })
  const [decision, setDecision] = useState(null)
  const [busy, setBusy] = useState(false)

  useCanonicalSlug(id, data?.partner?.slug, '/admin/partners')
  useDocumentTitle(data?.partner?.name || 'Partner')

  if (loading) return <SkeletonPage />
  if (error || !data?.partner) return <ErrorState error={error} onRetry={reload} title="We could not open that" />

  const partner = data.partner
  const category = data.category
  const reviews = Array.isArray(data.reviews) ? data.reviews : []
  const images = Array.isArray(partner.images) ? partner.images : []
  const stats = partner.stats ?? {}
  const ctr = partnerCtr(partner)

  const decide = async (reason) => {
    const nextStatus = { approve: 'approved', reject: 'rejected', suspend: 'suspended', reinstate: 'pending' }[decision]
    setBusy(true)
    try {
      await api.setPartnerStatus(id, nextStatus, reason)
      pushToast({
        tone: nextStatus === 'approved' ? 'success' : 'info',
        title: `${partner.name} — ${(PARTNER_STATUSES[nextStatus]?.label ?? nextStatus).toLowerCase()}`,
        message:
          nextStatus === 'approved'
            ? 'The listing is now visible to guests browsing the Local Guide.'
            : 'The listing is hidden from guests.',
      })
      setDecision(null)
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'That did not go through', message: err.message })
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (patch, message) => {
    try {
      await api.updatePartner(id, patch)
      pushToast({ tone: 'success', title: message })
      reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'That did not go through', message: err.message })
    }
  }

  return (
    <div className="apage">
      <PageHeader
        title={partner.name}
        subtitle={`${category?.name ?? 'Uncategorised'} · ${partner.owner} · ${partner.town}`}
        back={{ to: '/admin/partners', label: 'All partners' }}
        actions={
          <>
            <StatusPill map={PARTNER_STATUSES} value={partner.status} />
            <Button size="sm" variant="secondary" icon="edit" onClick={() => manage.setEditRow(partner)}>
              Edit
            </Button>
            {partner.status === 'pending' && (
              <>
                <Button size="sm" icon="checkCircle" onClick={() => setDecision('approve')}>Approve</Button>
                <Button size="sm" variant="danger" icon="x" onClick={() => setDecision('reject')}>Reject</Button>
                <Button size="sm" variant="danger" icon="lock" onClick={() => manage.setBlockRow(partner)}>
                  Block
                </Button>
              </>
            )}
            {partner.status === 'approved' && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  icon="star"
                  onClick={() =>
                    toggle(
                      { featured: !partner.featured },
                      partner.featured ? 'Removed from featured' : 'Featured in the Local Guide',
                    )
                  }
                >
                  {partner.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={partner.published ? 'eyeOff' : 'eye'}
                  onClick={() =>
                    toggle(
                      { published: !partner.published },
                      partner.published ? 'Listing unpublished' : 'Listing published',
                    )
                  }
                >
                  {partner.published ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="danger" icon="lock" onClick={() => manage.setBlockRow(partner)}>
                  Block
                </Button>
              </>
            )}
            {['rejected', 'suspended'].includes(partner.status) && (
              <>
                <Button size="sm" icon="checkCircle" onClick={() => manage.setBlockRow(partner)}>
                  Unblock
                </Button>
                <Button size="sm" variant="secondary" icon="refresh" onClick={() => setDecision('reinstate')}>
                  Return to review
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" icon="trash" onClick={() => manage.setDeleteRow(partner)}>
              Delete
            </Button>
          </>
        }
      />

      {partner.reason && partner.status !== 'approved' && (
        <Callout icon="alert" tone="warn">
          <strong style={{ display: 'block', marginBottom: 2 }}>
            {PARTNER_STATUSES[partner.status]?.label ?? partner.status}
          </strong>
          {partner.reason}
        </Callout>
      )}

      {partner.status === 'pending' && (
        <Callout icon="clock">
          <strong style={{ display: 'block', marginBottom: 2 }}>Waiting for review</strong>
          Applied {formatDate(partner.submittedAt)}. Check the photographs actually show the service,
          that the phone number and website work, and that the category is right. Approving makes the
          listing visible to every guest browsing 30A.
        </Callout>
      )}

      {/* ------------------------------ Analytics ------------------------- */}
      <Panel
        title="Referral activity"
        subtitle="Interactions that happened on My30A screens."
      >
        <div className="astats">
          {TRACKED_EVENTS.map((event) => (
            <Stat
              key={event.key}
              label={event.label}
              value={stats[event.key] ?? 0}
              icon={event.icon}
              tone={event.key === 'views' ? 'sea' : 'gold'}
            />
          ))}
        </div>

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <Grid cols={2}>
            <div>
              <p className="stat__label">Click-through rate</p>
              <p className="stat__value">{(ctr * 100).toFixed(1)}%</p>
              <p className="u-xs u-muted">
                Of the guests who saw this listing, this share tapped through to a website, a phone
                number, or directions.
              </p>
            </div>
            <div>
              <RankBars
                data={TRACKED_EVENTS.filter((e) => e.key !== 'views').map((e) => ({
                  label: e.label,
                  value: stats[e.key] ?? 0,
                }))}
                valueLabel="clicks"
              />
            </div>
          </Grid>
        </div>

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <ReferralNote />
        </div>

        <div style={{ marginTop: 'var(--sp-3)' }}>
          <p className="stat__label" style={{ marginBottom: 6 }}>Not tracked</p>
          <ul className="u-stack" style={{ gap: 4, margin: 0, paddingLeft: 18 }}>
            {NOT_TRACKED.map((item) => (
              <li key={item} className="u-small u-muted">{item}</li>
            ))}
          </ul>
        </div>
      </Panel>

      {/* -------------------------- Business details ---------------------- */}
      <Grid cols={2}>
        <Panel title="Business">
          <Facts
            items={[
              { label: 'Business name', value: partner.name },
              { label: 'Owner', value: partner.owner },
              { label: 'Category', value: category?.name ?? '—' },
              { label: 'Email', value: partner.email },
              { label: 'Phone', value: partner.phone },
              {
                label: 'Website',
                value: (
                  <a href={partner.website} target="_blank" rel="noopener noreferrer">
                    {partner.website}
                  </a>
                ),
              },
              { label: 'Location', value: partner.address },
              { label: 'Hours', value: partner.hours },
              { label: 'Instagram', value: partner.social?.instagram ?? '—' },
              {
                label: 'Starting price',
                value: partner.startingPrice ? (
                  <Money amount={partner.startingPrice} />
                ) : (
                  'Contact for pricing'
                ),
              },
              { label: 'Applied', value: formatDate(partner.submittedAt) },
              {
                label: 'Visibility',
                value: partner.published ? 'Live in the guest app' : 'Hidden from guests',
              },
            ]}
          />
          <div style={{ marginTop: 'var(--sp-4)' }}>
            <p className="stat__label" style={{ marginBottom: 4 }}>Description</p>
            <p className="u-small" style={{ lineHeight: 1.6 }}>{partner.description}</p>
          </div>
        </Panel>

        <Panel
          title={`Photographs (${images.length})`}
          subtitle="These are what a guest sees first. Stock imagery that does not show the actual service is the most common reason to reject."
        >
          {images.length === 0 ? (
            <InlineEmpty icon="camera" title="No photographs submitted" />
          ) : (
            <div className="mediagrid">
              {images.map((photoId, i) => (
                <div className="mediacard" key={`${photoId}-${i}`}>
                  <div className="mediacard__img">
                    <SmartImage photoId={photoId} alt={`${partner.name} photo ${i + 1}`} label={partner.name} fill width={500} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </Grid>

      {/* -------------------------------- Reviews ------------------------- */}
      <Panel
        title={`Guest reviews (${reviews.length})`}
        subtitle="Ratings left in the My30A app. These are about the listing experience, not a transaction we processed."
      >
        {reviews.length === 0 ? (
          <InlineEmpty icon="star" title="No reviews yet" />
        ) : (
          <ul className="activity">
            {reviews.map((r) => (
              <li className="activity__row" key={r.id}>
                <span className="activity__icon" aria-hidden="true">{r.rating}</span>
                <span style={{ minWidth: 0 }}>
                  <span className="activity__title">{r.guestName}</span>
                  <span className="activity__body">{r.comment}</span>
                </span>
                <span className="activity__meta">{formatShortDate(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <ReviewDecisionModal
        open={!!decision}
        decision={decision}
        subject={partner.name}
        loading={busy}
        onClose={() => setDecision(null)}
        onConfirm={decide}
      />
      <AccountModals manage={manage} />
    </div>
  )
}
