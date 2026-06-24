import { z } from 'zod';

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

export function addDays(date: string, days: number): string {
  const d = parseDateOnly(date);
  d.setUTCDate(d.getUTCDate() + days);
  return formatUtc(d);
}

export function getWeekStart(date: string): string {
  const d = parseDateOnly(date);
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Monday -> 0, Sunday -> 6
  return addDays(date, -daysSinceMonday);
}

export function getCurrentWeekStart(): string {
  return getWeekStart(todayLocal());
}

export function getWeekEnd(weekStart: string): string {
  return addDays(weekStart, 6);
}

export function isInWeek(date: string, weekStart: string): boolean {
  return date >= weekStart && date <= getWeekEnd(weekStart);
}

function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Lexicographic comparison is valid for zero-padded `YYYY-MM-DD` strings.
export function isFutureDate(
  date: string,
  today: string = todayLocal(),
): boolean {
  return date > today;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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

export const pastOrToday = dateOnly.refine(
  (value) => !isFutureDate(value),
  'Date cannot be in the future',
);

export const weekStartSchema = dateOnly.refine(
  (value) => getWeekStart(value) === value,
  'weekStart must be a Monday',
);
