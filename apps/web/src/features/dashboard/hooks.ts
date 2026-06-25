'use client';

import { getCurrentWeekStart, getWeekEnd } from '@timesheet/shared';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from './api';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  week: (weekStart: string) => [...dashboardKeys.all, weekStart] as const,
};

export function useDashboard() {
  const weekStart = getCurrentWeekStart();
  const weekEnd = getWeekEnd(weekStart);

  const query = useQuery({
    queryKey: dashboardKeys.week(weekStart),
    queryFn: () => dashboardApi.get(weekStart),
  });

  const data = query.data;
  return {
    weekStart,
    weekEnd,
    activeEmployees: data?.activeEmployees ?? 0,
    totalHours: data?.totalHours ?? 0,
    totalPay: data?.totalPay ?? 0,
    pendingCount: data?.pendingCount ?? 0,
    pending: data?.pending ?? [],
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}
