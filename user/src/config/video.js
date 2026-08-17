/**
 * Landing page video.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  TO SWAP IN THE CLIENT'S OWN 30A DRONE FOOTAGE: change VIDEO_ID below.
 *  Both the hero background and the video section read from it, so one edit
 *  updates both players. Nothing else needs to change.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Both embeds disable captions (cc_load_policy=0) and annotations
 * (iv_load_policy=3), per the brief.
 */

export const VIDEO_ID = 'AXZeVvgD5ms'

/** Used as the iframe accessible name and the section heading. */
export const VIDEO_TITLE = '30A from the air'

/** Swap to 'https://www.youtube-nocookie.com/embed' for privacy-enhanced mode. */
const EMBED_BASE = 'https://www.youtube.com/embed'

/* Shared across both players: no captions, no annotations, no related videos
   from other channels, and inline playback so iOS does not go fullscreen. */
const SHARED_PARAMS = ['cc_load_policy=0', 'iv_load_policy=3', 'rel=0', 'modestbranding=1', 'playsinline=1']

/**
 * Hero background: autoplays muted, loops forever, no controls, no keyboard.
 * `loop=1` only works alongside `playlist=<same id>` — that is a YouTube quirk,
 * not a typo.
 */
export const heroEmbedUrl = (id = VIDEO_ID) =>
  `${EMBED_BASE}/${id}?${[
    'autoplay=1',
    'mute=1',
    'loop=1',
    `playlist=${id}`,
    'controls=0',
    'disablekb=1',
    'fs=0',
    ...SHARED_PARAMS,
  ].join('&')}`

/** Video section: full controls, sound available, nothing plays until asked. */
export const playerEmbedUrl = (id = VIDEO_ID) =>
  `${EMBED_BASE}/${id}?${['controls=1', ...SHARED_PARAMS].join('&')}`
