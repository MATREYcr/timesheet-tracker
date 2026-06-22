import {
  buildPaginated,
  type CreateEmployeeInput,
  type Employee,
  type Paginated,
  type PaginationQuery,
  type UpdateEmployeeInput,
} from '@timesheet/shared';
import { and, asc, count, eq, ilike, isNull, sql } from 'drizzle-orm';
import { AppError } from '../../common/errors.js';
import { db } from '../../db/client.js';
import { employees, type EmployeeRow } from '../../db/schema/index.js';
import { toEmployee } from './employees.mapper.js';

export async function listEmployees(
  includeInactive: boolean,
  { page, pageSize }: PaginationQuery,
  filters: { employeeId?: string; search?: string } = {},
): Promise<Paginated<Employee>> {
  const { employeeId, search } = filters;
  const conditions = [
    includeInactive ? undefined : isNull(employees.deactivatedAt),
    employeeId ? eq(employees.id, employeeId) : undefined,
    search
      ? ilike(
          sql`${employees.firstName} || ' ' || ${employees.lastName}`,
          `%${search}%`,
        )
      : undefined,
  ].filter((c) => c !== undefined);
  const where = conditions.length ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(employees)
    .where(where);

  const rows = await db
    .select()
    .from(employees)
    .where(where)
    .orderBy(asc(employees.firstName), asc(employees.lastName))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return buildPaginated(rows.map(toEmployee), total, page, pageSize);
}

async function findOrThrow(id: string): Promise<EmployeeRow> {
  const [row] = await db.select().from(employees).where(eq(employees.id, id));
  if (!row) throw new AppError('NOT_FOUND');
  return row;
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<Employee> {
  const [row] = await db.insert(employees).values(input).returning();
  return toEmployee(row);
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<Employee> {
  await findOrThrow(id);
  const [row] = await db
    .update(employees)
    .set(input)
    .where(eq(employees.id, id))
    .returning();
  return toEmployee(row);
}

export async function deactivateEmployee(id: string): Promise<Employee> {
  await findOrThrow(id);
  const [row] = await db
    .update(employees)
    .set({ deactivatedAt: new Date() })
    .where(eq(employees.id, id))
    .returning();
  return toEmployee(row);
}

export async function reactivateEmployee(id: string): Promise<Employee> {
  await findOrThrow(id);
  const [row] = await db
    .update(employees)
    .set({ deactivatedAt: null })
    .where(eq(employees.id, id))
    .returning();
  return toEmployee(row);
}
