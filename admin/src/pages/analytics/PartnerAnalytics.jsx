import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SkeletonGrid } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/States'
import {
  PageHeader, Panel, Grid, Stat, ReferralNote, InlineEmpty,
} from '../../components/common/AdminUI'
import DataTable from '../../components/tables/DataTable'
import { TrendChart, RankBars, Donut } from '../../components/charts/Charts'
import RangeFilter, { ChartNote } from '../../components/charts/RangeFilter'
import { useLoad } from '../../hooks/useTable'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import * as api from '../../services/adminApi'
import { TRACKED_EVENTS, NOT_TRACKED, partnerCtr } from '../../data/partners'
import { series } from '../../data/analytics'
import { formatNumber } from '../../utils/format'

/**
 * Partner referral analytics.
 *
 * The whole screen is built around one honest claim: My30A generated N
 * interactions with these businesses. Not N bookings, not N dollars — N
 * interactions, of which some fraction were people leaving to make contact.
 */
export default function PartnerAnalytics() {
  useDocumentTitle('Partner analytics')
  const [range, setRange] = useState('30d')

  const partners = useLoad(() => api.getPartners({ status: 'approved', pageSize: 200, sort: 'views' }), [])
  const categories = useLoad(() => api.getCategories(), [])

  if (partners.loading || categories.loading) return <SkeletonGrid count={6} columns="grid--3" />
  if (partners.error) return <ErrorState error={partners.error} onRetry={partners.reload} />

  const rows = partners.data?.rows ?? []
  const sum = (field) => rows.reduce((total, p) => total + (Number(p.stats?.[field]) || 0), 0)
  const views = sum('views')
  const website = sum('websiteClicks')
  const phone = sum('phoneClicks')
  const directions = sum('directionsClicks')
  const outbound = website + phone + directions
  const total = views + outbound

  const byCategory = (Array.isArray(categories.data) ? categories.data : [])
    .map((category) => {
      const inCategory = rows.filter((p) => p.categoryId === category.id)
      const catViews = inCategory.reduce((t, p) => t + (Number(p.stats?.views) || 0), 0)
      const catClicks = inCategory.reduce(
        (t, p) =>
          t +
          (Number(p.stats?.websiteClicks) || 0) +
          (Number(p.stats?.phoneClicks) || 0) +
          (Number(p.stats?.directionsClicks) || 0),
        0,
      )
      return {
        id: category.id,
        name: category.name,
        listings: inCategory.length,
        views: catViews,
        clicks: catClicks,
        ctr: catViews ? catClicks / catViews : 0,
      }
    })
    .filter((c) => c.listings > 0)
    .sort((a, b) => b.views - a.views)

  return (
    <div className="apage">
      <PageHeader
        title="Partner analytics"
        subtitle={`This period My30A generated ${formatNumber(total)} partner interactions across ${rows.length} approved listings.`}
        actions={<RangeFilter value={range} onChange={setRange} />}
      />

      <ReferralNote />

      <div className="astats">
        {TRACKED_EVENTS.map((event) => (
          <Stat
            key={event.key}
            label={event.label}
            value={{ views, websiteClicks: website, phoneClicks: phone, directionsClicks: directions }[event.key]}
            icon={event.icon}
            tone={event.key === 'views' ? 'sea' : 'gold'}
          />
        ))}
      </div>

      <Grid cols={2}>
        <Panel title="Referral traffic over time">
          <TrendChart data={series('partnerClicks', range)} label="Partner interactions" height={190} />
          <ChartNote>
            Every tracked event combined: listing views plus outbound website, phone and directions
            taps.
          </ChartNote>
        </Panel>

        <Panel title="What guests did after seeing a listing">
          <Donut
            segments={[
              { label: 'Website', value: website, tone: 'sea' },
              { label: 'Phone', value: phone, tone: 'sand' },
              { label: 'Directions', value: directions },
            ]}
            centerLabel="Click-through"
            centerValue={`${views ? ((outbound / views) * 100).toFixed(1) : 0}%`}
          />
          <ChartNote>
            Of {formatNumber(views)} listing views, {formatNumber(outbound)} became an outbound
            action. What happened next is between the guest and the business.
          </ChartNote>
        </Panel>
      </Grid>

      <Panel title="Top categories" subtitle="Where guest interest is concentrated.">
        <RankBars
          data={byCategory.slice(0, 10).map((c) => ({ label: c.name, value: c.views + c.clicks }))}
          valueLabel="interactions"
        />
      </Panel>

      <Panel title="Top performing partners" subtitle="Ranked by profile views." flush>
        <DataTable
          columns={[
            {
              key: 'name',
              label: 'Partner',
              primary: true,
              render: (r) => (
                <Link to={`/admin/partners/${r.id}`} className="dtable__strong" onClick={(e) => e.stopPropagation()}>
                  {r.name}
                </Link>
              ),
            },
            {
              key: 'categoryId',
              label: 'Category',
              render: (r) => categories.data?.find((c) => c.id === r.categoryId)?.name ?? '—',
            },
            { key: 'views', label: 'Profile views', align: 'right', render: (r) => formatNumber(r.stats?.views) },
            { key: 'website', label: 'Website', align: 'right', render: (r) => formatNumber(r.stats?.websiteClicks) },
            { key: 'phone', label: 'Phone', align: 'right', render: (r) => formatNumber(r.stats?.phoneClicks) },
            {
              key: 'directions',
              label: 'Directions',
              align: 'right',
              hideOn: 'card',
              render: (r) => formatNumber(r.stats?.directionsClicks),
            },
            {
              key: 'ctr',
              label: 'CTR',
              align: 'right',
              render: (r) => `${(partnerCtr(r) * 100).toFixed(1)}%`,
            },
          ]}
          rows={rows.slice(0, 20)}
          rowTo={(r) => `/admin/partners/${r.id}`}
          caption="Top partners by referral activity"
          empty={{ icon: 'sparkles', title: 'No approved partners yet' }}
        />
      </Panel>

      <Panel title="By category" flush>
        <DataTable
          columns={[
            { key: 'name', label: 'Category', primary: true },
            { key: 'listings', label: 'Listings', align: 'right' },
            { key: 'views', label: 'Views', align: 'right', render: (r) => formatNumber(r.views) },
            { key: 'clicks', label: 'Outbound clicks', align: 'right', render: (r) => formatNumber(r.clicks) },
            { key: 'ctr', label: 'CTR', align: 'right', render: (r) => `${(r.ctr * 100).toFixed(1)}%` },
          ]}
          rows={byCategory}
          rowKey={(r) => r.id}
          caption="Referral activity by category"
          empty={{ icon: 'compass', title: 'No category activity' }}
        />
      </Panel>

      <Panel title="What is not tracked" subtitle="Stated plainly so nobody reads a click as a sale.">
        <ul className="u-stack" style={{ gap: 6, margin: 0, paddingLeft: 18 }}>
          {NOT_TRACKED.map((item) => (
            <li key={item} className="u-small u-muted">{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
