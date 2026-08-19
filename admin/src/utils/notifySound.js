/** Short chime for a new inbox item. Generated in-browser — no audio file. */

let audioCtx = null
let unlocked = false

function context() {
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  if (!audioCtx) audioCtx = new Ctor()
  return audioCtx
}

export function unlockNotificationSound() {
  try {
    const ctx = context()
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    unlocked = true
  } catch {
    /* autoplay policies vary; a later click will retry */
  }
}

export function playNotificationSound() {
  try {
    unlockNotificationSound()
    const ctx = context()
    if (!ctx || ctx.state !== 'running') return

    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, now)
    master.gain.exponentialRampToValueAtTime(0.14, now + 0.018)
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
    master.connect(ctx.destination)

    const ding = (freq, start, duration) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.9, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + duration)
    }

    ding(880, now, 0.22)
    ding(1318.5, now + 0.1, 0.28)
  } catch {
    /* never let audio take the shell down */
  }
}

export function isNotificationSoundReady() {
  return unlocked
}
