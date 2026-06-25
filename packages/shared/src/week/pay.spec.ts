import { calculateWeeklyPay, round2 } from './pay.js';

describe('calculateWeeklyPay', () => {
  it('exactly 40h is all regular, no overtime', () => {
    expect(calculateWeeklyPay(40, 20)).toEqual({
      totalHours: 40,
      regularHours: 40,
      overtimeHours: 0,
      regularPay: 800,
      overtimePay: 0,
      totalPay: 800,
    });
  });

  it('just over 40h splits regular and overtime', () => {
    expect(calculateWeeklyPay(40.25, 20)).toEqual({
      totalHours: 40.25,
      regularHours: 40,
      overtimeHours: 0.25,
      regularPay: 800,
      overtimePay: 7.5, // 0.25 * 20 * 1.5
      totalPay: 807.5,
    });
  });

  it('under 40h has no overtime', () => {
    expect(calculateWeeklyPay(32, 18)).toMatchObject({
      regularHours: 32,
      overtimeHours: 0,
      regularPay: 576,
      overtimePay: 0,
      totalPay: 576,
    });
  });

  it('zero hours yields all zeros', () => {
    expect(calculateWeeklyPay(0, 25)).toEqual({
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      regularPay: 0,
      overtimePay: 0,
      totalPay: 0,
    });
  });

  it('large overtime week', () => {
    expect(calculateWeeklyPay(60, 10)).toMatchObject({
      regularHours: 40,
      overtimeHours: 20,
      regularPay: 400,
      overtimePay: 300, // 20 * 10 * 1.5
      totalPay: 700,
    });
  });

  it('matches the assessment sketch (45.5h @ $22.50 -> $1,085.63)', () => {
    expect(calculateWeeklyPay(45.5, 22.5)).toMatchObject({
      regularHours: 40,
      overtimeHours: 5.5,
      regularPay: 900,
      overtimePay: 185.63, // 5.5 * 22.5 * 1.5 = 185.625 -> half-up 185.63
      totalPay: 1085.63,
    });
  });

  it('rounds money half-up at the boundary', () => {
    expect(round2(185.625)).toBe(185.63);
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.345)).toBe(2.35);
    expect(round2(0)).toBe(0);
  });
});
