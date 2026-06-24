import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Mini Timesheets',
  description: 'Timesheet tracker for hourly employees',
};

// [locale]/layout.tsx provides <html> and <body>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children as React.ReactElement;
}
