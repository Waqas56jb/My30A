import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { IconButton } from '../ui/Button'
import { NavBrand, NavTree, NavAccount } from './Sidebar'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useOnEscape } from '../../hooks/useOnEscape'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * Slide-in navigation for phones and tablets — the same tree the desktop rail
 * shows, so nothing is unreachable on a small screen. Closes on navigation, on
 * Escape and on a backdrop tap, and traps focus while open.
 */
export default function AdminDrawer({ open, onClose }) {
  const location = useLocation()
  const panelRef = useRef(null)

  useLockBodyScroll(open)
  useOnEscape(onClose, open)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search])

  if (!open) return null

  return createPortal(
    <div
      className="drawer-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="adrawer" role="dialog" aria-modal="true" aria-label="Menu" ref={panelRef}>
        <div className="adrawer__head">
          <NavBrand />
          <IconButton icon="x" label="Close menu" onClick={onClose} />
        </div>
        <div className="adrawer__scroll">
          <NavTree onNavigate={onClose} />
        </div>
        <NavAccount onNavigate={onClose} />
      </div>
    </div>,
    document.body,
  )
}
