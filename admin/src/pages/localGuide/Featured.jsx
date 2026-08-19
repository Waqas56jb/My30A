import { Link } from 'react-router-dom'
import Icon from '../../components/ui/Icon'
import Button from '../../components/ui/Button'
import SmartImage, { Thumb } from '../../components/ui/SmartImage'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import { Callout } from '../../components/ui/Display'
import { PageHeader, Panel, Grid, Stat, Money, InlineEmpty } from '../../components/common/AdminUI'
import { Badge } from '../../components/ui/StatusBadge'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useAdmin } from '../../context/AdminContext'
import * as api from '../../services/adminApi'
import { formatNumber } from '../../utils/format'
import { partnerPath } from '../../utils/paths'

/**
 * Featured places.
 *
 * Featuring is the strongest lever admin has over what guests notice, so it is
 * worth being able to see the whole set at once rather than hunting through a
 * table for stars.
 */
export default function Featured() {
  useDocumentTitle('Featured places')
  const { pushToast } = useAdmin()

  const featured = useLoad(() => api.getPartners({ featured: true, pageSize: 100 }), [])
  const eligible = useLoad(() => api.getPartners({ status: 'approved', pageSize: 200, sort: 'views' }), [])
  const categories = useLoad(() => api.getCategories(), [])

  if (featured.loading || eligible.loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (featured.error) return <ErrorState error={featured.error} onRetry={featured.reload} />

  const rows = featured.data?.rows ?? []
  const candidates = (eligible.data?.rows ?? []).filter((p) => !p.featured).slice(0, 8)
  const categoryList = Array.isArray(categories.data) ? categories.data : []
  const categoryName = (id) => categoryList.find((c) => c.id === id)?.name ?? id

  const toggle = async (partner, next) => {
    try {
      await api.updatePartner(partner.id, { featured: next })
      pushToast({ tone: 'success', title: next ? `${partner.name} featured` : `${partner.name} unfeatured` })
      featured.reload()
      eligible.reload()
    } catch (err) {
      pushToast({ tone: 'error', title: 'Could not update', message: err.message })
    }
  }

  return (
    <div className="apage">
      <PageHeader
        title="Featured places"
        subtitle="The listings pushed to the top of the Local Guide and onto the landing page."
        actions={<Button to="/admin/local-guide/listings" variant="secondary" icon="grid">All listings</Button>}
      />

      <Callout icon="info">
        Only approved listings can be featured, and featuring is removed automatically if a listing
        is later suspended or rejected — so nothing hidden can stay in a promoted slot.
      </Callout>

      <div className="astats">
        <Stat label="Featured" value={rows.length} icon="star" tone="gold" />
        <Stat
          label="Categories covered"
          value={new Set(rows.map((r) => r.categoryId)).size}
          icon="compass"
          tone="sea"
        />
        <Stat
          label="Combined views"
          value={rows.reduce((sum, r) => sum + (Number(r.stats?.views) || 0), 0)}
          icon="eye"
          tone="info"
        />
        <Stat
          label="Outbound clicks"
          value={rows.reduce(
            (sum, r) =>
              sum +
              (Number(r.stats?.websiteClicks) || 0) +
              (Number(r.stats?.phoneClicks) || 0) +
              (Number(r.stats?.directionsClicks) || 0),
            0,
          )}
          icon="navigation"
          tone="success"
        />
      </div>

      <Panel title={`Currently featured (${rows.length})`}>
        {rows.length === 0 ? (
          <InlineEmpty
            icon="star"
            title="Nothing is featured"
            body="Pick a few strong listings below to promote them."
          />
        ) : (
          <div className="mediagrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))' }}>
            {rows.map((partner) => (
              <div className="mediacard" key={partner.id}>
                <div className="mediacard__img">
                  <SmartImage photoId={partner.images?.[0]} alt={partner.name} label={partner.name} fill width={480} />
                  <span className="mediacard__flag">Featured</span>
                </div>
                <div className="mediacard__body">
                  <Link to={partnerPath(partner)} className="mediacard__name">
                    {partner.name}
                  </Link>
                  <span className="mediacard__meta">{categoryName(partner.categoryId)}</span>
                  <span className="mediacard__meta">
                    {formatNumber(partner.stats?.views)} views ·{' '}
                    {partner.startingPrice ? <Money amount={partner.startingPrice} /> : 'Contact for pricing'}
                  </span>
                </div>
                <div className="mediacard__actions">
                  <Button size="sm" variant="ghost" icon="star" onClick={() => toggle(partner, false)}>
                    Unfeature
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Strong candidates"
        subtitle="Approved listings with the most guest interest that are not featured yet."
      >
        {candidates.length === 0 ? (
          <InlineEmpty icon="checkCircle" title="Everything strong is already featured" />
        ) : (
          <ul className="activity">
            {candidates.map((partner) => (
              <li className="activity__row" key={partner.id}>
                <Thumb photoId={partner.images?.[0]} name={partner.name} alt="" />
                <span style={{ minWidth: 0, flex: '1 1 auto' }}>
                  <Link to={partnerPath(partner)} className="activity__title" style={{ textDecoration: 'none' }}>
                    {partner.name}
                  </Link>
                  <span className="activity__body">
                    {categoryName(partner.categoryId)} · {formatNumber(partner.stats?.views)} views
                  </span>
                </span>
                <Button size="sm" variant="secondary" icon="star" onClick={() => toggle(partner, true)}>
                  Feature
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
