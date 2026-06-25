import { createEmployeeSchema, employeeIdSchema } from './employee.js';

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

describe('employeeIdSchema', () => {
  it('validates uuid format', () => {
    expect(employeeIdSchema.safeParse(UUID).success).toBe(true);
    expect(employeeIdSchema.safeParse('abc').success).toBe(false);
  });
});
