import { cx } from '../../utils/format'

/** Base shimmer block. */
export default function Skeleton({ variant = 'text', width, height, radius, className, style }) {
  return (
    <span
      className={cx('skel', `skel--${variant}`, className)}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

/** Card-shaped placeholder used by catalogue grids. */
export function SkeletonCard({ media = true, lines = 2 }) {
  return (
    <div className="skel-card" aria-hidden="true">
      {media && <Skeleton variant="media" />}
      <Skeleton variant="title" width="72%" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '48%' : '92%'} />
      ))}
    </div>
  )
}

/** Grid of card skeletons — the standard list loading state. */
export function SkeletonGrid({ count = 6, columns = 'grid--2' }) {
  return (
    <div className={cx('grid', columns)} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Stacked row skeletons for lists (orders, notifications). */
export function SkeletonList({ count = 4 }) {
  return (
    <div className="u-stack" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card card--pad u-row" style={{ gap: 14 }}>
          <Skeleton variant="avatar" />
          <div className="u-grow u-stack" style={{ gap: 8 }}>
            <Skeleton variant="title" width="42%" />
            <Skeleton variant="text" width="76%" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** Full-page skeleton used while the guest session resolves. */
export function SkeletonPage() {
  return (
    <div className="page" role="status" aria-label="Loading">
      <Skeleton variant="media" style={{ borderRadius: 'var(--r-xl)', marginBottom: 24 }} />
      <Skeleton variant="title" width="52%" />
      <div style={{ height: 10 }} />
      <Skeleton variant="text" width="80%" />
      <div style={{ height: 28 }} />
      <SkeletonGrid count={4} />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
