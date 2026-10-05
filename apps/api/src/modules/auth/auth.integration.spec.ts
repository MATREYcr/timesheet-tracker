import type { ApiErrorBody } from '@timesheet/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  anonymousApp,
  body,
  closeDb,
  signUp,
  truncate,
  WEB_ORIGIN,
} from '../../../test/helpers';

function signIn(email: string, password: string, origin = WEB_ORIGIN) {
  return anonymousApp.request('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ email, password }),
  });
}

describe('authentication (integration)', () => {
  beforeAll(async () => {
    await truncate();
  });

  afterAll(async () => {
    await truncate();
    await closeDb();
  });

  it('rejects business endpoints without a session with a localized 401 envelope', async () => {
    const en = await anonymousApp.request('/employees');
    expect(en.status).toBe(401);
    expect(await body<ApiErrorBody>(en)).toEqual({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You need to sign in to continue.',
      },
    });

    const es = await anonymousApp.request(
      '/weekly-summary?weekStart=2020-02-03',
      {
        headers: { 'accept-language': 'es-ES,es;q=0.9' },
      },
    );
    expect(es.status).toBe(401);
    expect((await body<ApiErrorBody>(es)).error.message).toBe(
      'Debes iniciar sesión para continuar.',
    );
  });

  it('keeps /health and the API docs public', async () => {
    expect((await anonymousApp.request('/health')).status).toBe(200);
    expect((await anonymousApp.request('/openapi')).status).toBe(200);
  });

  it('grants access after sign-up and revokes it on sign-out', async () => {
    const { cookie } = await signUp({ name: 'Ana García' });
    const authed = { headers: { cookie } };

    expect((await anonymousApp.request('/employees', authed)).status).toBe(200);

    const session = await anonymousApp.request('/api/auth/get-session', authed);
    const sessionBody = await body<{ user: Record<string, unknown> }>(session);
    expect(sessionBody.user.name).toBe('Ana García');
    expect(JSON.stringify(sessionBody)).not.toMatch(/password/i);

    const out = await anonymousApp.request('/api/auth/sign-out', {
      method: 'POST',
      headers: {
        cookie,
        origin: WEB_ORIGIN,
        'content-type': 'application/json',
      },
      body: '{}',
    });
    expect(out.status).toBe(200);

    const stale = await anonymousApp.request('/employees', authed);
    expect(stale.status).toBe(401);
    // The stale cookie is expired in the 401 so the web proxy stops treating it as a session.
    expect(stale.headers.get('set-cookie')).toMatch(
      /session_token=;.*Max-Age=0/i,
    );
  });

  it('signs in with valid credentials and gives one generic error otherwise', async () => {
    const { email, password } = await signUp();

    const ok = await signIn(email, password);
    expect(ok.status).toBe(200);
    expect(ok.headers.get('set-cookie')).toMatch(
      /session_token=.*HttpOnly.*SameSite=Lax/i,
    );

    const wrongPassword = await body<{ code: string }>(
      await signIn(email, 'wrong-pass'),
    );
    const unknownEmail = await body<{ code: string }>(
      await signIn('nobody@example.com', 'wrong-pass'),
    );
    expect(wrongPassword.code).toBe('INVALID_EMAIL_OR_PASSWORD');
    expect(unknownEmail.code).toBe(wrongPassword.code);
  });

  it('rejects a duplicate email regardless of letter case', async () => {
    const { email } = await signUp();
    const res = await anonymousApp.request('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: WEB_ORIGIN },
      body: JSON.stringify({
        name: 'Dup',
        email: email.toUpperCase(),
        password: 'secret123',
      }),
    });
    expect(res.status).toBe(422);
  });

  it('rejects sign-in from a foreign origin', async () => {
    const { email, password } = await signUp();
    const res = await signIn(email, password, 'http://evil.example');
    expect(res.status).toBe(403);
    expect(res.headers.get('set-cookie')).toBeNull();
  });
});
