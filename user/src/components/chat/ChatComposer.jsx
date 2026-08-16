import { useEffect, useRef, useState } from 'react'
import Icon from '../ui/Icon'
import { cx } from '../../utils/format'

const MAX_HEIGHT = 132

/**
 * Message composer.
 *
 * Mobile specifics that matter:
 *  - font-size is 16px so iOS never zooms the viewport on focus,
 *  - the textarea grows to a cap and then scrolls internally,
 *  - the whole bar lives inside the visual-viewport-pinned chat screen, so
 *    it stays above the keyboard rather than behind it,
 *  - Enter sends, Shift+Enter inserts a newline.
 */
export default function ChatComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask Vitoria anything…',
  attachment,
  onAttach,
  onRemoveAttachment,
}) {
  const textareaRef = useRef(null)
  const fileRef = useRef(null)
  const [recording, setRecording] = useState(false)

  // Auto-size the textarea to its content, capped.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const canSend = (value.trim().length > 0 || !!attachment) && !disabled

  const submit = () => {
    if (!canSend) return
    onSend()
    const el = textareaRef.current
    if (el) el.style.height = 'auto'
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const pickFile = (event) => {
    const file = event.target.files?.[0]
    if (file) onAttach?.({ name: file.name, size: file.size, type: file.type })
    event.target.value = ''
  }

  return (
    <div className="composer">
      {attachment && (
        <div className="attach-row">
          <span className="attach-pill">
            <Icon name="paperclip" style={{ width: 13, height: 13 }} />
            <span>{attachment.name}</span>
            <button
              type="button"
              className="composer__tool"
              style={{ width: 24, height: 24 }}
              onClick={onRemoveAttachment}
              aria-label={`Remove attachment ${attachment.name}`}
            >
              <Icon name="x" style={{ width: 13, height: 13 }} />
            </button>
          </span>
        </div>
      )}

      <div className="composer__inner">
        <button
          type="button"
          className="composer__tool"
          onClick={() => fileRef.current?.click()}
          aria-label="Attach a photo or list"
        >
          <Icon name="paperclip" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.pdf,.txt"
          className="sr-only"
          onChange={pickFile}
          tabIndex={-1}
        />

        <label htmlFor="vitoria-composer" className="sr-only">
          Message Vitoria
        </label>
        <textarea
          id="vitoria-composer"
          ref={textareaRef}
          className="composer__textarea"
          value={value}
          rows={1}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          enterKeyHint="send"
          autoComplete="off"
          autoCorrect="on"
          spellCheck="true"
        />

        <button
          type="button"
          className={cx('composer__tool', recording && 'composer__tool--rec')}
          onClick={() => setRecording((r) => !r)}
          aria-pressed={recording}
          aria-label={recording ? 'Stop voice input' : 'Start voice input'}
        >
          <Icon name="mic" />
        </button>

        <button
          type="button"
          className="composer__send"
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
        >
          <Icon name="send" />
        </button>
      </div>

      <p className="composer__hint">
        Vitoria is an AI concierge. Press <kbd>Enter</kbd> to send, <kbd>Shift</kbd> +{' '}
        <kbd>Enter</kbd> for a new line.
      </p>
    </div>
  )
}

/** Horizontally scrolling suggestion chips above the composer. */
export function SuggestedPrompts({ prompts, onSelect, label = 'Suggested questions' }) {
  if (!prompts?.length) return null
  return (
    <div className="prompts" role="group" aria-label={label}>
      {prompts.map((prompt) => (
        <button
          key={prompt.id ?? prompt.text ?? prompt}
          type="button"
          className="prompt-chip"
          onClick={() => onSelect(prompt.text ?? prompt)}
        >
          {prompt.icon && <Icon name={prompt.icon} />}
          {prompt.text ?? prompt}
        </button>
      ))}
    </div>
  )
}
