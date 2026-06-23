'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { LOCALES } from '@timesheet/shared';
import { setLocaleCookie } from '@/i18n/locale-cookie';
import { cn } from '@/lib/utils';

export function LocaleSwitch() {
  const active = useLocale();
  const router = useRouter();

  const switchTo = (l: string) => {
    setLocaleCookie(l);
    // Triggers a server re-render with the new cookie locale.
    router.refresh();
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
