import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/** Swap a UUID in the address bar for the public slug once the record loads. */
export function useCanonicalSlug(param, slug, basePath) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!slug || !param || param === slug) return
    navigate(`${basePath}/${slug}${location.search}`, { replace: true })
  }, [param, slug, basePath, navigate, location.search])
}
