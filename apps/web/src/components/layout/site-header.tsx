'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LocaleSwitch } from './locale-switch';
import { ThemeToggle } from './theme-toggle';

const NAV = [
  { href: '/employees', key: 'nav.employees' },
  { href: '/time-entries', key: 'nav.timeEntries' },
  { href: '/weekly-summary', key: 'nav.weeklySummary' },
] as const;

function LightningLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="text-primary size-5.5"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13 2 4.5 13.5H11L9 22 18 9.5H11.5L13 2Z" />
    </svg>
  );
}

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <header className="bg-card sticky top-0 z-10 border-b">
      <div className="flex h-15 items-center gap-4 px-6">
        <Link href="/" className="flex flex-1 items-center gap-2">
          <LightningLogo />
          <span className="font-bold tracking-tight">{t('app.title')}</span>
        </Link>

        <nav className="bg-muted flex items-center gap-1 rounded-[10px] border p-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-card text-foreground font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-2">
          <LocaleSwitch />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
