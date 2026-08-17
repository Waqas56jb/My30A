import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { globalSearch } from '../../services/adminApi'
import { useOnEscape } from '../../hooks/useOnEscape'
import { cx } from '../../utils/format'

/**
 * One search box across every entity an operator looks people up by.
 *
 * Typing "Michael" should find the guest, the host and the partner — the whole
 * point is not having to guess which section a name lives in. Results are
 * grouped by kind and keyboard-navigable.
 */
export default function GlobalSearch({ className }) {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)

  useOnEscape(() => setOpen(false), open)

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([])
      setBusy(false)
      return undefined
    }
    setBusy(true)
    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const rows = await globalSearch(term)
        if (!cancelled) {
          setResults(rows)
          setCursor(0)
          setOpen(true)
        }
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setBusy(false)
      }
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [term])

  useEffect(() => {
    const onClickOutside = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const go = (item) => {
    setOpen(false)
    setTerm('')
    navigate(item.to)
  }

  const onKeyDown = (event) => {
    if (!open || !results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setCursor((c) => (c + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setCursor((c) => (c - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(results[cursor])
    }
  }

  return (
    <div className={cx('gsearch', className)} ref={boxRef}>
      <span className="gsearch__icon" aria-hidden="true">
        <Icon name="search" size={18} />
      </span>
      <input
        type="search"
        className="gsearch__input"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search guests, hosts, partners, orders…"
        aria-label="Search everything"
        autoComplete="off"
      />

      {open && (
        <div className="gsearch__panel" role="listbox" aria-label="Search results">
          {busy && <p className="gsearch__empty">Searching…</p>}

          {!busy && results.length === 0 && (
            <p className="gsearch__empty">
              Nothing matched “{term}”. Try a name, an email, or an order id like GR-1024.
            </p>
          )}

          {results.map((item, i) => (
            <button
              key={`${item.kind}-${item.id}`}
              type="button"
              role="option"
              aria-selected={i === cursor}
              className={cx('gsearch__row', i === cursor && 'is-active')}
              onMouseEnter={() => setCursor(i)}
              onClick={() => go(item)}
            >
              <span className="gsearch__row-icon" aria-hidden="true">
                <Icon name={item.icon} size={16} />
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="gsearch__title u-truncate">{item.title}</span>
                <span className="gsearch__sub u-truncate">{item.subtitle}</span>
              </span>
              <span className="gsearch__kind">{item.kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
