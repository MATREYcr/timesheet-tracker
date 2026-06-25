import axios from 'axios'
import { expect, test } from '../fixtures'
import { addDays, lastWeekStart } from '../helpers/dates'
import { TimeEntriesPage } from '../pages/time-entries.page'

const API = process.env.API_URL ?? 'http://localhost:3333'

test('create time entry appears in the table', async ({ page, createEmployee }) => {
  const emp = await createEmployee()
  const timeEntriesPage = new TimeEntriesPage(page)

  await timeEntriesPage.goto()
  await timeEntriesPage.selectEmployee(emp.fullName)
  await timeEntriesPage.addEntry(8)

  await expect(page.getByRole('cell', { name: /8/ })).toBeVisible()
})

test('edit entry updates the hours', async ({ page, createEmployee }) => {
  const emp = await createEmployee()
  const week = lastWeekStart()

  await axios.post(`${API}/time-entries`, {
    employeeId: emp.id,
    date: addDays(week, 0),
    hours: 6,
  })

  const timeEntriesPage = new TimeEntriesPage(page)
  await timeEntriesPage.goto()
  await timeEntriesPage.selectEmployee(emp.fullName)
  await timeEntriesPage.goToPreviousWeek()

  await timeEntriesPage.editFirstEntry(9)

  await expect(page.getByRole('cell', { name: /9/ })).toBeVisible()
})

test('delete entry removes it from the table', async ({ page, createEmployee }) => {
  const emp = await createEmployee()
  const week = lastWeekStart()

  await axios.post(`${API}/time-entries`, {
    employeeId: emp.id,
    date: addDays(week, 0),
    hours: 7.5,
  })

  const timeEntriesPage = new TimeEntriesPage(page)
  await timeEntriesPage.goto()
  await timeEntriesPage.selectEmployee(emp.fullName)
  await timeEntriesPage.goToPreviousWeek()

  await expect(page.getByRole('cell', { name: /7/ })).toBeVisible()

  await timeEntriesPage.deleteFirstEntry()

  await expect(page.getByRole('cell', { name: /7/ })).not.toBeVisible()
})

test('inactive employee shows alert and disables the Log time button', async ({
  page,
  createEmployee,
}) => {
  const emp = await createEmployee()
  await axios.post(`${API}/employees/${emp.id}/deactivate`)

  const timeEntriesPage = new TimeEntriesPage(page)
  await timeEntriesPage.goto()
  await timeEntriesPage.selectEmployee(emp.fullName)

  await expect(timeEntriesPage.inactiveAlert()).toBeVisible()
  await expect(timeEntriesPage.addEntryButton()).toBeDisabled()
})

test('approved week shows lock alert and disables the Log time button', async ({
  page,
  createEmployee,
}) => {
  const emp = await createEmployee()
  const week = lastWeekStart()

  await axios.post(`${API}/time-entries`, {
    employeeId: emp.id,
    date: addDays(week, 0),
    hours: 8,
  })
  await axios.post(`${API}/weekly-summary/approve`, { employeeId: emp.id, weekStart: week })

  const timeEntriesPage = new TimeEntriesPage(page)
  await timeEntriesPage.goto()
  await timeEntriesPage.selectEmployee(emp.fullName)
  await timeEntriesPage.goToPreviousWeek()

  await expect(timeEntriesPage.lockedAlert()).toBeVisible()
  await expect(timeEntriesPage.addEntryButton()).toBeDisabled()
})
