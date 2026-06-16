import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '@/i18n/i18n';
import { ApiError } from '@/lib/http';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
    // Generic error feedback for every mutation in one place. ApiError messages
    // are already localized by the API; fall back to the i18n singleton for the
    // rest (this runs outside React, so we can't use the useTranslation hook).
    mutationCache: new MutationCache({
      onError: (error) => {
        const message =
          error instanceof ApiError ? error.message : i18n.t('common.error');
        toast.error(message);
      },
    }),
  });
}
