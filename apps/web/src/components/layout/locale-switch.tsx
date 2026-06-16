'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { LOCALES } from '@/i18n/config';

export function LocaleSwitch() {
  const { i18n } = useTranslation();
  const active = i18n.resolvedLanguage ?? i18n.language;
  return (
    <div className="flex gap-1">
      {LOCALES.map((l) => (
        <Button
          key={l}
          size="sm"
          variant={l === active ? 'default' : 'outline'}
          onClick={() => i18n.changeLanguage(l)}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
