import { AUTH_VALIDATION, signInSchema, signUpSchema } from './auth.js';

const valid = {
  name: 'Ana García',
  email: 'ana@example.com',
  password: 'secret123',
};

function issue(
  result: ReturnType<typeof signUpSchema.safeParse>,
  field: string,
) {
  return result.success
    ? undefined
    : result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe('signUpSchema', () => {
  it('accepts a valid registration', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a 7-character password and accepts 8', () => {
    expect(
      issue(
        signUpSchema.safeParse({ ...valid, password: '1234567' }),
        'password',
      ),
    ).toBe(AUTH_VALIDATION.passwordTooShort);
    expect(
      signUpSchema.safeParse({ ...valid, password: '12345678' }).success,
    ).toBe(true);
  });

  it('rejects a password longer than 128 characters', () => {
    expect(
      issue(
        signUpSchema.safeParse({ ...valid, password: 'a'.repeat(129) }),
        'password',
      ),
    ).toBe(AUTH_VALIDATION.passwordTooLong);
  });

  it('trims the name and enforces 1–100 characters', () => {
    expect(
      issue(signUpSchema.safeParse({ ...valid, name: '   ' }), 'name'),
    ).toBe(AUTH_VALIDATION.nameRequired);
    expect(
      issue(
        signUpSchema.safeParse({ ...valid, name: 'a'.repeat(101) }),
        'name',
      ),
    ).toBe(AUTH_VALIDATION.nameTooLong);
    const parsed = signUpSchema.parse({ ...valid, name: '  Ana  ' });
    expect(parsed.name).toBe('Ana');
  });

  it('rejects an invalid email', () => {
    expect(
      issue(
        signUpSchema.safeParse({ ...valid, email: 'not-an-email' }),
        'email',
      ),
    ).toBe(AUTH_VALIDATION.emailInvalid);
  });
});

describe('signInSchema', () => {
  it('trims and lowercases the email', () => {
    const parsed = signInSchema.parse({
      email: '  Ana@Example.com ',
      password: 'x',
    });
    expect(parsed.email).toBe('ana@example.com');
  });

  it('requires a password', () => {
    const result = signInSchema.safeParse({
      email: 'ana@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
