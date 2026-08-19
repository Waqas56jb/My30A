import { useState } from 'react'
import Button from '../ui/Button'

export default function ShareActions({
  title,
  text,
  url,
  imageSrc,
  shareLabel,
  shareWhatsApp,
  shareEmail,
  shareNative,
  shareCopied,
}) {
  const [copied, setCopied] = useState(false)
  const message = `${text} ${url}`.trim()

  const shareNativeAction = async () => {
    try {
      if (imageSrc && navigator.canShare) {
        const response = await fetch(imageSrc)
        const blob = await response.blob()
        const file = new File([blob], 'my30a-flyer.png', { type: blob.type || 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text, url })
          return
        }
      }
      if (navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
    } catch {
      /* user cancelled or share failed — fall through to copy */
    }
    await navigator.clipboard?.writeText(message)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flyer-share">
      <Button className="flyer-share__primary" icon="share" onClick={shareNativeAction}>
        {copied ? shareCopied : shareLabel}
      </Button>
      <Button
        variant="ghost"
        className="flyer-share__link"
        icon="message"
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer"
      >
        {shareWhatsApp}
      </Button>
      <Button
        variant="ghost"
        className="flyer-share__link"
        icon="mail"
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}`}
      >
        {shareEmail}
      </Button>
      {typeof navigator !== 'undefined' && navigator.share ? (
        <span className="sr-only">{shareNative}</span>
      ) : null}
    </div>
  )
}
