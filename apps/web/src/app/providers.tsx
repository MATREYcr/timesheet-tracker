'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState, type ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { setApiLocale } from '@/lib/http';
import { makeQueryClient } from '@/lib/query';

// Keeps the axios Accept-Language header in sync with the active locale.
function LocaleSync() {
  const locale = useLocale();
  useEffect(() => {
    setApiLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

function QueryProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const [queryClient] = useState(() => makeQueryClient(() => t('error')));
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <TooltipProvider delayDuration={0}>
          <LocaleSync />
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
              <Topbar />
              <div className="px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <Toaster richColors />
      </QueryProvider>
    </ThemeProvider>
  );
}
