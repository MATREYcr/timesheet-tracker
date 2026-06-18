import type { Paginated } from './types.js';

/** Wrap a page of rows + the total count into the standard paginated envelope. */
export function buildPaginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): Paginated<T> {
  return { data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}
