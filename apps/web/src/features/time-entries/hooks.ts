'use client';

import type {
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
} from '@timesheet/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weeklySummaryApi } from '../weekly-summary/api';
import { timeEntriesApi } from './api';

export const timeEntryKeys = {
  all: ['time-entries'] as const,
  list: (employeeId: string, weekStart: string) =>
    [...timeEntryKeys.all, { employeeId, weekStart }] as const,
};

export const weekApprovalKeys = {
  all: ['week-approval'] as const,
  one: (employeeId: string, weekStart: string) =>
    [...weekApprovalKeys.all, { employeeId, weekStart }] as const,
};

export function useTimeEntries(
  employeeId: string | undefined,
  weekStart: string,
) {
  return useQuery({
    queryKey: timeEntryKeys.list(employeeId ?? '', weekStart),
    queryFn: () => timeEntriesApi.list(employeeId as string, weekStart),
    enabled: Boolean(employeeId),
  });
}

export function useWeekApproval(
  employeeId: string | undefined,
  weekStart: string,
) {
  return useQuery({
    queryKey: weekApprovalKeys.one(employeeId ?? '', weekStart),
    queryFn: () =>
      weeklySummaryApi.getApproval(employeeId as string, weekStart),
    enabled: Boolean(employeeId),
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTimeEntryInput) => timeEntriesApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.all }),
  });
}

export function useUpdateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTimeEntryInput }) =>
      timeEntriesApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.all }),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => timeEntriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: timeEntryKeys.all }),
  });
}
