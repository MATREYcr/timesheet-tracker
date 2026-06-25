export const OVERTIME_THRESHOLD_HOURS = 40;
export const OVERTIME_MULTIPLIER = 1.5;

export interface WeeklyPay {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalPay: number;
}

// Number.EPSILON nudge corrects floats just under the .xx5 boundary (e.g. 1.005).
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

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
