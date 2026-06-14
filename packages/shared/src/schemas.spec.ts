import {
  createEmployeeSchema,
  hoursSchema,
  createTimeEntrySchema,
  weeklyApprovalActionSchema,
  employeeIdSchema,
} from './schemas.js';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('createEmployeeSchema', () => {
  it('accepts a valid employee', () => {
    expect(
      createEmployeeSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        hourlyRate: 22.5,
      }).success,
    ).toBe(true);
  });

  it('rejects empty names and non-positive rate', () => {
    expect(
      createEmployeeSchema.safeParse({
        firstName: '',
        lastName: 'Doe',
        hourlyRate: 22.5,
      }).success,
    ).toBe(false);
    expect(
      createEmployeeSchema.safeParse({
        firstName: 'Jane',
        lastName: 'Doe',
        hourlyRate: 0,
      }).success,
    ).toBe(false);
  });
});

describe('hoursSchema', () => {
  it('accepts quarter-hour values within range', () => {
    for (const h of [0.25, 7.5, 8, 23.75, 24]) {
      expect(hoursSchema.safeParse(h).success).toBe(true);
    }
  });

  it('rejects out-of-range and non-quarter values', () => {
    for (const h of [0, 0.1, 7.3, 24.25, 25, -1]) {
      expect(hoursSchema.safeParse(h).success).toBe(false);
    }
  });
});

describe('createTimeEntrySchema', () => {
  it('accepts a valid past entry', () => {
    expect(
      createTimeEntrySchema.safeParse({
        employeeId: UUID,
        date: '2020-01-15',
        hours: 8,
      }).success,
    ).toBe(true);
  });

  it('rejects a future date', () => {
    expect(
      createTimeEntrySchema.safeParse({
        employeeId: UUID,
        date: '2999-01-01',
        hours: 8,
      }).success,
    ).toBe(false);
  });

  it('rejects an invalid calendar date and bad uuid', () => {
    expect(
      createTimeEntrySchema.safeParse({
        employeeId: UUID,
        date: '2026-02-30',
        hours: 8,
      }).success,
    ).toBe(false);
    expect(
      createTimeEntrySchema.safeParse({
        employeeId: 'not-a-uuid',
        date: '2020-01-15',
        hours: 8,
      }).success,
    ).toBe(false);
  });
});

describe('weeklyApprovalActionSchema', () => {
  it('accepts a Monday weekStart', () => {
    expect(
      weeklyApprovalActionSchema.safeParse({
        employeeId: UUID,
        weekStart: '2026-06-08',
      }).success,
    ).toBe(true);
  });

  it('rejects a non-Monday weekStart', () => {
    expect(
      weeklyApprovalActionSchema.safeParse({
        employeeId: UUID,
        weekStart: '2026-06-09',
      }).success,
    ).toBe(false);
  });
});

describe('employeeIdSchema', () => {
  it('validates uuid format', () => {
    expect(employeeIdSchema.safeParse(UUID).success).toBe(true);
    expect(employeeIdSchema.safeParse('abc').success).toBe(false);
  });
});
