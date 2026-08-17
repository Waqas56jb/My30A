import { cx } from '../utils/format'

/**
 * One dataset, two presentations.
 *
 * Below 860px each row renders as a card with labelled fields — a horizontally
 * scrolling table on a phone is the classic admin-panel failure, and the brief
 * rules it out. Above that it is a real <table> so it stays scannable and
 * screen readers announce the column headers.
 *
 * columns: [{ key, header, render(row), primary?, hideOnCard? }]
 */
export default function DataTable({
  columns = [],
  rows = [],
  onRowClick,
  rowKey = (row) => row.id,
  cardTitle,
  cardMedia,
  caption,
  className,
}) {
  const cardColumns = columns.filter((column) => !column.primary && !column.hideOnCard)

  return (
    <div className={cx('dtable', className)}>
      {/* ---------------- Cards (small screens) ---------------- */}
      <div className="dtable__cards">
        {rows.map((row) => {
          const Tag = onRowClick ? 'button' : 'div'
          return (
            <Tag
              key={rowKey(row)}
              type={onRowClick ? 'button' : undefined}
              className="dtable__card"
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              <span className="dtable__card-head">
                {cardMedia?.(row)}
                <span className="dtable__card-title">{cardTitle ? cardTitle(row) : rowKey(row)}</span>
                {columns.find((column) => column.primary)?.render(row)}
              </span>
              <span className="dtable__card-rows">
                {cardColumns.map((column) => (
                  <span key={column.key}>
                    <span className="dtable__cell-k">{column.header}</span>
                    <span className="dtable__cell-v">{column.render(row)}</span>
                  </span>
                ))}
              </span>
            </Tag>
          )
        })}
      </div>

      {/* ---------------- Table (860px and up) ---------------- */}
      <div className="dtable__scroll">
        <table className="dtable__table">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.primary ? undefined : undefined}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
