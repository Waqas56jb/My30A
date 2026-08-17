import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Small data-fetching primitive for the mock API.
 * Returns { data, error, loading, reload } and guards against setting state
 * after unmount or after a newer request has superseded this one.
 *
 * @param {() => Promise<any>} factory
 * @param {any[]} deps
 * @param {{skip?: boolean, initialData?: any}} [options]
 */
export function useAsync(factory, deps = [], options = {}) {
  const { skip = false, initialData = null } = options
  const [state, setState] = useState({
    data: initialData,
    error: null,
    loading: !skip,
  })

  const requestId = useRef(0)
  const mounted = useRef(true)
  const factoryRef = useRef(factory)
  factoryRef.current = factory

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const run = useCallback(async () => {
    const id = (requestId.current += 1)
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await factoryRef.current()
      if (!mounted.current || id !== requestId.current) return
      setState({ data, error: null, loading: false })
    } catch (error) {
      if (!mounted.current || id !== requestId.current) return
      setState({ data: null, error, loading: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (skip) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, skip])

  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) }
}
