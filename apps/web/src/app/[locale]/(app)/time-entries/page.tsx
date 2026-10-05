import { setRequestLocale } from 'next-intl/server';
import { TimeEntriesScreen } from '@/features/time-entries/components/time-entries-screen';

export default async function TimeEntriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <TimeEntriesScreen />;
}
