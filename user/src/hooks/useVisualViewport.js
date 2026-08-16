import { useEffect } from 'react'

/**
 * Keeps CSS in sync with the *visual* viewport.
 *
 * Mobile browsers shrink the visual viewport when the software keyboard opens
 * but leave the layout viewport (and therefore `100vh` and `position: fixed`)
 * unchanged — which is exactly how chat composers end up hidden behind the
 * keyboard. We publish three values instead:
 *
 *   --app-vh   height of the visible area
 *   --vv-top   how far the visual viewport has been pushed down/scrolled
 *   body.kb-open  set while a keyboard is judged to be open
 *
 * Falls back to window.innerHeight where visualViewport is unavailable.
 */
export function useVisualViewport() {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    const apply = () => {
      const height = vv?.height ?? window.innerHeight
      const offsetTop = vv?.offsetTop ?? 0
      root.style.setProperty('--app-vh', `${height}px`)
      root.style.setProperty('--vv-top', `${offsetTop}px`)

      // A drop of more than ~140px against the layout viewport means keyboard.
      const keyboardOpen = window.innerHeight - height > 140
      document.body.classList.toggle('kb-open', keyboardOpen)
      root.style.setProperty('--kb-inset', keyboardOpen ? `${window.innerHeight - height}px` : '0px')
    }

    apply()

    if (vv) {
      vv.addEventListener('resize', apply)
      vv.addEventListener('scroll', apply)
    }
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', apply)
        vv.removeEventListener('scroll', apply)
      }
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
      document.body.classList.remove('kb-open')
    }
  }, [])
}
