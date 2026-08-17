import { useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'
import { IconButton } from './Button'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useOnEscape } from '../../hooks/useOnEscape'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { cx } from '../../utils/format'

/** Centred dialog. Traps focus, locks scroll, closes on Escape/backdrop. */
export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide = false,
  closeLabel = 'Close',
}) {
  const ref = useRef(null)
  useLockBodyScroll(open)
  useOnEscape(onClose, open)
  useFocusTrap(ref, open)

  const onBackdrop = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose?.()
    },
    [onClose],
  )

  if (!open) return null

  return createPortal(
    <div className="overlay" onMouseDown={onBackdrop}>
      <div
        className={cx('modal', wide && 'modal--wide')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
      >
        <div className="modal__head">
          <div className="u-grow">
            {title && <h2 className="modal__title">{title}</h2>}
            {subtitle && <p className="modal__sub">{subtitle}</p>}
          </div>
          <IconButton icon="x" label={closeLabel} onClick={onClose} />
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/** Yes/no confirmation built on Modal. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={cx('btn', tone === 'danger' && 'btn--danger', loading && 'btn--loading')}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
            {loading && (
              <span className="btn__spinner">
                <span className="spinner" />
              </span>
            )}
          </button>
        </>
      }
    >
      <p className="u-small u-muted" style={{ lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  )
}

/** Bottom sheet on mobile, centred card from 720px up. */
export function BottomSheet({ open, onClose, title, children, action, closeLabel = 'Close' }) {
  const ref = useRef(null)
  useLockBodyScroll(open)
  useOnEscape(onClose, open)
  useFocusTrap(ref, open)

  const onBackdrop = useCallback(
    (event) => {
      if (event.target === event.currentTarget) onClose?.()
    },
    [onClose],
  )

  if (!open) return null

  return createPortal(
    <div className="sheet-overlay" onMouseDown={onBackdrop}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <span className="sheet__grip" aria-hidden="true" />
        <div className="sheet__head">
          {title && <h2 className="sheet__title">{title}</h2>}
          {action}
          <IconButton icon="x" label={closeLabel} onClick={onClose} />
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

/** Full-screen image viewer used by galleries. */
export function Lightbox({ open, images = [], index = 0, onClose, onIndexChange, alt = '' }) {
  const ref = useRef(null)
  useLockBodyScroll(open)
  useOnEscape(onClose, open)
  useFocusTrap(ref, open)

  if (!open || images.length === 0) return null
  const safeIndex = Math.max(0, Math.min(index, images.length - 1))

  const step = (delta) => {
    const next = (safeIndex + delta + images.length) % images.length
    onIndexChange?.(next)
  }

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" ref={ref}>
      <IconButton icon="x" label="Close photo viewer" className="lightbox__close" onClick={onClose} />
      {images.length > 1 && (
        <>
          <IconButton
            icon="chevronLeft"
            label="Previous photo"
            className="lightbox__nav lightbox__nav--prev"
            onClick={() => step(-1)}
          />
          <IconButton
            icon="chevronRight"
            label="Next photo"
            className="lightbox__nav lightbox__nav--next"
            onClick={() => step(1)}
          />
        </>
      )}
      <img className="lightbox__img" src={images[safeIndex]} alt={`${alt} — photo ${safeIndex + 1}`} />
      <span className="lightbox__count">
        {safeIndex + 1} / {images.length}
      </span>
    </div>,
    document.body,
  )
}

/** Toast stack, rendered once by the layout. */
export function Toaster({ toasts, onDismiss }) {
  if (!toasts?.length) return null
  return createPortal(
    <div className="toaster" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={cx('toast', `toast--${toast.tone ?? 'info'}`)}>
          <Icon
            name={toast.tone === 'success' ? 'checkCircle' : toast.tone === 'error' ? 'alert' : 'sparkles'}
            className="toast__icon"
          />
          <div className="toast__text">
            <div className="toast__title">{toast.title}</div>
            {toast.message && <div className="toast__msg">{toast.message}</div>}
          </div>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <Icon name="x" style={{ width: 14, height: 14 }} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
