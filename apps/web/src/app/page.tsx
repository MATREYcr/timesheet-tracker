'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="py-8">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t('app.title')}
      </h1>
      <p className="text-muted-foreground mt-2">{t('app.subtitle')}</p>
      <nav className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/employees">{t('nav.employees')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/time-entries">{t('nav.timeEntries')}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/weekly-summary">{t('nav.weeklySummary')}</Link>
        </Button>
      </nav>
    </div>
  );
}
