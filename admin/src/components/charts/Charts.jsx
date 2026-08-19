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
  const max = Math.max(...values.map((v) => Number(v) || 0), 1)
  const magnitude = 10 ** Math.floor(Math.log10(max))
  return Math.ceil(max / magnitude) * magnitude
}

const TONE_COLOR = {
  sea: 'var(--sea-500)',
  sand: 'var(--sand-500)',
  gold: 'var(--gold-500)',
  success: 'var(--success, #2f6b4f)',
  danger: 'var(--danger, #b42318)',
  info: 'var(--sea-400, #4a7c6f)',
}

const FALLBACK_COLORS = ['var(--sea-500)', 'var(--sand-500)', 'var(--gold-500)', 'var(--ink-400)']

const colorFor = (segment, i) =>
  segment.color || TONE_COLOR[segment.tone] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]

const labelsNeedRotate = (data, innerWidth) => {
  if (data.length <= 1) return false
  const slot = innerWidth / data.length
  const longest = Math.max(...data.map((d) => String(d.label ?? '').length), 0)
  return data.length > 5 || longest * 5.6 > slot
}

function ChartBox({ width, height, label, className, children }) {
  return (
    <div className={cx('chart', className)}>
      <svg
        className="chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </div>
  )
}

function EmptyChart({ message = 'No data for this period yet.' }) {
  return (
    <div className="chart chart--empty" role="img" aria-label={message}>
      {message}
    </div>
  )
}

/** Vertical bars — daily sessions, conversations per day. */
export function BarChart({ data = [], height = 220, label, valueSuffix = '', className }) {
  const points = (Array.isArray(data) ? data : []).map((d) => ({
    ...d,
    label: String(d?.label ?? ''),
    value: Number(d?.value) || 0,
  }))
  if (points.length === 0) return <EmptyChart />

  const width = 960
  const padL = 36
  const padR = 8
  const padT = 16
  const rotate = labelsNeedRotate(points, width - padL - padR)
  const padB = rotate ? 44 : 24
  const innerWidth = width - padL - padR
  const plot = height - padT - padB
  const max = niceMax(points.map((d) => d.value))
  const slot = innerWidth / points.length
  const barWidth = Math.max(4, Math.min(22, slot * 0.62))
  const showEvery = points.length > 14 ? Math.ceil(points.length / 7) : 1
  const ticks = [0, 0.5, 1]

  return (
    <ChartBox width={width} height={height} className={className} label={`${label ?? 'Chart'}: ${points.map((d) => `${d.label} ${d.value}${valueSuffix}`).join(', ')}`}>
      {ticks.map((ratio) => {
        const y = padT + plot - plot * ratio
        return (
          <g key={ratio}>
            <line className="chart__grid" x1={padL} x2={width - padR} y1={y} y2={y} />
            <text className="chart__label" x={padL - 6} y={y + 3} textAnchor="end">
              {Math.round(max * ratio)}
            </text>
          </g>
        )
      })}

      {points.map((point, i) => {
        const barHeight = Math.max(point.value > 0 ? 3 : 0, (point.value / max) * (plot - 4))
        const x = padL + i * slot + (slot - barWidth) / 2
        const tickX = padL + i * slot + slot / 2
        const tickY = padT + plot + 14
        return (
          <g key={`${point.label}-${i}`}>
            <rect
              className="chart__bar"
              x={x}
              y={padT + plot - barHeight}
              width={barWidth}
              height={barHeight}
              rx={Math.min(3, barWidth / 2)}
            >
              <title>{`${point.label}: ${point.value}${valueSuffix}`}</title>
            </rect>
            {i % showEvery === 0 && (
              <text
                className="chart__label"
                x={tickX}
                y={tickY}
                textAnchor={rotate ? 'end' : 'middle'}
                transform={rotate ? `rotate(-40 ${tickX} ${tickY})` : undefined}
              >
                {point.label}
              </text>
            )}
          </g>
        )
      })}
    </ChartBox>
  )
}

