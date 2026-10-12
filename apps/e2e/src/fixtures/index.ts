import { test as base, expect } from '@playwright/test'
import { api, ignoreCleanupError } from '../helpers/api'
import { addDays, lastWeekStart } from '../helpers/dates'

export interface EmployeeData {
  id: string
  firstName: string
  lastName: string
  fullName: string
}

export interface SeededEmployee extends EmployeeData {
  weekStart: string
}

type Fixtures = {
  createEmployee: (overrides?: {
    firstName?: string
    lastName?: string
    hourlyRate?: number
  }) => Promise<EmployeeData>
  seedEmployeeWithHours: (hoursPerDay?: number[]) => Promise<SeededEmployee>
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright requires destructuring the fixtures arg
  createEmployee: async ({}, use) => {
    const createdIds: string[] = []

    const factory = async (
      overrides: { firstName?: string; lastName?: string; hourlyRate?: number } = {},
    ): Promise<EmployeeData> => {
      const res = await api.post(`/employees`, {
        firstName: 'E2E',
        lastName: `Test${Date.now()}`,
        hourlyRate: 20,
        ...overrides,
      })
      const emp = res.data
      createdIds.push(emp.id)
      return { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, fullName: `${emp.firstName} ${emp.lastName}` }
    }

    await use(factory)

    for (const id of createdIds) {
      await api.post(`/employees/${id}/deactivate`).catch(ignoreCleanupError)
    }
  },

  // eslint-disable-next-line no-empty-pattern -- Playwright requires destructuring the fixtures arg
  seedEmployeeWithHours: async ({}, use) => {
    const created: Array<{ empId: string; entryIds: string[]; weekStart: string }> = []

    const seed = async (hoursPerDay: number[] = [9, 9, 9, 9, 9]): Promise<SeededEmployee> => {
      const res = await api.post(`/employees`, {
        firstName: 'E2E',
        lastName: `Seed${Date.now()}`,
        hourlyRate: 20,
      })
      const emp = res.data
      const week = lastWeekStart()
      const entryIds: string[] = []

      for (let i = 0; i < hoursPerDay.length; i++) {
        const entryRes = await api.post(`/time-entries`, {
          employeeId: emp.id,
          date: addDays(week, i),
          hours: hoursPerDay[i],
        })
        entryIds.push(entryRes.data.id)
      }

      created.push({ empId: emp.id, entryIds, weekStart: week })

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        weekStart: week,
      }
    }

    await use(seed)

    for (const { empId, entryIds, weekStart } of created) {
      // Unlock in case the week was approved during the test, so entries can be deleted
      await api.post(`/weekly-summary/reject`, { employeeId: empId, weekStart }).catch(ignoreCleanupError)
      for (const id of entryIds) {
        await api.delete(`/time-entries/${id}`).catch(ignoreCleanupError)
      }
      await api.post(`/employees/${empId}/deactivate`).catch(ignoreCleanupError)
    }
  },
})

export { expect }
