import { weeklyApprovalActionSchema } from './approval.js';

const UUID = '11111111-1111-4111-8111-111111111111';

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
