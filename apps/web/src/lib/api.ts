// The only place that talks HTTP to the API. Typed with @timesheet/shared, sends
// Accept-Language, and turns the error envelope into a typed ApiError. This is the
// seam that could later be swapped for a generated SDK.

import type {
  ApiErrorBody,
  CreateEmployeeInput,
  CreateTimeEntryInput,
  Employee,
  ErrorCode,
  TimeEntry,
  UpdateEmployeeInput,
  UpdateTimeEntryInput,
  WeeklySummaryRow,
} from '@timesheet/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Current locale for Accept-Language; the i18n provider keeps this in sync.
let currentLocale = 'en';
export function setApiLocale(locale: string) {
  currentLocale = locale;
}

type QueryValue = string | number | boolean | undefined;

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, QueryValue>;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(BASE_URL + path);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Accept-Language': currentLocale,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const data = await response.json();
  if (!response.ok) {
    const { error } = data as ApiErrorBody;
    throw new ApiError(error.code, error.message, response.status);
  }
  return data as T;
}

export const api = {
  listEmployees: (includeInactive: boolean) =>
    request<Employee[]>('/employees', { query: { includeInactive } }),
  createEmployee: (body: CreateEmployeeInput) =>
    request<Employee>('/employees', { method: 'POST', body }),
  updateEmployee: (id: string, body: UpdateEmployeeInput) =>
    request<Employee>(`/employees/${id}`, { method: 'PATCH', body }),
  deactivateEmployee: (id: string) =>
    request<Employee>(`/employees/${id}/deactivate`, { method: 'POST' }),
  reactivateEmployee: (id: string) =>
    request<Employee>(`/employees/${id}/reactivate`, { method: 'POST' }),

  listTimeEntries: (employeeId: string, weekStart?: string) =>
    request<TimeEntry[]>('/time-entries', { query: { employeeId, weekStart } }),
  createTimeEntry: (body: CreateTimeEntryInput) =>
    request<TimeEntry>('/time-entries', { method: 'POST', body }),
  updateTimeEntry: (id: string, body: UpdateTimeEntryInput) =>
    request<TimeEntry>(`/time-entries/${id}`, { method: 'PATCH', body }),
  deleteTimeEntry: (id: string) =>
    request<void>(`/time-entries/${id}`, { method: 'DELETE' }),

  getWeeklySummary: (weekStart: string) =>
    request<WeeklySummaryRow[]>('/weekly-summary', { query: { weekStart } }),
  approveWeek: (employeeId: string, weekStart: string) =>
    request('/weekly-summary/approve', {
      method: 'POST',
      body: { employeeId, weekStart },
    }),
  rejectWeek: (employeeId: string, weekStart: string) =>
    request('/weekly-summary/reject', {
      method: 'POST',
      body: { employeeId, weekStart },
    }),
};
