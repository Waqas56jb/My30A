/**
 * Minimal browser environment for the test harness.
 *
 * This MUST run before react-dom is evaluated, otherwise React decides it is
 * in a non-DOM environment and never attaches its delegated event listeners
 * (which makes every simulated click and keystroke silently do nothing).
 * It is therefore loaded with Node's --import preload rather than imported
 * from the bundle:
 *
 *   node --import ./scripts/setup-dom.js .smoke/flows.js
 *
 * SMOKE_VIEWPORT=desktop makes matchMedia report the desktop breakpoints, so
 * the same routes can be exercised in both the mobile and desktop layouts.
 */
import { JSDOM } from 'jsdom'

const isDesktop = process.env.SMOKE_VIEWPORT === 'desktop'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})

const { window } = dom

const define = (key, value) =>
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })

define('window', window)
define('document', window.document)
define('navigator', window.navigator)

for (const key of [
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'SVGElement',
  'Element',
  'Node',
  'Event',
  'CustomEvent',
  'KeyboardEvent',
  'MouseEvent',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'localStorage',
  'sessionStorage',
  'DOMParser',
  'MutationObserver',
]) {
  if (window[key] !== undefined) define(key, window[key])
}

// jsdom ships no matchMedia; the app relies on it for responsive behaviour.
const matchMedia = (query) => {
  const min = /min-width:\s*(\d+)px/.exec(query)
  const width = isDesktop ? 1440 : 390
  const matches = min ? width >= Number(min[1]) : false
  return {
    media: query,
    matches,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false
    },
  }
}

window.matchMedia = matchMedia
define('matchMedia', matchMedia)

window.scrollTo = () => {}
window.HTMLElement.prototype.scrollIntoView = () => {}
window.URL.createObjectURL = () => 'blob:mock'
window.URL.revokeObjectURL = () => {}

// React 18 needs this to allow act() outside a test runner.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

define('__SMOKE_VIEWPORT__', isDesktop ? 'desktop' : 'mobile')
