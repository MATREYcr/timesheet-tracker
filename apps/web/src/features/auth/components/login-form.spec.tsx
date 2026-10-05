import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import en from '@/i18n/locales/en.json';
import { LoginForm } from './login-form';

const signInEmail = vi.fn();
const replace = vi.fn();
let search = '';

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signIn: { email: (...args: unknown[]) => signInEmail(...args) },
  },
}));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ replace, refresh: vi.fn() }),
  Link: ({ children, href }: { children: React.ReactNode; href: unknown }) => (
    <a href={JSON.stringify(href)}>{children}</a>
  ),
}));

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <LoginForm />
    </NextIntlClientProvider>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    signInEmail.mockReset();
    replace.mockReset();
    search = '';
  });

  it('shows the shared-schema validation messages without calling the API', async () => {
    renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(signInEmail).not.toHaveBeenCalled();
  });

  it('submits the normalized credentials and returns to a safe ?next path', async () => {
    search = 'next=%2Fweekly-summary';
    signInEmail.mockResolvedValue({ data: {}, error: null });
    renderForm();

    await userEvent.type(screen.getByLabelText('Email'), '  Ana@Example.com ');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/weekly-summary'),
    );
    expect(signInEmail).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'secret123',
    });
  });

  it('ignores an off-site ?next and lands on the dashboard', async () => {
    search = 'next=%2F%2Fevil.example';
    signInEmail.mockResolvedValue({ data: {}, error: null });
    renderForm();

    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });

  it('shows one generic error for invalid credentials', async () => {
    signInEmail.mockResolvedValue({
      data: null,
      error: { code: 'INVALID_EMAIL_OR_PASSWORD', status: 401 },
    });
    renderForm();

    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-pass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Invalid email or password.'),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
