// OpenAPI building blocks shared by the route modules: a pre-configured OpenAPIHono
// factory (so request-validation failures flow through our error envelope) plus the
// response schemas. The *shapes* are single-sourced in `@timesheet/shared` (where the
// domain types derive from them); here we only attach OpenAPI metadata (.openapi()),
// keeping that server-only concern out of the headless shared package.

import { OpenAPIHono, z } from '@hono/zod-openapi';
import {
  dashboardSummarySchema as dashboardShape,
  employeeSchema as employeeShape,
  LOCALES,
  timeEntrySchema as timeEntryShape,
  weekApprovalStatusSchema as weekApprovalShape,
  weeklySummaryRowSchema as weeklySummaryRowShape,
  type ErrorCode,
} from '@timesheet/shared';
import { AppError } from './errors.js';
import type { AppEnv } from './types.js';

const ERROR_CODES: [ErrorCode, ...ErrorCode[]] = [
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'EMPLOYEE_INACTIVE',
  'FUTURE_DATE',
  'WEEK_LOCKED',
  'INTERNAL_ERROR',
];

/** A module router whose validation failures become our VALIDATION_ERROR envelope. */
export function createModuleApp() {
  return new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) throw new AppError('VALIDATION_ERROR');
    },
  });
}

/** Wrap a schema as a JSON response entry for `createRoute`. */
export function jsonResponse<T extends z.ZodType>(schema: T, description: string) {
  return { content: { 'application/json': { schema } }, description };
}

/** Wrap a schema as a JSON request body for `createRoute`. */
export const jsonBody = <T extends z.ZodType>(schema: T) => ({
  body: { content: { 'application/json': { schema } } },
});

/** Path param `{id}` (uuid) shared by the resource-by-id routes. */
export const idParam = z.object({
  id: z.uuid().openapi({ param: { name: 'id', in: 'path' } }),
});

export const errorSchema = z
  .object({
    error: z.object({
      code: z.enum(ERROR_CODES),
      message: z.string(),
    }),
  })
  .openapi('ApiError');

/** Reusable 4xx/5xx error response. */
export const errorResponse = (description: string) =>
  jsonResponse(errorSchema, description);

export const employeeSchema = employeeShape.openapi('Employee');
export const timeEntrySchema = timeEntryShape.openapi('TimeEntry');
export const weeklySummaryRowSchema =
  weeklySummaryRowShape.openapi('WeeklySummaryRow');
export const weekApprovalStatusSchema =
  weekApprovalShape.openapi('WeekApprovalStatus');
// Shape comes from shared; only `pending` is re-pointed at the decorated row so the
// spec $refs the named WeeklySummaryRow component instead of inlining it.
export const dashboardSummarySchema = z
  .object({ ...dashboardShape.shape, pending: z.array(weeklySummaryRowSchema) })
  .openapi('DashboardSummary');

/** The standard paginated envelope around any item schema. */
export function paginatedSchema<T extends z.ZodType>(item: T, name: string) {
  return z
    .object({
      data: z.array(item),
      page: z.number().int(),
      pageSize: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    })
    .openapi(name);
}

const acceptLanguageParam = {
  name: 'Accept-Language',
  in: 'header' as const,
  required: false,
  description: 'Language for localized error messages. Defaults to `en`.',
  schema: { type: 'string' as const, enum: [...LOCALES] },
};

/**
 * Build the OpenAPI document and document the global `Accept-Language` header on
 * every operation, so the Swagger UI exposes the en/es response toggle (the spec
 * generator can't know about a middleware-resolved header on its own).
 */
export function buildOpenApiDocument(
  app: OpenAPIHono<AppEnv>,
): ReturnType<OpenAPIHono<AppEnv>['getOpenAPI31Document']> {
  const doc = app.getOpenAPI31Document({
    openapi: '3.1.0',
    info: { title: 'Mini Timesheets API', version: '1.0.0' },
  });
  const methods = ['get', 'post', 'put', 'patch', 'delete'] as const;
  for (const path of Object.values(doc.paths ?? {})) {
    for (const method of methods) {
      const op = path[method];
      if (op) op.parameters = [...(op.parameters ?? []), acceptLanguageParam];
    }
  }
  return doc;
}
