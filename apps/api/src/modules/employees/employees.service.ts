// Employees business logic + persistence. Soft delete via `deactivatedAt`.

import type {
  CreateEmployeeInput,
  Employee,
  UpdateEmployeeInput,
} from '@timesheet/shared';
import { asc, eq, isNull } from 'drizzle-orm';
import { AppError } from '../../common/errors.js';
import { db } from '../../db/client.js';
import { employees, type EmployeeRow } from '../../db/schema/index.js';
import { toEmployee } from './employees.mapper.js';

export async function listEmployees(
  includeInactive: boolean,
): Promise<Employee[]> {
  const rows = await db
    .select()
    .from(employees)
    .where(includeInactive ? undefined : isNull(employees.deactivatedAt))
    .orderBy(asc(employees.firstName), asc(employees.lastName));
  return rows.map(toEmployee);
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
