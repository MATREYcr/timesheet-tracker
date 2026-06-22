import type {
  CreateEmployeeInput,
  Employee,
  Paginated,
  UpdateEmployeeInput,
} from '@timesheet/shared';
import { http } from '@/lib/http';

export const employeesApi = {
  list: (
    includeInactive: boolean,
    page: number,
    pageSize: number,
    employeeId?: string,
  ) =>
    http
      .get<Paginated<Employee>>('/employees', {
        params: { includeInactive, page, pageSize, employeeId },
      })
      .then((r) => r.data),
  search: (search: string) =>
    http
      .get<Paginated<Employee>>('/employees', {
        params: { search, includeInactive: true, pageSize: 10 },
      })
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
