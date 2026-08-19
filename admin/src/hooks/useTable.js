import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * List-page plumbing: query state, debounced search, paging and reloading.
 *
 * Filters live in the URL so a queue can be linked to — the dashboard's
 * "12 partner applications awaiting approval" is just a link to
 * `/admin/partners?status=pending`, and the page arrives already filtered.
 * That is also what makes the browser back button behave.
 */
export function useTable(fetcher, { initial = {}, deps = [], pageSize = 25 } = {}) {
  const [params, setParams] = useSearchParams()

  const readParam = (key, fallback) => params.get(key) ?? fallback

  const [search, setSearch] = useState(() => readParam('search', initial.search ?? ''))
  const [debounced, setDebounced] = useState(search)
  const [page, setPage] = useState(() => Number(readParam('page', 1)) || 1)
  const [filters, setFilters] = useState(() => {
    const next = {}
    Object.entries(initial.filters ?? {}).forEach(([key, value]) => {
      next[key] = readParam(key, value)
    })
    return next
  })

  const [state, setState] = useState({ rows: [], total: 0, pages: 1, loading: true, error: null })
  const requestId = useRef(0)

  /* Typing should not fire a request per keystroke. */
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 220)
    return () => window.clearTimeout(timer)
  }, [search])

  /* Mirror state into the URL, dropping defaults so links stay readable. */
  useEffect(() => {
    const next = new URLSearchParams()
    if (debounced) next.set('search', debounced)
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') next.set(key, value)
    })
    if (page > 1) next.set('page', String(page))
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, filters, page])

  const load = useCallback(async () => {
    const id = requestId.current + 1
    requestId.current = id
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const result = await fetcher({ search: debounced, page, pageSize, ...filters })
      if (requestId.current !== id) return // a newer request has already landed
      const rows = Array.isArray(result?.rows) ? result.rows : Array.isArray(result) ? result : []
      setState({
        rows,
        total: result?.total ?? rows.length,
        pages: result?.pages ?? 1,
        loading: false,
        error: null,
      })
    } catch (error) {
      if (requestId.current !== id) return
      setState({ rows: [], total: 0, pages: 1, loading: false, error })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, page, pageSize, JSON.stringify(filters), ...deps])

  useEffect(() => {
    load()
  }, [load])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // a narrower list makes page 7 meaningless
  }, [])

  return {
    ...state,
    search,
    setSearch: (value) => {
      setSearch(value)
      setPage(1)
    },
    filters,
    setFilter,
    page,
    setPage,
    pageSize,
    reload: load,
  }
}

/** One-shot loader for detail pages and dashboards. */
export function useLoad(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const alive = useRef(true)

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fetcher()
      if (alive.current) setState({ data, loading: false, error: null })
    } catch (error) {
      if (alive.current) setState({ data: null, loading: false, error })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    alive.current = true
    load()
    return () => {
      alive.current = false
    }
  }, [load])

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) }
}
