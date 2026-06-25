import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-error';

export function makeQueryClient(getErrorMessage: () => string) {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        const message =
          error instanceof ApiError ? error.message : getErrorMessage();
        toast.error(message);
      },
    }),
  });
}
