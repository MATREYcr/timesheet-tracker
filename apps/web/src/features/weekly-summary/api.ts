import type {
  Paginated,
  WeekApprovalStatus,
  WeeklySummaryRow,
} from '@timesheet/shared';
import { http } from '@/lib/http';

export const weeklySummaryApi = {
  get: (weekStart: string, page: number, pageSize: number) =>
    http
      .get<Paginated<WeeklySummaryRow>>('/weekly-summary', {
        params: { weekStart, page, pageSize },
      })
      .then((r) => r.data),
  getApproval: (employeeId: string, weekStart: string) =>
    http
      .get<WeekApprovalStatus>('/weekly-summary/approval', {
        params: { employeeId, weekStart },
      })
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
