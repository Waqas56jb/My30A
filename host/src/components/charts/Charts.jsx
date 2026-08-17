import { useId } from 'react'
import { cx } from '../../utils/format'

/**
 * Hand-rolled SVG charts.
 *
 * No charting dependency: these render into a viewBox at 100% width, so they
 * resize with their container down to 320px without a resize observer, and
 * they inherit the design-system colours. Each one also exposes the underlying
 * numbers to screen readers rather than being a decorative blob.
 */

const niceMax = (values) => {
  const max = Math.max(...values, 1)
  const magnitude = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / magnitude) * magnitude
}

/** Vertical bars — daily sessions, conversations per day. */
export function BarChart({ data = [], height = 150, label, valueSuffix = '', className }) {
  if (data.length === 0) return null

  const width = 320
  const padBottom = 20
  const max = niceMax(data.map((d) => d.value))
  const slot = width / data.length
  const barWidth = Math.max(4, Math.min(26, slot * 0.56))
  const plot = height - padBottom
  const showEvery = data.length > 14 ? Math.ceil(data.length / 7) : 1

  return (
    <div className={cx('chart', className)}>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label ?? 'Chart'}: ${data.map((d) => `${d.label} ${d.value}${valueSuffix}`).join(', ')}`}
      >
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            className="chart__grid"
            x1="0"
            x2={width}
            y1={plot - plot * ratio}
            y2={plot - plot * ratio}
          />
        ))}

        {data.map((point, i) => {
          const barHeight = Math.max(2, (point.value / max) * (plot - 6))
          const x = i * slot + (slot - barWidth) / 2
          return (
            <g key={`${point.label}-${i}`}>
              <rect
                className="chart__bar"
                x={x}
                y={plot - barHeight}
                width={barWidth}
                height={barHeight}
                rx={Math.min(4, barWidth / 2)}
              >
                <title>{`${point.label}: ${point.value}${valueSuffix}`}</title>
              </rect>
              {i % showEvery === 0 && (
                <text className="chart__label" x={i * slot + slot / 2} y={height - 5} textAnchor="middle">
                  {point.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Smoothed area + line — the trend view on the analytics page. */
export function TrendChart({ data = [], height = 170, label, className }) {
  const gradientId = useId()
  if (data.length < 2) return null

  const width = 320
  const padBottom = 20
  const plot = height - padBottom
  const max = niceMax(data.map((d) => d.value))
  const step = width / (data.length - 1)

  const points = data.map((point, i) => ({
    x: i * step,
    y: plot - (point.value / max) * (plot - 8),
    ...point,
  }))

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${plot} L0,${plot} Z`
  const showEvery = data.length > 12 ? Math.ceil(data.length / 6) : 1

  return (
    <div className={cx('chart', className)}>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${label ?? 'Trend'}: ${data.map((d) => `${d.label} ${d.value}`).join(', ')}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sea-500)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--sea-500)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            className="chart__grid"
            x1="0"
            x2={width}
            y1={plot - (plot - 8) * ratio}
            y2={plot - (plot - 8) * ratio}
          />
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path className="chart__line" d={line} />

        {points.map((point, i) =>
          i % showEvery === 0 ? (
            <g key={`${point.label}-${i}`}>
              <circle className="chart__dot" cx={point.x} cy={point.y} r="3" />
              <text className="chart__label" x={point.x} y={height - 5} textAnchor="middle">
                {point.label}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </div>
  )
}

/** Horizontal ranked bars — top questions, most-viewed sections. */
export function RankBars({ data = [], valueLabel = '', max: providedMax, className }) {
  if (data.length === 0) return null
  const max = providedMax ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <div className={cx('rankbar', className)}>
      {data.map((point) => (
        <div className="rankbar__row" key={point.label}>
          <span className="rankbar__label">{point.label}</span>
          <span className="rankbar__value">
            {point.value}
            {valueLabel ? ` ${valueLabel}` : ''}
          </span>
          <span className="rankbar__track">
            <span
              className="rankbar__fill"
              style={{
                width: `${Math.max(3, (point.value / max) * 100)}%`,
                background: point.tone === 'sand' ? 'var(--sand-500)' : undefined,
              }}
            />
          </span>
        </div>
      ))}
    </div>
  )
}

/** Donut for a two-or-three way split, e.g. answered vs escalated. */
export function Donut({ segments = [], size = 132, thickness = 16, centerLabel, centerValue }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="chart" style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={segments.map((s) => `${s.label} ${s.value}`).join(', ')}
        style={{ flex: 'none' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={thickness}
        />
        {segments.map((segment) => {
          const length = (segment.value / total) * circumference
          const circle = (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={thickness}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            >
              <title>{`${segment.label}: ${segment.value}`}</title>
            </circle>
          )
          offset += length
          return circle
        })}
        {centerValue !== undefined && (
          <>
            <text
              x="50%"
              y="47%"
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-display)', fontSize: 24, fill: 'var(--ink-900)' }}
            >
              {centerValue}
            </text>
            <text x="50%" y="63%" textAnchor="middle" className="chart__label">
              {centerLabel}
            </text>
          </>
        )}
      </svg>

      <div className="chart__legend" style={{ marginTop: 0 }}>
        {segments.map((segment) => (
          <span className="chart__legend-item" key={segment.label}>
            <span className="chart__swatch" style={{ background: segment.color }} />
            {segment.label} · {segment.value}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Five-star distribution used on the analytics page. */
export function StarBreakdown({ breakdown = [], total }) {
  const sum = total ?? breakdown.reduce((a, b) => a + b, 0) ?? 0
  return (
    <div className="rankbar">
      {[5, 4, 3, 2, 1].map((star) => {
        const value = breakdown[star - 1] ?? 0
        return (
          <div className="rankbar__row" key={star}>
            <span className="rankbar__label">
              {star} star{star === 1 ? '' : 's'}
            </span>
            <span className="rankbar__value">{value}</span>
            <span className="rankbar__track">
              <span
                className="rankbar__fill"
                style={{
                  width: `${sum ? Math.max(2, (value / sum) * 100) : 0}%`,
                  background: star >= 4 ? 'var(--sea-500)' : 'var(--sand-500)',
                }}
              />
            </span>
          </div>
        )
      })}
    </div>
  )
}
