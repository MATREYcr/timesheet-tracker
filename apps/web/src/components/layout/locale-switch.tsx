'use client';

import { useLocale } from 'next-intl';
import { LOCALES } from '@timesheet/shared';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function LocaleSwitch() {
  const active = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (locale: string) => {
    router.replace(pathname, { locale });
  };

  return (
    <div className="bg-muted flex h-9 items-center gap-0.5 rounded-lg border p-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            l === active
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
