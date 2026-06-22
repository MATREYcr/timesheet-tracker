// Date-only helpers and the calendar-validation Zod primitives that build on them.
// A "date" here is always a `YYYY-MM-DD` string.
//
// We never parse date-only strings with `new Date(str)` because that interprets
// them as UTC midnight and then shifts to the local timezone, which can move the
// day. Instead we parse/format the parts explicitly via UTC math. Weeks run
// Monday -> Sunday and are keyed by their Monday (`weekStart`).

import { z } from 'zod';

/**
 * Parse a date-only `YYYY-MM-DD` string to a `Date` at UTC midnight. Never use
 * `new Date(str)` for date-only values — it shifts the day across timezones.
 * Returns a plain JS `Date` (no framework dependency), so consumers can hand it
 * to platform formatters like `Intl.DateTimeFormat({ timeZone: 'UTC' })`.
 */
export function parseDateOnly(date: string): Date {
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
  const d = parseDateOnly(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatUtc(d);
}

/** Monday (date-only) of the week containing `date`. Canonical week key. */
export function getWeekStart(date: string): string {
  const d = parseDateOnly(date);
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday -> 0, Sunday -> 6
  return addDays(date, -daysSinceMonday);
}

/** Monday of the current local week — the default week for week-scoped screens. */
export function getCurrentWeekStart(): string {
  return getWeekStart(todayLocal());
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in `YYYY-MM-DD` form (rejects e.g. 2026-02-30). */
export const dateOnly = z
  .string()
  .regex(DATE_RE, 'Date must be in YYYY-MM-DD format')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return (
      d.getUTCFullYear() === year &&
      d.getUTCMonth() === month - 1 &&
      d.getUTCDate() === day
    );
  }, 'Invalid calendar date');

/** A calendar date that is today or earlier (no future dates). */
export const pastOrToday = dateOnly.refine(
  (value) => !isFutureDate(value),
  'Date cannot be in the future',
);

/** A `weekStart` must be the Monday of its week. */
export const weekStartSchema = dateOnly.refine(
  (value) => getWeekStart(value) === value,
  'weekStart must be a Monday',
);
