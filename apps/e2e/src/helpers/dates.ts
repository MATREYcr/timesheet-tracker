function parseDateOnly(date: string): Date {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatUtc(d: Date): string {
  return [
    d.getUTCFullYear(),
    String(d.getUTCMonth() + 1).padStart(2, '0'),
    String(d.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export function addDays(date: string, days: number): string {
  const d = parseDateOnly(date)
  d.setUTCDate(d.getUTCDate() + days)
  return formatUtc(d)
}

function todayLocal(): string {
  const now = new Date()
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
}

function getWeekStart(date: string): string {
  const d = parseDateOnly(date)
  const daysSinceMonday = (d.getUTCDay() + 6) % 7
  return addDays(date, -daysSinceMonday)
}

export function currentWeekStart(): string {
  return getWeekStart(todayLocal())
}

export function lastWeekStart(): string {
  return addDays(currentWeekStart(), -7)
}
