'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LocaleSwitch } from './locale-switch';
import { ThemeToggle } from './theme-toggle';

const TITLE_BY_PATH = {
  '/employees': 'nav.employees',
  '/time-entries': 'nav.timeEntries',
  '/weekly-summary': 'nav.weeklySummary',
} as const;

export function Topbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const matched = (
    Object.keys(TITLE_BY_PATH) as (keyof typeof TITLE_BY_PATH)[]
  ).find((href) => pathname.startsWith(href));
  const title = matched ? TITLE_BY_PATH[matched] : 'app.title';

  return (
    <header className="bg-card sticky top-0 z-10 flex h-15 shrink-0 items-center gap-3 border-b px-6">
      <SidebarTrigger className="md:hidden" />
      <span className="font-semibold tracking-tight">{t(title)}</span>
      <div className="ml-auto flex items-center gap-2">
        <LocaleSwitch />
        <ThemeToggle />
      </div>
    </header>
  );
}
