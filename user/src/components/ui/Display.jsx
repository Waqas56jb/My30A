import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'
import SmartImage from './SmartImage'
import { IconButton } from './Button'
import { cx, formatCurrency, initials } from '../../utils/format'

/** Read-only star rating with count. */
export function RatingStars({ value = 0, count, size = 'sm', showValue = true, className }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className={cx('stars', size === 'lg' && 'stars--lg', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = rounded >= star ? 1 : rounded >= star - 0.5 ? 0.5 : 0
        return (
          <svg key={star} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <linearGradient id={`half-${star}`}>
                <stop offset="50%" stopColor="currentColor" />
                <stop offset="50%" stopColor="var(--line-strong)" />
              </linearGradient>
            </defs>
            <path
              d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.8l6.5-.9z"
              fill={fill === 1 ? 'currentColor' : fill === 0.5 ? `url(#half-${star})` : 'var(--line-strong)'}
            />
          </svg>
        )
      })}
      {showValue && <span className="stars__value">{value?.toFixed(1)}</span>}
      {count ? <span className="stars__count">({count.toLocaleString()})</span> : null}
      <span className="sr-only">
        {value} out of 5 stars{count ? ` from ${count} reviews` : ''}
      </span>
    </span>
  )
}

/** 'From $25 per bike / day' */
export function PriceDisplay({ amount, unit, prefix = 'From', size, className }) {
  if (amount === null || amount === undefined) return null
  return (
    <span className={cx('price', size === 'lg' && 'price--lg', className)}>
      {prefix && <span className="price__from">{prefix}</span>}
      <span className="price__amount">{formatCurrency(amount, { cents: false })}</span>
      {unit && <span className="price__unit">{unit}</span>}
    </span>
  )
}

/** Dot-separated metadata row. */
export function MetaRow({ items = [], className }) {
  const visible = items.filter(Boolean)
  return (
    <span className={cx('meta', className)}>
      {visible.map((item, i) => (
        <span key={i} className="meta__item">
          {i > 0 && <span className="meta__sep" aria-hidden="true" />}
          {item.icon && <Icon name={item.icon} />}
          {item.text ?? item}
        </span>
      ))}
    </span>
  )
}

export function Avatar({ src, name = '', size = 'md', vitoria = false, className }) {
  const [failed, setFailed] = useState(false)
  return (
    <span
      className={cx('avatar', `avatar--${size}`, vitoria && 'avatar--vitoria', className)}
      aria-hidden="true"
    >
      {vitoria ? (
        <Icon name="sparkles" style={{ width: '52%', height: '52%' }} />
      ) : src && !failed ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials(name) || <Icon name="user" style={{ width: '50%', height: '50%' }} />
      )}
    </span>
  )
}

/** Labelled value with a copy-to-clipboard action. */
export function CopyField({ label, value, onCopied }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value))
    } catch {
      /* clipboard unavailable — the value is still selectable */
    }
    setCopied(true)
    onCopied?.(value)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="copyfield">
      <div className="u-grow">
        <div className="copyfield__label">{label}</div>
        <div className="copyfield__value">{value}</div>
      </div>
      <IconButton
        icon={copied ? 'check' : 'copy'}
        label={copied ? 'Copied' : `Copy ${label}`}
        onClick={copy}
      />
    </div>
  )
}

/** Key/value list used in summaries and receipts. */
export function DefinitionList({ rows = [], className }) {
  return (
    <dl className={cx('dl', className)}>
      {rows.filter(Boolean).map((row, i) => (
        <div className="dl__row" key={row.key ?? i}>
          <dt className="dl__key">{row.key}</dt>
          <dd className={cx('dl__val', row.total && 'dl__val--total')}>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Vertical progress timeline for orders. */
export function Timeline({ steps = [], className }) {
  return (
    <ol className={cx('timeline', className)}>
      {steps.map((step, i) => (
        <li
          key={step.key ?? i}
          className={cx('tl-step', `tl-step--${step.state ?? 'pending'}`)}
          aria-current={step.state === 'current' ? 'step' : undefined}
        >
          <div className="tl-step__rail">
            <span className="tl-step__marker" aria-hidden="true">
              {step.state === 'done' ? (
                <Icon name="check" strokeWidth={2.6} />
              ) : step.state === 'current' ? (
                <Icon name="circle" />
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
              )}
            </span>
            {i < steps.length - 1 && <span className="tl-step__line" />}
          </div>
          <div>
            <div className="tl-step__title">{step.title}</div>
            {step.meta && <div className="tl-step__meta">{step.meta}</div>}
            {step.body && <div className="tl-step__body">{step.body}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Section wrapper with an optional "see all" link. */
export function Section({ title, subtitle, linkTo, linkLabel = 'See all', children, className, id }) {
  return (
    <section className={cx('section', className)} id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      {(title || linkTo) && (
        <header className="section__head">
          <div>
            {title && (
              <h2 className="section__title" id={id ? `${id}-title` : undefined}>
                {title}
              </h2>
            )}
            {subtitle && <p className="section__sub">{subtitle}</p>}
          </div>
          {linkTo && (
            <Link className="section__link" to={linkTo}>
              {linkLabel}
            </Link>
          )}
        </header>
      )}
      {children}
    </section>
  )
}

/** Coloured note used for practical caveats and disclosures. */
export function Callout({ icon = 'info', tone, children, className, style }) {
  return (
    <div className={cx('callout', tone && `callout--${tone}`, className)} style={style}>
      <Icon name={icon} />
      <div>{children}</div>
    </div>
  )
}

/** Horizontal scroller with snap, used for card rails. */
export function ScrollRow({ children, className, label }) {
  return (
    <div className={cx('hscroll', className)} role="list" aria-label={label}>
      {children}
    </div>
  )
}

/** Gallery grid + lightbox trigger. */
export function ImageGallery({ images = [], alt = '', onOpen }) {
  if (!images.length) return null
  return (
    <div className="gallery">
      {images.map((photoId, i) => (
        <button
          key={`${photoId}-${i}`}
          type="button"
          className="gallery__item"
          onClick={() => onOpen?.(i)}
          aria-label={`Open photo ${i + 1} of ${images.length}`}
        >
          <SmartImage photoId={photoId} alt={`${alt} photo ${i + 1}`} ratio="4x3" width={640} zoom />
        </button>
      ))}
    </div>
  )
}
