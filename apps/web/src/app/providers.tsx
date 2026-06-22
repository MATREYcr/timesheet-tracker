'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { Locale } from '@timesheet/shared';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { createI18n } from '@/i18n/i18n';
import { I18nProvider } from '@/i18n/i18n-provider';
import { makeQueryClient } from '@/lib/query';

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  // One i18next instance per mount, created in the server-provided language and
  // shared with the query client (for localized error toasts outside React).
  const [i18n] = useState(() => createI18n(locale));
  const [queryClient] = useState(() => makeQueryClient(i18n));
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <I18nProvider i18n={i18n}>
          <TooltipProvider delayDuration={0}>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="min-w-0">
                <Topbar />
                <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster richColors />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
