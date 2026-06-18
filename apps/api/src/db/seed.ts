// Seed mirroring the assessment sketch (Jane 45.5h @ $22.50). Idempotent.
// Extra staff are added so the paginated lists span more than one page.

import './load-env.js';
import { db } from './client.js';
import { employees, timeEntries, weeklyApprovals } from './schema/index.js';

// Mon 2026-06-08 .. Fri 2026-06-12 (the demo week is Mon..Sun 06-08..06-14).
const WEEK_WORKDAYS = [
  '2026-06-08',
  '2026-06-09',
  '2026-06-10',
  '2026-06-11',
  '2026-06-12',
];

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

  // Extra active staff so Employees and Weekly summary paginate (14 active total).
  const extras = await db
    .insert(employees)
    .values([
      { firstName: 'Carlos', lastName: 'Mendoza', hourlyRate: 19 },
      { firstName: 'Emily', lastName: 'Nguyen', hourlyRate: 24 },
      { firstName: 'David', lastName: 'O’Brien', hourlyRate: 21 },
      { firstName: 'Sofía', lastName: 'Rojas', hourlyRate: 23.5 },
      { firstName: 'Liam', lastName: 'Patel', hourlyRate: 20 },
      { firstName: 'Mia', lastName: 'Hernández', hourlyRate: 26 },
      { firstName: 'Noah', lastName: 'Kim', hourlyRate: 17.5 },
      { firstName: 'Olivia', lastName: 'Santos', hourlyRate: 28 },
      { firstName: 'Lucas', lastName: 'Ferreira', hourlyRate: 19.5 },
      { firstName: 'Valentina', lastName: 'Cruz', hourlyRate: 22 },
      { firstName: 'Ethan', lastName: 'Walker', hourlyRate: 16.5 },
      { firstName: 'Camila', lastName: 'Torres', hourlyRate: 27 },
    ])
    .returning();

  const entries = [
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
  ];

  // Each extra employee works Mon–Fri (40h) in the demo week; every third also
  // works a Saturday so some rows show overtime in the summary.
  extras.forEach((emp, i) => {
    for (const date of WEEK_WORKDAYS) {
      entries.push({ employeeId: emp.id, date, hours: 8 });
    }
    if (i % 3 === 0) {
      entries.push({ employeeId: emp.id, date: '2026-06-13', hours: 5 });
    }
  });

  await db.insert(timeEntries).values(entries);

  // John's week is already approved (locked) to demo the locking flow.
  await db
    .insert(weeklyApprovals)
    .values([
      { employeeId: john.id, weekStart: '2026-06-08', status: 'approved' },
    ]);

  console.log(
    `Seeded ${3 + extras.length} employees, ${entries.length} time entries, 1 approval.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
