import { setRequestLocale } from 'next-intl/server';
import { DashboardScreen } from '@/features/dashboard/components/dashboard-screen';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DashboardScreen />;
}
