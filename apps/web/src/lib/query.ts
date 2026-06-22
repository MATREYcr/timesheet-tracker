import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { I18n } from '@/i18n/i18n';
import { ApiError } from '@/lib/api-error';

export function makeQueryClient(i18n: I18n) {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        const message =
          error instanceof ApiError ? error.message : i18n.t('common.error');
        toast.error(message);
      },
    }),
  });
}
