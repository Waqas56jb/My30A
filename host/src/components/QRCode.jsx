/**
 * Placeholder QR renderer.
 *
 * This draws a deterministic, QR-shaped pattern from the link (finder squares,
 * timing rows, hashed payload) so the guest-access screen looks and behaves
 * like the real thing — the same link always produces the same image, and it
 * changes when the link is regenerated.
 *
 * It is NOT a scannable code: real encoding needs Reed-Solomon error
 * correction, which belongs on the backend when guest access is issued. The
 * UI says so wherever this is shown, so nobody demos it expecting a scan.
 */

const MODULES = 25

/** Small, stable string hash — no crypto needed for a visual placeholder. */
function hash(value) {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function isFinder(row, col) {
  const inBox = (r0, c0) => row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7
  return inBox(0, 0) || inBox(0, MODULES - 7) || inBox(MODULES - 7, 0)
}

function finderFilled(row, col) {
  const local = (r0, c0) => {
    const r = row - r0
    const c = col - c0
    const edge = r === 0 || r === 6 || c === 0 || c === 6
    const core = r >= 2 && r <= 4 && c >= 2 && c <= 4
    return edge || core
  }
  if (row < 7 && col < 7) return local(0, 0)
  if (row < 7 && col >= MODULES - 7) return local(0, MODULES - 7)
  if (row >= MODULES - 7 && col < 7) return local(MODULES - 7, 0)
  return false
}

export default function QRCode({ value = '', size = 200, title = 'Guest access code' }) {
  const seed = hash(value || 'my30a')
  const cells = []

  for (let row = 0; row < MODULES; row += 1) {
    for (let col = 0; col < MODULES; col += 1) {
      let filled

      if (isFinder(row, col)) {
        filled = finderFilled(row, col)
      } else if (row === 6 || col === 6) {
        filled = (row + col) % 2 === 0 // timing pattern
      } else if (row >= MODULES - 9 && row < MODULES - 4 && col >= MODULES - 9 && col < MODULES - 4) {
        const r = row - (MODULES - 9)
        const c = col - (MODULES - 9)
        filled = r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2) // alignment
      } else {
        // Deterministic pseudo-random payload derived from the link.
        const mixed = Math.imul(seed ^ (row * 73856093) ^ (col * 19349663), 2654435761) >>> 0
        filled = (mixed & 0xff) > 118
      }

      if (filled) cells.push(`M${col},${row}h1v1h-1z`)
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${MODULES} ${MODULES}`}
      role="img"
      aria-label={`${title} for ${value}`}
    >
      <rect width={MODULES} height={MODULES} fill="#fff" />
      <path d={cells.join('')} fill="#12363a" />
    </svg>
  )
}
