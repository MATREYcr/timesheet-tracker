import { setRequestLocale } from 'next-intl/server';
import { WeeklySummaryScreen } from '@/features/weekly-summary/components/weekly-summary-screen';

export default async function WeeklySummaryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WeeklySummaryScreen />;
}
