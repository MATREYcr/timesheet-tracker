import type { DashboardSummary } from '@timesheet/shared';
import { http } from '@/lib/http';

export const dashboardApi = {
  get: (weekStart: string) =>
    http
      .get<DashboardSummary>('/dashboard', { params: { weekStart } })
      .then((r) => r.data),
};
