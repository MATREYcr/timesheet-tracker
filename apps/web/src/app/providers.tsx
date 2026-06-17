'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/i18n/i18n-provider';
import { makeQueryClient } from '@/lib/query';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <I18nProvider>
          <SiteHeader />
          <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
          <Toaster richColors />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
