import type { WeeklySummaryRow } from '@timesheet/shared';
import { http } from '@/lib/http';

export const weeklySummaryApi = {
  get: (weekStart: string) =>
    http
      .get<WeeklySummaryRow[]>('/weekly-summary', { params: { weekStart } })
      .then((r) => r.data),
  approve: (employeeId: string, weekStart: string) =>
    http
      .post('/weekly-summary/approve', { employeeId, weekStart })
      .then((r) => r.data),
  reject: (employeeId: string, weekStart: string) =>
    http
      .post('/weekly-summary/reject', { employeeId, weekStart })
      .then((r) => r.data),
};
