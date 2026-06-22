// The generic pagination contract: the envelope, its query schema, and the
// builder. Not a domain concept — every list endpoint reuses it.

import { z } from 'zod';

/** Standard envelope for paginated list endpoints. `page` is 1-based. */
export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination query for list endpoints. `page` is 1-based. Values arrive as query
 * strings, so they're coerced; both have sane defaults and bounds.
 */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/** Wrap a page of rows + the total count into the standard paginated envelope. */
export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
