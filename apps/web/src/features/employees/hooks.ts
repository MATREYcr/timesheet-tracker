'use client';

import type {
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeInput,
} from '@timesheet/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { employeesApi } from './api';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (
    includeInactive: boolean,
    page: number,
    pageSize: number,
    employeeId?: string,
  ) =>
    [
      ...employeeKeys.all,
      { includeInactive, page, pageSize, employeeId },
    ] as const,
};

export function useEmployees(
  includeInactive: boolean,
  page = 1,
  pageSize = 10,
  employeeId?: string,
) {
  return useQuery({
    queryKey: employeeKeys.list(includeInactive, page, pageSize, employeeId),
    queryFn: () =>
      employeesApi.list(includeInactive, page, pageSize, employeeId),
    placeholderData: keepPreviousData,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEmployeeInput) => employeesApi.create(body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateEmployeeInput }) =>
      employeesApi.update(id, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employee: Employee) => employeesApi.deactivate(employee.id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}

export function useReactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employee: Employee) => employeesApi.reactivate(employee.id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: employeeKeys.all }),
  });
}
