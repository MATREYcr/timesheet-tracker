'use client';

import {
  APPROVAL_STATUS,
  type ApprovalStatus,
  type WeeklySummaryRow,
} from '@timesheet/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { weekApprovalKeys } from '../time-entries/hooks';
import { weeklySummaryApi } from './api';

export const weeklySummaryKeys = {
  all: ['weekly-summary'] as const,
  week: (weekStart: string) => [...weeklySummaryKeys.all, weekStart] as const,
};

export function useWeeklySummary(weekStart: string) {
  return useQuery({
    queryKey: weeklySummaryKeys.week(weekStart),
    queryFn: () => weeklySummaryApi.get(weekStart),
  });
}

interface ApprovalVars {
  employeeId: string;
  weekStart: string;
}

// Approve and reject share the optimistic flow: flip the row's status in the
// cache immediately, roll back on error (the global handler shows the toast),
// then revalidate the week and the time-entry lock state.
function useSetApproval(
  mutationFn: (employeeId: string, weekStart: string) => Promise<unknown>,
  optimisticStatus: ApprovalStatus,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, weekStart }: ApprovalVars) =>
      mutationFn(employeeId, weekStart),
    onMutate: async ({ employeeId, weekStart }) => {
      const key = weeklySummaryKeys.week(weekStart);
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<WeeklySummaryRow[]>(key);
      qc.setQueryData<WeeklySummaryRow[]>(key, (rows) =>
        rows?.map((row) =>
          row.employeeId === employeeId
            ? { ...row, status: optimisticStatus }
            : row,
        ),
      );
      return { previous, weekStart };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(
          weeklySummaryKeys.week(context.weekStart),
          context.previous,
        );
      }
    },
    onSettled: (_data, _error, { weekStart }) => {
      qc.invalidateQueries({ queryKey: weeklySummaryKeys.week(weekStart) });
      qc.invalidateQueries({ queryKey: weekApprovalKeys.all });
    },
  });
}

export function useApproveWeek() {
  return useSetApproval(weeklySummaryApi.approve, APPROVAL_STATUS.approved);
}

export function useRejectWeek() {
  return useSetApproval(weeklySummaryApi.reject, APPROVAL_STATUS.rejected);
}
