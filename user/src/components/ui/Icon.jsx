/**
 * Inline icon set. Bundling the paths avoids an icon-font dependency, keeps
 * every glyph on the same 24px stroke grid, and lets icons inherit colour.
 */

const P = {
  home: (
    <>
      <path d="m3 10.5 9-7.5 9 7.5" />
      <path d="M5 9.3V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.3" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.2 13.7 8l4.8 1.7-4.8 1.8L12 16.3l-1.7-4.8L5.5 9.7 10.3 8z" />
      <path d="m18.5 15 .7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.6 8.4-2.1 5.1-5.1 2.1 2.1-5.1z" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
      <path d="M13.7 20.5a2 2 0 0 1-3.4 0" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </>
  ),
  arrowUpRight: (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronUp: <path d="m18 15-6-6-6 6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m20 6-11 11-5-5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  star: (
    <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.8l6.5-.9z" />
  ),
  heart: (
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5C2 10.8 3.5 12.5 5 14l7 7z" />
  ),
  mapPin: (
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  navigation: <path d="m3 11 19-9-9 19-2-8z" />,
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  externalLink: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.2 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="16.5" rx="2" />
      <path d="M8 2.5v4M16 2.5v4M3 10h18" />
    </>
  ),
  wifi: (
    <>
      <path d="M2.5 9.2a15 15 0 0 1 19 0" />
      <path d="M5.5 12.7a10 10 0 0 1 13 0" />
      <path d="M8.6 16.2a5 5 0 0 1 6.8 0" />
      <path d="M12 19.8h.01" />
    </>
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="m10.8 12.2 8.7-8.7" />
      <path d="m17 6 2.5 2.5M20.5 2.5 22 4l-2 2" />
    </>
  ),
  car: (
    <>
      <path d="m3.5 13 1.9-5.3A2 2 0 0 1 7.3 6.4h9.4a2 2 0 0 1 1.9 1.3L20.5 13" />
      <path d="M3.5 13h17v4.6a.9.9 0 0 1-.9.9h-1.7a.9.9 0 0 1-.9-.9V17H7v.6a.9.9 0 0 1-.9.9H4.4a.9.9 0 0 1-.9-.9z" />
      <path d="M7 15.3h.01M17 15.3h.01" />
    </>
  ),
  bag: (
    <>
      <path d="M5.6 8h12.8l1 12.2a.8.8 0 0 1-.8.8H5.4a.8.8 0 0 1-.8-.8z" />
      <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
    </>
  ),
  utensils: (
    <>
      <path d="M5 3v5.5a2.2 2.2 0 0 0 4.4 0V3" />
      <path d="M7.2 10.7V21" />
      <path d="M15.5 21V3c2.6 1.1 4 3.6 4 6.6s-1.4 5.4-4 5.4" />
    </>
  ),
  umbrella: (
    <>
      <path d="M12 12.5V19a2.2 2.2 0 0 0 4.4 0" />
      <path d="M2.5 12.5a9.5 9.5 0 0 1 19 0z" />
      <path d="M12 3v-.8" />
    </>
  ),
  bike: (
    <>
      <circle cx="5.8" cy="17.2" r="3.4" />
      <circle cx="18.2" cy="17.2" r="3.4" />
      <path d="m6.2 17.2 4.6-9.2h3.7l3.5 9.2" />
      <path d="M9.6 8h5.4M14.5 8l1.8-3h2.4" />
    </>
  ),
  boat: (
    <>
      <path d="M3.5 18c1.7 0 2.3-1.2 4.2-1.2S10.3 18 12 18s2.3-1.2 4.2-1.2S18.8 18 20.5 18" />
      <path d="m5.2 14 1.2-5.2A1 1 0 0 1 7.4 8h9.2a1 1 0 0 1 1 .8l1.2 5.2" />
      <path d="M12 8V4M9 4h6" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h11.5l-1.7 3.5L16.5 11H5" />
    </>
  ),
  camera: (
    <>
      <path d="M3 9.5a1.5 1.5 0 0 1 1.5-1.5h2.2l1.4-2.2h7.8L17.3 8h2.2A1.5 1.5 0 0 1 21 9.5v8.6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.1z" />
      <circle cx="12" cy="13.4" r="3.4" />
    </>
  ),
  flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
      <path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 10.5h.01M14.5 10.5h.01" />
      <path d="M9.6 15.2a3.4 3.4 0 0 0 4.8 0" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h5M14 7h6M4 17h9M18 17h2" />
      <circle cx="11.5" cy="7" r="2.2" />
      <circle cx="15.5" cy="17" r="2.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11.2V16M12 8.2h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  creditCard: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.2" />
      <path d="M2.5 10h19M6 15h3" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16.5V4M8 7.5 12 3.5l4 4" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2.2" />
      <circle cx="8.7" cy="8.7" r="1.6" />
      <path d="m21 15.5-5-5L5.5 21" />
    </>
  ),
  paperclip: (
    <path d="M21.4 11.05 12.25 20.2a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="11.5" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2M8.6 21.2h6.8" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7.5 20-3.6-8.9L2 9.5z" />
      <path d="M22 2 10.9 13.1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2 12h2.2M19.8 12H22M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </>
  ),
  waves: (
    <>
      <path d="M2 7.5c2 0 2 1.7 4 1.7s2-1.7 4-1.7 2 1.7 4 1.7 2-1.7 4-1.7 2 1.7 4 1.7" />
      <path d="M2 13c2 0 2 1.7 4 1.7s2-1.7 4-1.7 2 1.7 4 1.7 2-1.7 4-1.7 2 1.7 4 1.7" />
      <path d="M2 18.5c2 0 2 1.7 4 1.7s2-1.7 4-1.7 2 1.7 4 1.7 2-1.7 4-1.7 2 1.7 4 1.7" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  map: (
    <>
      <path d="m3 6.5 6-3 6 3 6-3v14l-6 3-6-3-6 3z" />
      <path d="M9 3.5v14M15 6.5v14" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12.5" height="12.5" rx="2" />
      <path d="M5.5 15h-1a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2v1" />
    </>
  ),
  shield: <path d="M12 21.5s8-3.8 8-9.5V5.2L12 2.3 4 5.2V12c0 5.7 8 9.5 8 9.5Z" />,
  gift: (
    <>
      <rect x="3" y="8" width="18" height="4.2" rx="1" />
      <path d="M12 8v13M19.5 12.2V19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-6.8" />
      <path d="M7.8 8a2.4 2.4 0 0 1 0-4.8C11.2 3.2 12 8 12 8s.8-4.8 4.2-4.8a2.4 2.4 0 0 1 0 4.8" />
    </>
  ),
  message: (
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
  ),
  trash: (
    <>
      <path d="M3.5 6h17M9 6V3.8h6V6" />
      <path d="m6 6 1 14.2h10L18 6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 3.5v5h-5" />
    </>
  ),
  filter: <path d="M4 5h16l-6.2 7.2V19l-3.6 2v-8.8z" />,
  ticket: (
    <>
      <path d="M3 9.2V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3.2a2.6 2.6 0 0 0 0 5.6V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3.2a2.6 2.6 0 0 0 0-5.6Z" />
      <path d="M13.5 5v2M13.5 11v2M13.5 17v2" />
    </>
  ),
  suitcase: (
    <>
      <rect x="3" y="7" width="18" height="13.5" rx="2" />
      <path d="M8.5 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 12.5h18" />
    </>
  ),
  wind: (
    <path d="M12.8 4.5A2 2 0 1 1 14 8H2M15.8 19.5A2 2 0 1 0 17 16H2M18.5 7.5A2.5 2.5 0 1 1 21 11H2" />
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7.5 18.5l-4 1 1-4Z" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 16.5 4.5-4.5L16 7.5M20.5 12H9.5" />
    </>
  ),
  dollar: <path d="M12 2v20M17 5.5H9.8a3.3 3.3 0 0 0 0 6.5h4.4a3.3 3.3 0 0 1 0 6.5H6" />,
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  circle: <circle cx="12" cy="12" r="4.5" />,
  play: <path d="M6 3.5 20 12 6 20.5z" />,
  building: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 7.5h.01M15 7.5h.01M9 12h.01M15 12h.01M10 21v-4h4v4" />
    </>
  ),
}

