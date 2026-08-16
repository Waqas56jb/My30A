/**
 * Verifies every photo id in the registry resolves on the Unsplash CDN.
 * A 404 here means a card would fall back to the branded placeholder.
 *
 *   node scripts/check-images.mjs
 */
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/assets/images.js', import.meta.url), 'utf8')
const entries = [...source.matchAll(/(\w+):\s*'(\d{10,}-[a-z0-9]+)'/g)].map((m) => [m[1], m[2]])

if (entries.length < 20) {
  console.error(`only parsed ${entries.length} photo ids - check the registry format`)
  process.exit(1)
}

const url = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=200&h=200&q=60`

const failures = []

// Small batches keep Windows/libuv happy and stay polite to the CDN.
for (let i = 0; i < entries.length; i += 8) {
  const batch = entries.slice(i, i + 8)
  // eslint-disable-next-line no-await-in-loop
  const results = await Promise.all(
    batch.map(async ([name, id]) => {
      try {
        const response = await fetch(url(id), { redirect: 'follow' })
        await response.arrayBuffer()
        const type = response.headers.get('content-type') ?? ''
        return { name, id, ok: response.ok && type.startsWith('image/'), detail: `${response.status} ${type}` }
      } catch (error) {
        return { name, id, ok: false, detail: error.message }
      }
    }),
  )
  for (const result of results) {
    if (!result.ok) failures.push(result)
  }
}

for (const failure of failures) {
  console.log(`  BAD  ${failure.name.padEnd(18)} photo-${failure.id}  (${failure.detail})`)
}

console.log(
  failures.length === 0
    ? `\nAll ${entries.length} images resolved.`
    : `\n${failures.length} of ${entries.length} images failed to resolve.`,
)
process.exitCode = failures.length === 0 ? 0 : 1
