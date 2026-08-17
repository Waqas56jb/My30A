import { useState } from 'react'
import { hero as heroImage } from '../assets/images'
import { heroEmbedUrl, playerEmbedUrl, VIDEO_TITLE } from '../config/video'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import { cx } from '../utils/format'

/**
 * Silent, looping video behind the hero.
 *
 * The still photograph is painted first and stays underneath, so the headline
 * is legible from the first frame and nothing breaks if the embed is blocked,
 * fails, or the visitor is on a connection where it never arrives. The iframe
 * fades in only once YouTube reports it has loaded.
 *
 * Anyone who has asked their system for reduced motion gets the photograph
 * alone — a looping video is exactly the kind of thing that setting is for.
 */
export function HeroVideo({ posterId, title = VIDEO_TITLE, className }) {
  const reducedMotion = usePrefersReducedMotion()
  const [ready, setReady] = useState(false)

  return (
    <div className={cx('video-bg', ready && 'video-bg--ready', className)} aria-hidden="true">
      {posterId && <img className="video-bg__poster" src={heroImage(posterId)} alt="" />}

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