/** Smoothed area + line — the trend view on the analytics page. */
export function TrendChart({ data = [], height = 220, label, className }) {
  const gradientId = useId()
  const series = (Array.isArray(data) ? data : []).map((d) => ({
    ...d,
    label: String(d?.label ?? ''),
    value: Number(d?.value) || 0,
  }))
  if (series.length < 2) return series.length === 1 ? <BarChart data={series} height={height} label={label} className={className} /> : <EmptyChart />

  const width = 960
  const padL = 36
  const padR = 8
  const padT = 12
  const padB = 24
  const plot = height - padT - padB
  const max = niceMax(series.map((d) => d.value))
  const step = (width - padL - padR) / (series.length - 1)

  const points = series.map((point, i) => ({
    x: padL + i * step,
    y: padT + plot - (point.value / max) * (plot - 4),
    ...point,
  }))

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${(width - padR).toFixed(1)},${(padT + plot).toFixed(1)} L${padL},${padT + plot} Z`
  const showEvery = series.length > 12 ? Math.ceil(series.length / 6) : 1
  const ticks = [0, 0.5, 1]

  return (
    <ChartBox width={width} height={height} className={className} label={`${label ?? 'Trend'}: ${series.map((d) => `${d.label} ${d.value}`).join(', ')}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sea-500)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--sea-500)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {ticks.map((ratio) => {
        const y = padT + plot - plot * ratio
        return (
          <g key={ratio}>
            <line className="chart__grid" x1={padL} x2={width - padR} y1={y} y2={y} />
            <text className="chart__label" x={padL - 6} y={y + 3} textAnchor="end">
              {Math.round(max * ratio)}
            </text>
          </g>
        )
      })}

      <path d={area} fill={`url(#${gradientId})`} />
      <path className="chart__line" d={line} />

      {points.map((point, i) =>
        i % showEvery === 0 ? (
          <g key={`${point.label}-${i}`}>
            <circle className="chart__dot" cx={point.x} cy={point.y} r="3" />
            <text className="chart__label" x={point.x} y={height - 6} textAnchor="middle">
              {point.label}
            </text>
          </g>
        ) : null,
      )}
    </ChartBox>
  )
}

/** Horizontal ranked bars — top questions, most-viewed sections. */
export function RankBars({ data = [], valueLabel = '', max: providedMax, className }) {
  if (!Array.isArray(data) || data.length === 0) return null
  const max = providedMax ?? Math.max(...data.map((d) => Number(d.value) || 0), 1)

  return (
    <div className={cx('rankbar', className)}>
      {data.map((point) => (
        <div className="rankbar__row" key={point.label}>
          <span className="rankbar__label">{point.label}</span>
          <span className="rankbar__value">
            {point.value}
            {valueLabel ? <span className="rankbar__unit"> {valueLabel}</span> : null}
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
  const parts = Array.isArray(segments) ? segments : []
  const total = parts.reduce((sum, segment) => sum + (Number(segment.value) || 0), 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="chart chart--donut">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={parts.map((s) => `${s.label} ${s.value}`).join(', ')}
        className="chart__donut-svg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={thickness}
        />
        {parts.map((segment, i) => {
          const length = (segment.value / total) * circumference
          const fill = colorFor(segment, i)
          const circle = (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={fill}
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
              dominantBaseline="middle"
              style={{ fontFamily: 'var(--font-display)', fontSize: 24, fill: 'var(--ink-900)' }}
            >
              {centerValue}
            </text>
            <text x="50%" y="64%" textAnchor="middle" className="chart__label">
              {centerLabel}
            </text>
          </>
        )}
      </svg>

      <ul className="chart__legend">
        {parts.map((segment, i) => (
          <li className="chart__legend-item" key={segment.label}>
            <span className="chart__swatch" style={{ background: colorFor(segment, i) }} />
            <span className="chart__legend-text">{segment.label}</span>
            <span className="chart__legend-value">{segment.value}</span>
          </li>
        ))}
      </ul>
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
