'use client';

import Link from 'next/link';
import { LocaleSwitch } from '@/components/layout/locale-switch';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-provider';

export default function Home() {
  const { t } = useI18n();
  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{t.app.title}</h1>
        <LocaleSwitch />
      </div>
      <p className="text-muted-foreground mt-2">{t.app.subtitle}</p>
      <nav className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/employees">{t.nav.employees}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/time-entries">{t.nav.timeEntries}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/weekly-summary">{t.nav.weeklySummary}</Link>
        </Button>
      </nav>
    </main>
  );
}
