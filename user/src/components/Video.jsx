import { useState } from 'react'
import { hero as heroImage } from '../assets/images'
import { heroEmbedUrl, playerEmbedUrl, VIDEO_TITLE } from '../config/video'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { cx } from '../utils/format'

/**
 * Silent, looping video behind the hero.
 *
 * No still poster on the public landing — the iframe autoplays immediately so
 * visitors never see a freeze-frame, then a cut. YouTube's title overlay is
 * cropped by scaling the iframe past the hero edges. Reduced-motion visitors
 * get a dark field instead of a looping clip.
 */
export function HeroVideo({ posterId, title = VIDEO_TITLE, className }) {
  const reducedMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)

  return (
    <div className={cx('video-bg', (ready || !reducedMotion) && 'video-bg--ready', className)} aria-hidden="true">
      {reducedMotion && posterId ? (
        <img className="video-bg__poster" src={heroImage(posterId)} alt="" />
      ) : null}

      {!reducedMotion && (
        <iframe
          className="video-bg__frame"
          src={heroEmbedUrl()}
          title={title}
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen={false}
          frameBorder="0"
          onLoad={() => setReady(true)}
        />
      )}
    </div>
  )
}

/**
 * The watchable player further down the page: real controls, sound, and
 * nothing loads until the visitor scrolls near it.
 */
export function VideoPlayer({ title = VIDEO_TITLE, className }) {
  return (
    <div className={cx('video-frame', className)}>
      <iframe
        src={playerEmbedUrl()}
        title={title}
        loading="lazy"
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        frameBorder="0"
      />
    </div>
  )
}
