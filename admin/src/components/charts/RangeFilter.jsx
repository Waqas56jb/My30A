import { RANGES } from '../../data/analytics'
import { cx } from '../../utils/format'

/**
 * Today / 7d / 30d / 90d / 12m.
 *
 * Scrolls horizontally inside itself on a narrow phone rather than wrapping to
 * two lines or pushing the page sideways.
 */
export default function RangeFilter({ value, onChange, className, ranges = RANGES }) {
  return (
    <div className={cx('rangefilter', className)} role="group" aria-label="Date range">
      {ranges.map((range) => (
        <button
          key={range.id}
          type="button"
          className={cx('rangefilter__btn', value === range.id && 'is-active')}
          aria-pressed={value === range.id}
          onClick={() => onChange(range.id)}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

/** Small caption so a chart never floats without saying what it is counting. */
export function ChartNote({ children }) {
  return <p className="chart-note">{children}</p>
}
