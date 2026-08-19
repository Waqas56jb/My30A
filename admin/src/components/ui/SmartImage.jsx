import { useEffect, useState } from 'react'
import { cx, initials as nameInitials } from '../../utils/format'
import { resolveImageSrc } from '../../assets/images'

/**
 * Every image in the app renders through here so that:
 *  - the aspect ratio is reserved before load (no layout shift),
 *  - a shimmer covers the gap while it downloads,
 *  - a failed or missing photo becomes a branded initials tile — never a
 *    clipped landscape glyph or the browser's broken-image icon,
 *  - alt text is mandatory in practice (decorative images pass alt="").
 *
 * `photoId` accepts an Unsplash id or a full http(s) URL; `src` takes a URL.
 * `initials` / `label` drive the empty-state tile in lists and cards.
 */
export default function SmartImage({
  photoId,
  src,
  alt = '',
  ratio = '3x2',
  width = 800,
  zoom = false,
  className,
  fill = false,
  eager = false,
  radius,
  initials,
  label,
  ...rest
}) {
  const resolved = resolveImageSrc(photoId, src, width, ratioToNumber(ratio))
  const [state, setState] = useState(resolved ? 'loading' : 'empty')
  const letters = (initials || nameInitials(label || alt) || 'M').slice(0, 2)

  useEffect(() => {
    setState(resolved ? 'loading' : 'empty')
  }, [resolved])

  const failed = state === 'error' || state === 'empty'

  return (
    <span
      className={cx(
        'simg',
        !fill && ratio && `simg--ratio-${ratio}`,
        fill && 'simg--fill',
        zoom && 'simg--zoom',
        radius && `simg--r-${radius}`,
        className,
      )}
      {...rest}
    >
      {state === 'loading' && <span className="simg__shimmer" aria-hidden="true" />}
      {resolved && !failed && (
        <img
          className={cx('simg__el', state === 'ready' && 'simg__el--ready')}
          src={resolved}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={eager ? 'high' : undefined}
          referrerPolicy="no-referrer"
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          draggable="false"
        />
      )}
      {failed && (
        <span className="simg__fallback" role="img" aria-label={alt || 'No photograph'}>
          <span className="simg__initials" aria-hidden="true">{letters}</span>
          {alt && ratio !== '1x1' && !fill ? <span className="simg__caption">{alt}</span> : null}
        </span>
      )}
    </span>
  )
}

function ratioToNumber(ratio) {
  switch (ratio) {
    case '16x9':
      return 16 / 9
    case '4x3':
      return 4 / 3
    case '1x1':
      return 1
    case '21x9':
      return 21 / 9
    default:
      return 3 / 2
  }
}

/** Compact list/table photo — 40×40, rounded, initials if there is no file. */
export function Thumb({ photoId, src, name = '', alt = '', size = 40 }) {
  return (
    <SmartImage
      photoId={photoId}
      src={src}
      alt={alt}
      ratio="1x1"
      width={size * 2}
      radius="sm"
      label={name}
      className="simg--thumb"
      style={{ width: size, height: size }}
    />
  )
}
