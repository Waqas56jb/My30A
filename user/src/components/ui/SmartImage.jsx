import { useEffect, useState } from 'react'
import Icon from './Icon'
import { cx } from '../../utils/format'
import { img } from '../../assets/images'

/**
 * Every image in the app renders through here so that:
 *  - the aspect ratio is reserved before load (no layout shift),
 *  - a shimmer covers the gap while it downloads,
 *  - a failed remote URL degrades to a branded placeholder instead of a
 *    broken icon or a collapsed box,
 *  - alt text is mandatory in practice (decorative images pass alt="").
 *
 * `photoId` accepts an Unsplash id from the registry; `src` takes a full URL.
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
  ...rest
}) {
  const resolved = src ?? (photoId ? img(photoId, width, ratioToNumber(ratio)) : null)
  const [state, setState] = useState(resolved ? 'loading' : 'error')

  useEffect(() => {
    setState(resolved ? 'loading' : 'error')
  }, [resolved])

  return (
    <span
      className={cx(
        'simg',
        !fill && ratio && `simg--ratio-${ratio}`,
        fill && 'simg--fill',
        zoom && 'simg--zoom',
        className,
      )}
      {...rest}
    >
      {state === 'loading' && <span className="simg__shimmer" aria-hidden="true" />}
      {resolved && state !== 'error' && (
        <img
          className={cx('simg__el', state === 'ready' && 'simg__el--ready')}
          src={resolved}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchpriority={eager ? 'high' : undefined}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          draggable="false"
        />
      )}
      {state === 'error' && (
        <span className="simg__fallback" role="img" aria-label={alt || 'Image unavailable'}>
          <Icon name="image" />
          {alt ? <span>{alt}</span> : <span>My30A</span>}
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
