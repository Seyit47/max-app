const pad = (n: number) => String(n).padStart(2, '0')

/** HH:MM in local time. */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Label for the separator between days in the message list. */
export function formatDayLabel(ts: number, now = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  const sameYear = new Date(ts).getFullYear() === new Date(now).getFullYear()
  return new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** Compact timestamp for chat list rows: time today, weekday this week, date otherwise. */
export function formatListTime(ts: number, now = Date.now()): string {
  const diffDays = Math.round((startOfDay(now) - startOfDay(ts)) / DAY_MS)
  if (diffDays === 0) return formatTime(ts)
  if (diffDays > 0 && diffDays < 7) {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'short' })
  }
  const d = new Date(ts)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`
}
