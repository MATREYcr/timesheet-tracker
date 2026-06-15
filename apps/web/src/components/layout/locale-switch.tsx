'use client';

import { Button } from '@/components/ui/button';
import { LOCALES } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';

export function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <div className="flex gap-1">
      {LOCALES.map((l) => (
        <Button
          key={l}
          size="sm"
          variant={l === locale ? 'default' : 'outline'}
          onClick={() => setLocale(l)}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
