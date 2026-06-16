'use client';

import type {
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeInput,
} from '@timesheet/shared';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { employeesApi } from './api';

export const employeeKeys = {
  all: ['employees'] as const,
  list: (includeInactive: boolean) =>
    [...employeeKeys.all, { includeInactive }] as const,
};

export function useEmployees(includeInactive: boolean) {
  return useQuery({
    queryKey: employeeKeys.list(includeInactive),
    queryFn: () => employeesApi.list(includeInactive),
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
