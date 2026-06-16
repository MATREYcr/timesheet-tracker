'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LocaleSwitch } from './locale-switch';

const NAV = [
  { href: '/employees', key: 'nav.employees' },
  { href: '/time-entries', key: 'nav.timeEntries' },
  { href: '/weekly-summary', key: 'nav.weeklySummary' },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
        <Link href="/" className="font-semibold tracking-tight">
          {t('app.title')}
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 transition-colors',
                  active
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <LocaleSwitch />
        </div>
      </div>
    </header>
  );
}
