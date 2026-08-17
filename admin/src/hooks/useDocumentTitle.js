import { useEffect } from 'react'

const SUFFIX = 'My30A Partners'

/** Sets document.title for a page and restores it on unmount. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} · ${SUFFIX}` : SUFFIX
    return () => {
      document.title = previous
    }
  }, [title])
}
