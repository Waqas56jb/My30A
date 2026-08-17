import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { SkeletonList } from '../ui/Skeleton'
import { ErrorState } from '../ui/States'
import { InlineEmpty } from '../common/AdminUI'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { cx } from '../../utils/format'

/**
 * One table component for every list in the panel.
 *
 * Below 900px it stops being a table and becomes a stack of labelled cards.
 * That is not a style choice — a nine-column table on a 375px phone either
 * scrolls sideways (which the brief forbids) or shrinks the text to nothing.
 * Cards keep every field readable and every row tappable.
 *
 * Columns declare `{ key, label, render, align, hideOn, primary }`:
 *   render   — (row) => node, so a cell can be a badge or a link
 *   hideOn   — 'card' drops noisy columns from the mobile card
 *   primary  — the field used as the card's heading
 */
export default function DataTable({
  columns,
  rows,
  loading = false,
  error = null,
  onRetry,
  rowKey = (row) => row.id,
  rowTo,
  onRowClick,
  empty = { title: 'Nothing here yet' },
  caption,
  sort,
  onSort,
}) {
  const navigate = useNavigate()
  const isCards = useMediaQuery('(max-width: 899px)')

  if (loading) return <SkeletonList count={6} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (!rows.length) return <InlineEmpty {...empty} />

  const activate = (row) => {
    if (onRowClick) onRowClick(row)
    else if (rowTo) navigate(rowTo(row))
  }

  const interactive = !!(rowTo || onRowClick)

  /* ----------------------------- Cards ----------------------------- */
  if (isCards) {
    const primary = columns.find((c) => c.primary) ?? columns[0]
    const rest = columns.filter((c) => c !== primary && c.hideOn !== 'card')

    return (
      <div className="dcards">
        {rows.map((row) => {
          const Wrapper = interactive ? 'button' : 'div'
          return (
            <Wrapper
              key={rowKey(row)}
              type={interactive ? 'button' : undefined}
              className={cx('dcard', interactive && 'dcard--link')}
              onClick={interactive ? () => activate(row) : undefined}
            >
              <span className="dcard__head">
                <span className="dcard__title">
                  {primary.render ? primary.render(row) : row[primary.key]}
                </span>
                {interactive && <Icon name="chevronRight" size={16} className="dcard__go" />}
              </span>
              <span className="dcard__fields">
                {rest.map((column) => (
                  <span className="dcard__field" key={column.key}>
                    <span className="dcard__label">{column.label}</span>
                    <span className="dcard__value">
                      {column.render ? column.render(row) : (row[column.key] ?? '—')}
                    </span>
                  </span>
                ))}
              </span>
            </Wrapper>
          )
        })}
      </div>
    )
  }

  /* ----------------------------- Table ----------------------------- */
  return (
    <div className="dtable__wrap">
      <table className="dtable">
        {caption && <caption className="u-sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => {
              const sortable = !!(onSort && column.sortable)
              const active = sort?.key === column.key
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={cx(column.align === 'right' && 'is-right', column.width && 'is-tight')}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  {sortable ? (
                    <button type="button" className="dtable__sort" onClick={() => onSort(column.key)}>
                      {column.label}
                      <Icon
                        name={active && sort.dir === 'asc' ? 'chevronUp' : 'chevronDown'}
                        size={13}
                        style={{ opacity: active ? 1 : 0.35 }}
                      />
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cx(interactive && 'is-clickable')}
              onClick={interactive ? () => activate(row) : undefined}
              tabIndex={interactive ? 0 : undefined}
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        activate(row)
                      }
                    }
                  : undefined
              }
            >
              {columns.map((column) => (
                <td key={column.key} className={cx(column.align === 'right' && 'is-right')}>
                  {column.render ? column.render(row) : (row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------ Pagination ------------------------------- */

export function Pagination({ page, pages, total, pageSize, onPage }) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="pager">
      <p className="pager__count">
        {from}–{to} of {total.toLocaleString()}
      </p>
      <div className="pager__controls">
        <button
          type="button"
          className="pager__btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <Icon name="chevronLeft" size={16} />
        </button>
        <span className="pager__page">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className="pager__btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------- Toolbar --------------------------------- */

export function TableToolbar({ children, className }) {
  return <div className={cx('ttoolbar', className)}>{children}</div>
}
