import { OpenAPIHono, z } from '@hono/zod-openapi';
import { ERROR_CODES, LOCALES, paginatedSchema as paginatedShape } from '@timesheet/shared';
import { AppError } from '@/common/errors';
import type { AppEnv } from './types';

// ─── App factory ──────────────────────────────────────────────────────────────

export function createModuleApp() {
  return new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (!result.success) throw new AppError('VALIDATION_ERROR');
    },
  });
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

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

// ─── Route helpers ────────────────────────────────────────────────────────────

export const jsonBody = <T extends z.ZodType>(schema: T) => ({
  body: { content: { 'application/json': { schema } } },
});

export function jsonResponse<T extends z.ZodType>(schema: T, description: string) {
  return { content: { 'application/json': { schema } }, description };
}

export const errorResponse = (description: string) =>
  jsonResponse(errorSchema, description);

export function paginatedSchema<T extends z.ZodType>(item: T, name: string) {
  return paginatedShape(item).openapi(name);
}

// ─── Spec generation ──────────────────────────────────────────────────────────

const acceptLanguageParam = {
  name: 'Accept-Language',
  in: 'header' as const,
  required: false,
  description: 'Language for localized error messages. Defaults to `en`.',
  schema: { type: 'string' as const, enum: [...LOCALES] },
};

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
