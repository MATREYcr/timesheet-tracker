// Seed script: a small, realistic dataset so the app is usable immediately after
// setup. Numbers mirror the assessment sketch (Jane: 45.5h @ $22.50 -> $1,085.63).
// Idempotent: clears the tables, then inserts.

import './load-env.js';
import { db } from './client.js';
import { employees, timeEntries, weeklyApprovals } from './schema/index.js';

async function seed() {
  // Clear in FK-safe order.
  await db.delete(weeklyApprovals);
  await db.delete(timeEntries);
  await db.delete(employees);

  const [jane, john, ana] = await db
    .insert(employees)
    .values([
      { firstName: 'Jane', lastName: 'Doe', hourlyRate: 22.5 },
      { firstName: 'John', lastName: 'Smith', hourlyRate: 18 },
      // Inactive employee (soft-deleted) with historical entries.
      {
        firstName: 'Ana',
        lastName: 'García',
        hourlyRate: 25,
        deactivatedAt: new Date(),
      },
    ])
    .returning();

  // Week of Mon 2026-06-08 .. Sun 2026-06-14 (matches the sketch).
  await db.insert(timeEntries).values([
    // Jane: 8 + 7.5 + 10 + 8 + 8 + 4 = 45.5h -> 40 regular + 5.5 overtime.
    { employeeId: jane.id, date: '2026-06-08', hours: 8 },
    { employeeId: jane.id, date: '2026-06-09', hours: 7.5 },
    { employeeId: jane.id, date: '2026-06-10', hours: 10 },
    { employeeId: jane.id, date: '2026-06-11', hours: 8 },
    { employeeId: jane.id, date: '2026-06-12', hours: 8 },
    { employeeId: jane.id, date: '2026-06-13', hours: 4 },
    // John: 8 * 4 = 32h, no overtime.
    { employeeId: john.id, date: '2026-06-08', hours: 8 },
    { employeeId: john.id, date: '2026-06-09', hours: 8 },
    { employeeId: john.id, date: '2026-06-10', hours: 8 },
    { employeeId: john.id, date: '2026-06-11', hours: 8 },
    // Ana (inactive) has a historical entry in an earlier week — stays visible there.
    { employeeId: ana.id, date: '2026-06-01', hours: 6 },
  ]);

  // John's week is already approved (locked) to demo the locking flow.
  await db
    .insert(weeklyApprovals)
    .values([
      { employeeId: john.id, weekStart: '2026-06-08', status: 'approved' },
    ]);

  console.log('Seeded 3 employees, 11 time entries, 1 approval.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
