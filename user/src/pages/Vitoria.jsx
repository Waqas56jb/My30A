import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ChatBubble, { TypingIndicator, DateSeparator } from '../components/chat/ChatBubble'
import ChatComposer, { SuggestedPrompts } from '../components/chat/ChatComposer'
import Icon from '../components/ui/Icon'
import { IconButton } from '../components/ui/Button'
import { Avatar } from '../components/ui/Display'
import { ErrorState } from '../components/ui/States'
import { SkeletonList } from '../components/ui/Skeleton'
import { ConfirmModal } from '../components/ui/Modal'
import { useApp } from '../context/AppContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAsync } from '../hooks/useAsync'
import * as api from '../services/mockApi'
import { sendMessage, createUserMessage, greetingFor } from '../services/vitoriaService'
import { track, ANALYTICS_EVENTS } from '../services/analytics'
import { suggestedPrompts } from '../data/mockMessages'
import { mockLocalConditions } from '../data/mockRecommendations'
import { formatDayLabel, formatDateRange } from '../utils/format'

/**
 * The concierge conversation.
 *
 * Layout notes: the screen is pinned to the visual viewport (see
 * `useVisualViewport`), so the composer sits directly above the software
 * keyboard on iOS and Android, the thread stays scrollable, and no content
 * disappears behind the keyboard or the tab bar.
 */