export const ICON_NAMES = Object.keys(P)

/**
 * Icons always emit width/height *attributes* so a glyph placed somewhere
 * without a sizing rule renders at 20px instead of expanding to fill its
 * container. CSS rules (`.btn svg`, `.tabbar__item svg`, …) and the `size`
 * prop both still win, because CSS and inline styles beat SVG attributes.
 */
const DEFAULT_SIZE = 20

export default function Icon({ name, size, className = '', strokeWidth = 1.7, ...rest }) {
  const glyph = P[name] ?? P.circle
  const dimension = size ? { width: size, height: size } : undefined
  return (
    <svg
      viewBox="0 0 24 24"
      width={size ?? DEFAULT_SIZE}
      height={size ?? DEFAULT_SIZE}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={dimension}
      {...rest}
    >
      {glyph}
    </svg>
  )
}

/** Filled variant — used for the rating stars and favourite hearts. */
export function IconSolid({ name, size, className = '', ...rest }) {
  const glyph = P[name] ?? P.circle
  const dimension = size ? { width: size, height: size } : undefined
  return (
    <svg
      viewBox="0 0 24 24"
      width={size ?? DEFAULT_SIZE}
      height={size ?? DEFAULT_SIZE}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={dimension}
      {...rest}
    >
      {glyph}
    </svg>
  )
}
