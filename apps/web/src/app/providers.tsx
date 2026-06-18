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
          <div className="flex h-dvh flex-col overflow-hidden">
            <SiteHeader />
            <main className="flex-1 overflow-hidden">
              <div className="mx-auto flex h-full max-w-5xl flex-col px-6 py-8">
                {children}
              </div>
            </main>
          </div>
          <Toaster richColors />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
