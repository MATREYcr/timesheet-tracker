import { ClockArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitch } from '@/components/layout/locale-switch';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTranslations('app');
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col">
      <header className="flex h-16 items-center gap-2.5 px-4 sm:px-6">
        <ClockArrowUp className="text-primary size-6.5 shrink-0" />
        <span className="font-bold tracking-tight">{t('title')}</span>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
