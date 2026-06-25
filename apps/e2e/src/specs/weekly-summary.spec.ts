import { expect, test } from '../fixtures'
import { TimeEntriesPage } from '../pages/time-entries.page'
import { WeeklySummaryPage } from '../pages/weekly-summary.page'

// 45h @ $20/hr → regular $800 + overtime $150 = $950
test('shows correct regular, overtime and pay with overtime', async ({
  page,
  seedEmployeeWithHours,
}) => {
  const emp = await seedEmployeeWithHours([9, 9, 9, 9, 9])
  const summary = new WeeklySummaryPage(page)

  await summary.goto()
  await summary.filterByEmployee(emp.fullName)
  await summary.goToPreviousWeek()

  const row = summary.getRow(emp.fullName)
  await expect(row).toBeVisible()
  await expect(row).toContainText('$950')
  await expect(row).toContainText('Pending')
})

test('approval flow: approve → lock → reject → unlock', async ({
  page,
  seedEmployeeWithHours,
}) => {
  const emp = await seedEmployeeWithHours([9, 9, 9, 9, 9])
  const summary = new WeeklySummaryPage(page)
  const entries = new TimeEntriesPage(page)

  await test.step('approving the week changes status to Approved', async () => {
    await summary.goto()
    await summary.filterByEmployee(emp.fullName)
    await summary.goToPreviousWeek()
    await summary.approve(emp.fullName)
    await expect(summary.getRow(emp.fullName)).toContainText('Approved')
  })

  await test.step('lock is reflected in the time entries screen', async () => {
    await entries.goto()
    await entries.selectEmployee(emp.fullName)
    await entries.goToPreviousWeek()
    await expect(entries.lockedAlert()).toBeVisible()
    await expect(entries.addEntryButton()).toBeDisabled()
  })

  await test.step('rejecting the approved week changes status to Rejected', async () => {
    await summary.goto()
    await summary.filterByEmployee(emp.fullName)
    await summary.goToPreviousWeek()
    await summary.reject(emp.fullName)
    await expect(summary.getRow(emp.fullName)).toContainText('Rejected')
  })

  await test.step('unlock is reflected in the time entries screen', async () => {
    await entries.goto()
    await entries.selectEmployee(emp.fullName)
    await entries.goToPreviousWeek()
    await expect(entries.lockedAlert()).not.toBeVisible()
    await expect(entries.addEntryButton()).not.toBeDisabled()
  })
})
