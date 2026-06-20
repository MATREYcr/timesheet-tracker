'use client';

import { useTranslation } from 'react-i18next';
import { LOCALES } from '@/i18n/config';
import { cn } from '@/lib/utils';

export function LocaleSwitch() {
  const { i18n } = useTranslation();
  const active = i18n.resolvedLanguage ?? i18n.language;
  return (
    <div className="bg-muted flex h-9 items-center gap-0.5 rounded-lg border p-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => i18n.changeLanguage(l)}
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
