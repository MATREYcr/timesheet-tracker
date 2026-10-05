import {
  CalendarCheck,
  ClockArrowUp,
  Languages,
  TrendingUp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitch } from '@/components/layout/locale-switch';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const FEATURES = [
  { key: 'overtime', icon: TrendingUp },
  { key: 'approvals', icon: CalendarCheck },
  { key: 'bilingual', icon: Languages },
] as const;

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const tApp = await getTranslations('app');
  const t = await getTranslations('auth.brand');
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="bg-primary text-primary-foreground relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Decorative glow only; colors come from the primary token. */}
        <div className="bg-primary-foreground/10 pointer-events-none absolute -top-32 -right-32 size-96 rounded-full blur-3xl" />
        <div className="bg-primary-foreground/10 pointer-events-none absolute -bottom-40 -left-24 size-96 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <ClockArrowUp className="size-7" />
          {tApp('title')}
        </div>
        <div className="relative max-w-md space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl leading-tight font-bold tracking-tight">
              {t('tagline')}
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              {t('subtitle')}
            </p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li key={key} className="flex items-center gap-3">
                <span className="bg-primary-foreground/15 flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </span>
                <span className="text-primary-foreground/90">
                  {t(`features.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-primary-foreground/60 relative text-sm">
          {tApp('assessment')}
        </p>
      </aside>

      <div className="bg-background flex flex-col">
        <header className="flex h-16 items-center gap-2.5 px-4 sm:px-6">
          <span className="flex items-center gap-2.5 font-bold tracking-tight lg:hidden">
            <ClockArrowUp className="text-primary size-6.5 shrink-0" />
            {tApp('title')}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitch />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
