'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
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
          <TooltipProvider delayDuration={0}>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <Topbar />
                <div className="px-6 py-8">{children}</div>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          <Toaster richColors />
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
