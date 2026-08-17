import { Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon'
import { IconButton } from './Button'
import { cx } from '../../utils/format'

/** Breadcrumb trail — shown on detail pages from tablet up. */
export function Breadcrumbs({ items = [], className }) {
  if (items.length === 0) return null
  return (
    <nav className={cx('crumbs', className)} aria-label="Breadcrumb">
      {items.map((item, i) => (
        // Index-qualified: a trail can legitimately point at the same route twice.
        <Fragment key={`${i}-${item.to ?? item.label}`}>
          {i > 0 && <Icon name="chevronRight" aria-hidden="true" />}
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}

/**
 * Standard page title block. `back` renders a back control that prefers
 * history but falls back to a route so a deep link is never a dead end.
 */
export default function PageHeader({
  title,
  subtitle,
  back,
  backTo,
  actions,
  breadcrumbs,
  className,
}) {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(backTo ?? '/')
  }

  return (
    <div className={cx(className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="pagehead">
        {back && (
          <div className="pagehead__back">
            <IconButton icon="arrowLeft" label="Go back" onClick={goBack} />
          </div>
        )}
        <div className="pagehead__text">
          <h1 className="pagehead__title">{title}</h1>
          {subtitle && <p className="pagehead__sub">{subtitle}</p>}
        </div>
        {actions && <div className="pagehead__actions">{actions}</div>}
      </div>
    </div>
  )
}

/** Sticky action bar pinned above the tab bar on mobile. */
export function StickyBar({ children, className }) {
  return <div className={cx('stickybar', className)}>{children}</div>
}
