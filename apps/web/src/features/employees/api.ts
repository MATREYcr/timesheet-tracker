import type {
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeInput,
} from '@timesheet/shared';
import { http } from '@/lib/http';

export const employeesApi = {
  list: (includeInactive: boolean) =>
    http
      .get<Employee[]>('/employees', { params: { includeInactive } })
      .then((r) => r.data),
  create: (body: CreateEmployeeInput) =>
    http.post<Employee>('/employees', body).then((r) => r.data),
  update: (id: string, body: UpdateEmployeeInput) =>
    http.patch<Employee>(`/employees/${id}`, body).then((r) => r.data),
  deactivate: (id: string) =>
    http.post<Employee>(`/employees/${id}/deactivate`).then((r) => r.data),
  reactivate: (id: string) =>
    http.post<Employee>(`/employees/${id}/reactivate`).then((r) => r.data),
};
