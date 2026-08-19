import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import Icon from '../ui/Icon'
import { IconButton } from '../ui/Button'
import { useInbox } from '../../hooks/useInbox'
import { useOnEscape } from '../../hooks/useOnEscape'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useAdmin } from '../../context/AdminContext'
import { formatRelative, cx } from '../../utils/format'
import { unlockNotificationSound } from '../../utils/notifySound'

/**
 * Header inbox. Desktop: dropdown under the bell. Phone: bottom sheet.
 * A new row also pops a short card and plays a chime.
 */
export default function NotificationBell() {
  const navigate = useNavigate()
  const { attention } = useAdmin()
  const { items, unread, loading, arriving, dismissArriving, markRead, markAllRead } = useInbox()
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 56, right: 16 })
  const wrapRef = useRef(null)
  const isPhone = useMediaQuery('(max-width: 640px)')

  useOnEscape(() => {
    setOpen(false)
    dismissArriving()
  }, open || !!arriving)
  useLockBodyScroll(open && isPhone)

  useEffect(() => {
    const place = () => {
      const node = wrapRef.current
      if (!node) return
      const box = node.getBoundingClientRect()
      setCoords({
        top: Math.round(box.bottom + 8),
        right: Math.round(Math.max(12, window.innerWidth - box.right)),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, arriving])

  useEffect(() => {
    const onClick = (event) => {
      if (wrapRef.current?.contains(event.target)) return
      if (event.target.closest?.('.nbell__panel, .nbell__toast')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const openItem = (item) => {
    if (!item.read) markRead(item.id)
    setOpen(false)
    dismissArriving()
    if (item.link) navigate(item.link)
  }

  const overlay = typeof document !== 'undefined' ? document.body : null

  return (
    <div className={cx('nbell', open && 'nbell--open')} ref={wrapRef}>
      <IconButton
        icon="bell"
        label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
        className={cx('atopbar__alerts', unread > 0 && 'nbell__btn--live')}
        badge={unread}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          unlockNotificationSound()
          import('../../services/pushClient').then(({ enablePush }) => enablePush().catch(() => {}))
          setOpen((value) => !value)
          dismissArriving()
        }}
      />

      {overlay &&
        arriving &&
        !open &&
        createPortal(
          <button
            type="button"
            className="nbell__toast"
            style={!isPhone ? { top: coords.top, right: coords.right } : undefined}
            onClick={() => openItem(arriving)}
          >
            <span className="nbell__toast-icon" aria-hidden="true">
              <Icon name={arriving.icon ?? 'bell'} size={16} />
            </span>
            <span className="nbell__toast-copy">
              <span className="nbell__toast-title">{arriving.title}</span>
              <span className="nbell__toast-body">{arriving.message}</span>
            </span>
          </button>,
          overlay,
        )}

      {overlay &&
        open &&
        createPortal(
          <>
            {isPhone && (
              <button
                type="button"
                className="nbell__scrim"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
              />
            )}
            <div
              className="nbell__panel"
              role="dialog"
              aria-label="Notifications"
              style={!isPhone ? { top: coords.top, right: coords.right } : undefined}
            >
              <div className="nbell__head">
                <div>
                  <p className="nbell__kicker">Inbox</p>
                  <h2 className="nbell__title">Notifications</h2>
                </div>
                <div className="nbell__head-actions">
                  {unread > 0 && (
                    <button type="button" className="nbell__textbtn" onClick={markAllRead}>
                      Mark all read
                    </button>
                  )}
                  <IconButton icon="x" label="Close notifications" onClick={() => setOpen(false)} />
                </div>
              </div>

              <div className="nbell__body">
                {loading && items.length === 0 && (
                  <p className="nbell__empty">Checking for updates…</p>
                )}

                {!loading && items.length === 0 && attention.length === 0 && (
                  <div className="nbell__empty">
                    <Icon name="checkCircle" size={22} />
                    <p>You’re all caught up</p>
                  </div>
                )}

                {items.length > 0 && (
                  <ul className="nbell__list">
                    {items.slice(0, 12).map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={cx('nbell__row', !item.read && 'nbell__row--unread')}
                          onClick={() => openItem(item)}
                        >
                          <span className="nbell__icon" aria-hidden="true">
                            <Icon name={item.icon ?? 'bell'} size={15} />
                          </span>
                          <span className="nbell__copy">
                            <span className="nbell__row-title">{item.title}</span>
                            {item.message ? <span className="nbell__row-body">{item.message}</span> : null}
                            <span className="nbell__row-meta">{formatRelative(item.createdAt)}</span>
                          </span>
                          {!item.read && <span className="nbell__dot" aria-hidden="true" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {attention.length > 0 && (
                  <div className="nbell__queue">
                    <p className="nbell__kicker">Needs attention</p>
                    <ul className="nbell__list">
                      {attention.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="nbell__row"
                            onClick={() => {
                              setOpen(false)
                              navigate(item.to)
                            }}
                          >
                            <span className="nbell__icon" aria-hidden="true">
                              <Icon name="alert" size={15} />
                            </span>
                            <span className="nbell__copy">
                              <span className="nbell__row-title">{item.label}</span>
                              <span className="nbell__row-meta">{item.count} waiting</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </>,
          overlay,
        )}
    </div>
  )
}
