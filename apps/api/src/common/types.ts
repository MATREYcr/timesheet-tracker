import type { AuthSession } from '@/auth';
import type { Locale } from '@/common/errors';

export type AppEnv = {
  Variables: {
    locale: Locale;
    user: AuthSession['user'];
    session: AuthSession['session'];
  };
};
