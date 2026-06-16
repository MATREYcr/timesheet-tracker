import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '@/i18n/i18n';
import { ApiError } from '@/lib/http';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
    // ApiError messages are already localized by the API; for the rest use the
    // i18n singleton (this runs outside React, so no useTranslation hook).
    mutationCache: new MutationCache({
      onError: (error) => {
        const message =
          error instanceof ApiError ? error.message : i18n.t('common.error');
        toast.error(message);
      },
    }),
  });
}
