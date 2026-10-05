'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { NEXT_PARAM, safeNextPath } from '@/lib/auth-routes';

/** Where to land after signing in: the remembered `?next=` path, if it is same-site. */
export function useAfterAuthPath(): string {
  const searchParams = useSearchParams();
  return safeNextPath(searchParams.get(NEXT_PARAM));
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const signOut = async () => {
    setIsPending(true);
    try {
      await authClient.signOut();
    } finally {
      queryClient.clear();
      router.replace('/login');
      router.refresh();
    }
  };

  return { signOut, isPending };
}
