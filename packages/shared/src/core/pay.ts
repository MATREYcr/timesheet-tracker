// The core payroll calculation. This is the single home of overtime/pay logic —
// it must never be duplicated in API routes or client components. The web client
// calls this to render the weekly summary.

/** Overtime kicks in beyond this many hours in a single week. */
export const OVERTIME_THRESHOLD_HOURS = 40;
/** Overtime is paid at 1.5x the regular hourly rate. */
export const OVERTIME_MULTIPLIER = 1.5;

export interface WeeklyPay {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

/**
 * Round half-up to 2 decimals. The `Number.EPSILON` nudge corrects values whose
 * float representation sits just under the .xx5 boundary (e.g. 1.005), so the
 * rounding is deterministic. Money is only rounded here, at the final boundary.
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Compute regular/overtime hours and pay for one employee's week.
 * `regularHours = min(total, 40)`, `overtimeHours = max(total - 40, 0)`,
 * `pay = regular * rate + overtime * rate * 1.5`.
 */
export function calculateWeeklyPay(
  totalHours: number,
  hourlyRate: number,
): WeeklyPay {
  const regularHours = Math.min(totalHours, OVERTIME_THRESHOLD_HOURS);
  const overtimeHours = Math.max(totalHours - OVERTIME_THRESHOLD_HOURS, 0);

  const regularPay = round2(regularHours * hourlyRate);
  const overtimePay = round2(overtimeHours * hourlyRate * OVERTIME_MULTIPLIER);
  const totalPay = round2(regularPay + overtimePay);

  return {
    totalHours,
    regularHours,
    overtimeHours,
    regularPay,
    overtimePay,
    totalPay,
  };
}
