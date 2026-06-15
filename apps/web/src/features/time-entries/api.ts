import type {
  CreateTimeEntryInput,
  TimeEntry,
  UpdateTimeEntryInput,
} from '@timesheet/shared';
import { http } from '@/lib/http';

export const timeEntriesApi = {
  list: (employeeId: string, weekStart?: string) =>
    http
      .get<TimeEntry[]>('/time-entries', { params: { employeeId, weekStart } })
      .then((r) => r.data),
  create: (body: CreateTimeEntryInput) =>
    http.post<TimeEntry>('/time-entries', body).then((r) => r.data),
  update: (id: string, body: UpdateTimeEntryInput) =>
    http.patch<TimeEntry>(`/time-entries/${id}`, body).then((r) => r.data),
  remove: (id: string) =>
    http.delete(`/time-entries/${id}`).then(() => undefined),
};
