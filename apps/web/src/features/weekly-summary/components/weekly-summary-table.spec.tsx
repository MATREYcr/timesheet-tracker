import type { WeeklySummaryRow } from '@timesheet/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import en from '@/i18n/locales/en.json';
import { WeeklySummaryTable } from './weekly-summary-table';

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </NextIntlClientProvider>,
  );
}

describe('WeeklySummaryTable', () => {
  it('renders the regular/overtime/pay split derived by calculateWeeklyPay', () => {
    // 45.5h @ $22.50 → 40 regular + 5.5 overtime;
    // pay = 40*22.5 + 5.5*22.5*1.5 = 900 + 185.63 = 1,085.63
    const rows: WeeklySummaryRow[] = [
      {
        employeeId: 'e1',
        firstName: 'Jane',
        lastName: 'Doe',
        hourlyRate: 22.5,
        totalHours: 45.5,
        status: 'pending',
      },
    ];

    renderWithProviders(
      <WeeklySummaryTable rows={rows} weekStart="2026-06-08" />,
    );

    const row = screen.getByText('Jane Doe').closest('tr');
    expect(row).not.toBeNull();
    const cells = within(row as HTMLElement).getAllByRole('cell');

    // [name, regular h, overtime h, total h, pay, status, actions]
    expect(cells[1]).toHaveTextContent('40');
    expect(cells[2]).toHaveTextContent('5.5');
    expect(cells[3]).toHaveTextContent('45.5');
    expect(cells[4]).toHaveTextContent('$1,085.63');
    expect(cells[4]).toHaveTextContent('$900.00 + $185.63');
  });
});
