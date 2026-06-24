'use client';

import { useTranslations } from 'next-intl';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LocaleSwitch } from './locale-switch';
import { ThemeToggle } from './theme-toggle';

export function Topbar() {
  const t = useTranslations('app');
  return (
    <header className="bg-card sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
      <SidebarTrigger
        variant="outline"
        size="icon"
        className="size-9 shrink-0"
      />
      <span className="min-w-0 truncate text-base font-semibold tracking-tight">
        {t('assessment')}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <LocaleSwitch />
        <ThemeToggle />
      </div>
    </header>
  );
}
