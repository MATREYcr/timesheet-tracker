'use client';

import {
  APPROVAL_STATUS,
  type ApprovalStatus,
  type Paginated,
  type WeeklySummaryRow,
} from '@timesheet/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { weekApprovalKeys } from '../time-entries/hooks';
import { weeklySummaryApi } from './api';

export const weeklySummaryKeys = {
  all: ['weekly-summary'] as const,
  week: (weekStart: string) => [...weeklySummaryKeys.all, weekStart] as const,
  page: (
    weekStart: string,
    page: number,
    pageSize: number,
    employeeId?: string,
  ) =>
    [
      ...weeklySummaryKeys.week(weekStart),
      { page, pageSize, employeeId },
    ] as const,
};

export function useWeeklySummary(
  weekStart: string,
  page = 1,
  pageSize = 10,
  employeeId?: string,
) {
  return useQuery({
    queryKey: weeklySummaryKeys.page(weekStart, page, pageSize, employeeId),
    queryFn: () => weeklySummaryApi.get(weekStart, page, pageSize, employeeId),
    placeholderData: keepPreviousData,
  });
}

interface ApprovalVars {
  employeeId: string;
  weekStart: string;
}

type SummaryPage = Paginated<WeeklySummaryRow>;

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
      const previous = qc.getQueriesData<SummaryPage>({ queryKey: key });
      qc.setQueriesData<SummaryPage>({ queryKey: key }, (current) =>
        current
          ? {
              ...current,
              data: current.data.map((row) =>
                row.employeeId === employeeId
                  ? { ...row, status: optimisticStatus }
                  : row,
              ),
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
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
