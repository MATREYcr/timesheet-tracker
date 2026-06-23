import './global.css';
import { Geist } from 'next/font/google';
import { getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
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
  // getLocale() reads from getRequestConfig (i18n/request.ts), which resolves
  // the locale from the cookie — so the first HTML is already in the right language.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn('font-sans', geist.variable)}
    >
      <body>
        {/* NextIntlClientProvider forwards messages + locale to Client Components. */}
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