export default function Vitoria() {
  const { guest, property, pushToast } = useApp()
  useDocumentTitle('Vitoria')

  const seed = useAsync(() => api.getMessages(), [])
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [attachment, setAttachment] = useState(null)
  const [typing, setTyping] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)

  const scrollRef = useRef(null)
  const endRef = useRef(null)
  const seededPrompt = useRef(false)

  const location = useLocation()
  const navigate = useNavigate()

  // Seed the thread once, when the stored conversation resolves. Guarded so a
  // later context update (e.g. saving a preference) can never wipe live messages.
  const seeded = useRef(false)
  useEffect(() => {
    if (!seed.data || seeded.current) return
    seeded.current = true
    if (seed.data.length > 0) {
      setMessages(seed.data)
    } else {
      const opener = greetingFor(guest, property)
      setMessages([opener])
      api.appendMessage(opener)
    }
  }, [seed.data, guest, property])

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    endRef.current?.scrollIntoView({ behavior, block: 'end' })
  }, [])

  useEffect(() => {
    if (atBottom) scrollToBottom(messages.length > 6 ? 'smooth' : 'auto')
  }, [messages, typing, atBottom, scrollToBottom])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(distance < 80)
  }

  const send = useCallback(
    async (text) => {
      const body = (text ?? draft).trim()
      if (!body && !attachment) return

      const userMessage = createUserMessage(
        attachment ? `${body}${body ? '\n\n' : ''}📎 ${attachment.name}` : body,
      )
      setMessages((list) => [...list, userMessage])
      api.appendMessage(userMessage)
      setDraft('')
      setAttachment(null)
      setAtBottom(true)

      try {
        const reply = await sendMessage(body || 'I sent you a grocery list photo', { guest, property }, {
          onTyping: setTyping,
        })
        setMessages((list) => [...list, reply])
        api.appendMessage(reply)
      } catch {
        setTyping(false)
        pushToast({
          tone: 'error',
          title: 'Message not delivered',
          message: 'Vitoria is offline for a moment. Try again shortly.',
        })
      }
    },
    [draft, attachment, guest, property, pushToast],
  )

  // A partner page can hand Vitoria an opening question via router state.
  useEffect(() => {
    const prompt = location.state?.prompt
    if (!prompt || seededPrompt.current || messages.length === 0) return
    seededPrompt.current = true
    navigate('.', { replace: true, state: null })
    send(prompt)
  }, [location.state, messages.length, send, navigate])

  const onPrompt = (text) => {
    track(ANALYTICS_EVENTS.VITORIA_SUGGESTION_CLICKED, { prompt: text })
    send(text)
  }

  const clearThread = () => {
    api.clearMessages()
    const opener = greetingFor(guest, property)
    api.appendMessage(opener)
    setMessages([opener])
    setConfirmClear(false)
    pushToast({ tone: 'success', title: 'Conversation cleared' })
  }

  // Group messages so a date separator only appears when the day changes.
  const rows = useMemo(() => {
    const output = []
    let lastDay = null
    let lastRole = null
    messages.forEach((message) => {
      const day = formatDayLabel(message.at)
      if (day !== lastDay) {
        output.push({ type: 'date', id: `date-${day}-${message.id}`, label: day })
        lastDay = day
        lastRole = null
      }
      output.push({
        type: 'message',
        id: message.id,
        message,
        showAvatar: message.role !== lastRole,
      })
      lastRole = message.role
    })
    return output
  }, [messages])

  return (
    <div className="chat-wrap">
      <div className="chat-screen">
        {/* ------------------------- Header ------------------------- */}
        <header className="chat-head">
          <Link to="/discover" aria-label="Back to home" className="icon-btn" style={{ marginLeft: -6 }}>
            <Icon name="arrowLeft" />
          </Link>
          <Avatar size="md" vitoria />
          <div className="chat-head__text">
            <div className="chat-head__name">Vitoria</div>
            <div className="chat-head__status">
              <span className="chat-head__pulse" aria-hidden="true" />
              Your 30A local concierge · online
            </div>
          </div>
          <IconButton icon="trash" label="Clear conversation" onClick={() => setConfirmClear(true)} />
        </header>

        {/* ------------------------- Thread ------------------------- */}
        <div className="chat-body">
          <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
            <div className="chat-thread">
              {seed.loading && <SkeletonList count={3} />}
              {seed.error && <ErrorState error={seed.error} onRetry={seed.reload} />}

              {!seed.loading &&
                rows.map((row) =>
                  row.type === 'date' ? (
                    <DateSeparator key={row.id} label={row.label} />
                  ) : (
                    <ChatBubble
                      key={row.id}
                      message={row.message}
                      guest={guest}
                      showAvatar={row.showAvatar}
                    />
                  ),
                )}

              {typing && <TypingIndicator />}
              <div ref={endRef} style={{ height: 4 }} />
            </div>
          </div>

          {!atBottom && (
            <button type="button" className="chat-jump" onClick={() => scrollToBottom()}>
              <Icon name="chevronDown" style={{ width: 14, height: 14 }} />
              Latest
            </button>
          )}
        </div>

        {/* ------------------- Prompts + composer ------------------- */}
        <SuggestedPrompts prompts={suggestedPrompts} onSelect={onPrompt} />
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={() => send()}
          attachment={attachment}
          onAttach={setAttachment}
          onRemoveAttachment={() => setAttachment(null)}
        />
      </div>

      {/* --------------------- Wide-screen rail --------------------- */}
      <aside className="chat-wrap__rail" aria-label="Conversation context">
        <div className="rail-card">
          <span className="rail-card__title">Vitoria knows</span>
          <div className="u-small" style={{ fontWeight: 600 }}>
            {property?.name}
          </div>
          <div className="u-xs u-muted">
            {guest?.stay && formatDateRange(guest.stay.checkInDate, guest.stay.checkOutDate)} ·{' '}
            {guest?.stay?.adults} adults, {guest?.stay?.children} kids
          </div>
          <div className="u-xs u-muted">
            Sunset {mockLocalConditions.sunset} · Water {mockLocalConditions.water.tempF}° ·{' '}
            {mockLocalConditions.beachFlag.label}
          </div>
        </div>

        <div className="rail-card">
          <span className="rail-card__title">Remembered preferences</span>
          <ul className="u-stack" style={{ gap: 8 }}>
            {(guest?.memories ?? []).map((memory) => (
              <li key={memory.id} className="u-xs" style={{ color: 'var(--ink-600)' }}>
                <Icon
                  name="sparkles"
                  style={{ width: 12, height: 12, marginRight: 6, color: 'var(--sand-700)' }}
                />
                {memory.note}
              </li>
            ))}
            {(guest?.memories ?? []).length === 0 && (
              <li className="u-xs u-muted">Vitoria will remember what you like as you chat.</li>
            )}
          </ul>
          <Link to="/profile" className="section__link" style={{ padding: 0 }}>
            Manage preferences →
          </Link>
        </div>

        <div className="rail-card">
          <span className="rail-card__title">Vitoria can</span>
          <div className="u-stack" style={{ gap: 6 }}>
            <Link to="/groceries/new" className="btn btn--secondary btn--sm btn--block">
              <Icon name="bag" />
              Stock the kitchen
            </Link>
            <Link to="/transfers/new" className="btn btn--secondary btn--sm btn--block">
              <Icon name="car" />
              Arrange a transfer
            </Link>
            <Link to="/restaurants" className="btn btn--secondary btn--sm btn--block">
              <Icon name="utensils" />
              Find a table
            </Link>
          </div>
        </div>
      </aside>

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearThread}
        title="Clear this conversation?"
        message="Your chat history with Vitoria will be removed from this device. Your requests and bookings are not affected."
        confirmLabel="Clear conversation"
        tone="danger"
      />
    </div>
  )
}
