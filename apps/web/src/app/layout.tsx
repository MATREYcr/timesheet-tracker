import './global.css';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@timesheet/shared';
import { Geist } from 'next/font/google';
import { cookies } from 'next/headers';
import { LOCALE_COOKIE } from '@/i18n/locale-cookie';
import { cn } from '@/lib/utils';
import { Providers } from './providers';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'Mini Timesheets',
  description: 'Timesheet tracker for hourly employees',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Resolve the locale on the server so the first HTML is rendered in the right
  // language and <html lang> is correct. Reading a cookie opts this route into
  // dynamic rendering (SSR) — the right mode for a per-user dashboard.
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: Locale = LOCALES.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
    >
      <body>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
