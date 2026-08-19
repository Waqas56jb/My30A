import { makeId } from '../utils/format'
import { track, ANALYTICS_EVENTS } from './analytics'
import { api } from './api'

let typingDelayOverride = null

export const setTypingDelay = (ms) => {
  typingDelayOverride = ms
}

export const typingDelayFor = (text = '') =>
  typingDelayOverride ?? Math.min(2200, 620 + text.length * 3.2)

export const createUserMessage = (text) => ({
  id: makeId('msg'),
  role: 'user',
  at: new Date().toISOString(),
  text: text.trim(),
})

export async function sendMessage(text, context = {}, { onTyping } = {}) {
  track(ANALYTICS_EVENTS.VITORIA_MESSAGE_SENT, {
    length: String(text).length,
    guestId: context?.guest?.id,
  })
  onTyping?.(true)
  try {
    const message = await api('/vitoria/chat', {
      method: 'POST',
      body: { text, conversationId: context?.conversationId },
    })
    onTyping?.(false)
    return {
      id: message?.id ?? makeId('msg'),
      role: message?.role ?? 'assistant',
      at: message?.at ?? new Date().toISOString(),
      text: message?.text ?? '',
      cards: message?.cards ?? [],
      actions: message?.actions ?? [],
      conversationId: message?.conversationId,
    }
  } catch (error) {
    onTyping?.(false)
    throw error
  }
}

export function greetingFor(guest, property) {
  const name = guest?.firstName ?? 'there'
  return {
    id: makeId('msg'),
    role: 'assistant',
    at: new Date().toISOString(),
    text: `Hello **${name}** — I am Vitoria, your concierge for **${property?.community ?? property?.name ?? '30A'}**.

Ask me anything about the house or this stretch of coast: WiFi, where to eat, which beach will be quiet, groceries, or a ride from the airport.`,
    actions: [
      { label: 'Where to eat', to: '/restaurants', icon: 'utensils' },
      { label: 'Explore 30A', to: '/explore', icon: 'compass' },
    ],
  }
}
