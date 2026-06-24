import {
  addDays,
  getWeekStart,
  getWeekEnd,
  isInWeek,
  isFutureDate,
} from './dates.js';

describe('getWeekStart', () => {
  // Week of 2026-06-08 (Mon) .. 2026-06-14 (Sun) — matches the assessment sketch.
  it('returns the same Monday for a Monday', () => {
    expect(getWeekStart('2026-06-08')).toBe('2026-06-08');
  });

  it('returns the Monday for every other weekday in that week', () => {
    expect(getWeekStart('2026-06-09')).toBe('2026-06-08'); // Tue
    expect(getWeekStart('2026-06-10')).toBe('2026-06-08'); // Wed
    expect(getWeekStart('2026-06-11')).toBe('2026-06-08'); // Thu
    expect(getWeekStart('2026-06-12')).toBe('2026-06-08'); // Fri
    expect(getWeekStart('2026-06-13')).toBe('2026-06-08'); // Sat
    expect(getWeekStart('2026-06-14')).toBe('2026-06-08'); // Sun
  });

  it('handles a month boundary', () => {
    // 2026-03-01 is a Sunday -> its week starts Mon 2026-02-23.
    expect(getWeekStart('2026-03-01')).toBe('2026-02-23');
  });

  it('handles a year boundary', () => {
    // 2027-01-01 is a Friday -> its week starts Mon 2026-12-28.
    expect(getWeekStart('2027-01-01')).toBe('2026-12-28');
  });
});

describe('getWeekEnd', () => {
  it('returns the Sunday six days after the Monday', () => {
    expect(getWeekEnd('2026-06-08')).toBe('2026-06-14');
  });
});

describe('addDays', () => {
  it('adds and subtracts across month boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('isInWeek', () => {
  it('includes the Monday and Sunday bounds, excludes outside', () => {
    expect(isInWeek('2026-06-08', '2026-06-08')).toBe(true);
    expect(isInWeek('2026-06-14', '2026-06-08')).toBe(true);
    expect(isInWeek('2026-06-07', '2026-06-08')).toBe(false);
    expect(isInWeek('2026-06-15', '2026-06-08')).toBe(false);
  });
});

describe('isFutureDate', () => {
  it('is true only strictly after today', () => {
    expect(isFutureDate('2026-06-15', '2026-06-14')).toBe(true);
    expect(isFutureDate('2026-06-14', '2026-06-14')).toBe(false); // today is allowed
    expect(isFutureDate('2026-06-13', '2026-06-14')).toBe(false);
  });
});
