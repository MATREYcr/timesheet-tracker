'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/i18n/i18n-provider';
import { makeQueryClient } from '@/lib/query';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <Toaster richColors />
      </I18nProvider>
    </QueryClientProvider>
  );
}
