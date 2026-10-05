import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import {
  API_URL,
  BASE_URL,
  STORAGE_STATE,
  saveSession,
} from './helpers/session';

export default async function globalSetup() {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'E2ePassword1!';
  const name = 'E2E Runner';

  const res = await axios.post(
    `${API_URL}/api/auth/sign-up/email`,
    { name, email, password },
    { headers: { origin: BASE_URL } },
  );
  const setCookie = res.headers['set-cookie']?.find((c) =>
    c.includes('session_token='),
  );
  if (!setCookie) throw new Error('Sign-up did not return a session cookie');

  const [pair] = setCookie.split(';');
  const separator = pair.indexOf('=');
  const cookieName = pair.slice(0, separator);
  const cookieValue = pair.slice(separator + 1);

  saveSession({ cookie: pair, email, password, name });

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true });
  fs.writeFileSync(
    STORAGE_STATE,
    JSON.stringify({
      cookies: [
        {
          name: cookieName,
          value: cookieValue,
          domain: new URL(BASE_URL).hostname,
          path: '/',
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ],
      origins: [],
    }),
  );
}
