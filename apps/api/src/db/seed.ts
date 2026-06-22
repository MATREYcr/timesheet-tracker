import './load-env.js';
import { addDays, APPROVAL_STATUS, type ApprovalStatus } from '@timesheet/shared';
import { db } from './client.js';
import { employees, timeEntries, weeklyApprovals } from './schema/index.js';

const WEEK1 = '2026-06-08';
const FILL_WEEKS = ['2026-06-15', '2026-06-22', '2026-06-29'];

const workdays = (monday: string) =>
  Array.from({ length: 5 }, (_, i) => addDays(monday, i));
const saturday = (monday: string) => addDays(monday, 5);

// Rotating weekly hour profiles → varied totals, several with overtime (> 40h).
// Indices 0–4 are Mon–Fri; a 6th value is the Saturday.
const HOUR_PROFILES = [
  [8, 8, 8, 8, 8],
  [8, 8, 8, 8, 8, 6],
  [7.5, 8, 7.5, 8, 6.5],
  [9, 9, 8, 8, 8],
  [8, 8, 8, 8, 4],
  [10, 10, 8, 8, 8, 4],
  [6.5, 7, 8, 7, 6],
  [8.5, 8.5, 8.5, 8.5, 8.5],
];

type NewEntry = { employeeId: string; date: string; hours: number };
type NewApproval = {
  employeeId: string;
  weekStart: string;
  status: ApprovalStatus;
};

function weekHours(
  weekStart: string,
  profileIndex: number,
): { date: string; hours: number }[] {
  const days = [...workdays(weekStart), saturday(weekStart)];
  const profile = HOUR_PROFILES[profileIndex % HOUR_PROFILES.length];
  return profile.map((hours, d) => ({ date: days[d], hours }));
}

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
      // Inactive (soft-deleted): historical entries stay visible in their week.
      {
        firstName: 'Ana',
        lastName: 'García',
        hourlyRate: 25,
        deactivatedAt: new Date(),
      },
    ])
    .returning();

  // Extra active staff so Employees and Weekly summary span more than one page.
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

  const active = [jane, john, ...extras];

  const entries: NewEntry[] = [
    // Sketch: 8 + 7.5 + 10 + 8 + 8 + 4 = 45.5h → 40 regular + 5.5 overtime.
    { employeeId: jane.id, date: '2026-06-08', hours: 8 },
    { employeeId: jane.id, date: '2026-06-09', hours: 7.5 },
    { employeeId: jane.id, date: '2026-06-10', hours: 10 },
    { employeeId: jane.id, date: '2026-06-11', hours: 8 },
    { employeeId: jane.id, date: '2026-06-12', hours: 8 },
    { employeeId: jane.id, date: '2026-06-13', hours: 4 },
    // John: 32h — this week is approved/locked below.
    { employeeId: john.id, date: '2026-06-08', hours: 8 },
    { employeeId: john.id, date: '2026-06-09', hours: 8 },
    { employeeId: john.id, date: '2026-06-10', hours: 8 },
    { employeeId: john.id, date: '2026-06-11', hours: 8 },
    { employeeId: ana.id, date: '2026-06-01', hours: 6 },
  ];

  extras.forEach((emp, i) => {
    for (const { date, hours } of weekHours(WEEK1, i)) {
      entries.push({ employeeId: emp.id, date, hours });
    }
  });

  FILL_WEEKS.forEach((week, w) => {
    active.forEach((emp, i) => {
      for (const { date, hours } of weekHours(week, i + w)) {
        entries.push({ employeeId: emp.id, date, hours });
      }
    });
  });

  await db.insert(timeEntries).values(entries);

  // John's week 1 approved (locking demo) + a rotating mix across the fill weeks
  // so the summary shows approved / rejected / pending together.
  const approvals: NewApproval[] = [
    { employeeId: john.id, weekStart: WEEK1, status: APPROVAL_STATUS.approved },
  ];
  FILL_WEEKS.forEach((week, w) => {
    active.forEach((emp, e) => {
      const slot = (e + w) % 4;
      if (slot === 0) {
        approvals.push({
          employeeId: emp.id,
          weekStart: week,
          status: APPROVAL_STATUS.approved,
        });
      } else if (slot === 1) {
        approvals.push({
          employeeId: emp.id,
          weekStart: week,
          status: APPROVAL_STATUS.rejected,
        });
      }
    });
  });

  await db.insert(weeklyApprovals).values(approvals);

  console.log(
    `Seeded ${active.length + 1} employees, ${entries.length} time entries, ${approvals.length} approvals.`,
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
