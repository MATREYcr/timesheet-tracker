// Date-only helpers. A "date" here is always a `YYYY-MM-DD` string.
//
// We never parse date-only strings with `new Date(str)` because that interprets
// them as UTC midnight and then shifts to the local timezone, which can move the
// day. Instead we parse/format the parts explicitly via UTC math. Weeks run
// Monday -> Sunday and are keyed by their Monday (`weekStart`).

function parseUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatUtc(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Add (or subtract, with a negative value) whole days to a date-only string. */
export function addDays(date: string, days: number): string {
  const d = parseUtc(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatUtc(d);
}

/** Monday (date-only) of the week containing `date`. Canonical week key. */
export function getWeekStart(date: string): string {
  const d = parseUtc(date);
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday -> 0, Sunday -> 6
  return addDays(date, -daysSinceMonday);
}

/** Sunday (date-only) of the week that starts on `weekStart` (a Monday). */
export function getWeekEnd(weekStart: string): string {
  return addDays(weekStart, 6);
}

/** True when `date` falls within the Monday–Sunday week starting at `weekStart`. */
export function isInWeek(date: string, weekStart: string): boolean {
  return date >= weekStart && date <= getWeekEnd(weekStart);
}

/** Current local date as `YYYY-MM-DD`. */
function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * True when `date` is strictly after `today`. `today` defaults to the local
 * current date; pass it explicitly for deterministic tests. Lexicographic
 * comparison is valid for zero-padded `YYYY-MM-DD` strings.
 */
export function isFutureDate(
  date: string,
  today: string = todayLocal(),
): boolean {
  return date > today;
}
