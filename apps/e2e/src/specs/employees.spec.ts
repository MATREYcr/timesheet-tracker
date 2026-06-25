import axios from 'axios'
import { expect, test } from '../fixtures'
import { EmployeesPage } from '../pages/employees.page'

const API = process.env.API_URL ?? 'http://localhost:3333'

test('create employee via UI appears in the table', async ({ page }) => {
  const lastName = `Crea${Date.now()}`
  const employeesPage = new EmployeesPage(page)

  await employeesPage.goto()
  await employeesPage.addEmployee({ firstName: 'Test', lastName: lastName, hourlyRate: '25' })

  // Filter by the new employee to avoid pagination issues with a populated DB
  await page.getByRole('combobox').click()
  await page.locator('input[role="combobox"]').fill(lastName)
  await page.getByRole('option', { name: `Test ${lastName}` }).click()

  const row = employeesPage.getRow(`Test ${lastName}`)
  await expect(row).toBeVisible()

  // cleanup: find the created employee via API and deactivate
  const { data } = await axios.get(`${API}/employees?search=${lastName}&includeInactive=false`)
  const emp = data.data?.[0]
  if (emp) await axios.post(`${API}/employees/${emp.id}/deactivate`).catch(() => {})
})

test('edit employee updates data in the table', async ({ page, createEmployee }) => {
  const emp = await createEmployee({ firstName: 'Juan', lastName: 'Original' })
  const employeesPage = new EmployeesPage(page)

  await employeesPage.goto()
  await employeesPage.editEmployee(emp.fullName, { lastName: 'Edited' })

  await expect(employeesPage.getRow('Juan Edited')).toBeVisible()
})

test('soft delete: deactivate → hidden → show inactive → reactivate', async ({
  page,
  createEmployee,
}) => {
  const emp = await createEmployee({ firstName: 'Ana', lastName: `Garcia${Date.now()}` })
  const employeesPage = new EmployeesPage(page)

  await employeesPage.goto()
  await employeesPage.filterByName(emp.fullName)

  await test.step('deactivate hides the employee from the list', async () => {
    await employeesPage.deactivate(emp.fullName)
    await expect(employeesPage.getRow(emp.fullName)).toHaveCount(0)
  })

  await test.step('toggling "Show inactive" reveals them with Inactive badge', async () => {
    await employeesPage.toggleShowInactive()
    await expect(employeesPage.getRow(emp.fullName)).toBeVisible()
    await expect(employeesPage.getRow(emp.fullName)).toContainText('Inactive')
  })

  await test.step('reactivate returns them to the active list', async () => {
    await employeesPage.reactivate(emp.fullName)
    await employeesPage.toggleShowInactive()
    await expect(employeesPage.getRow(emp.fullName)).toBeVisible()
    await expect(employeesPage.getRow(emp.fullName)).toContainText('Active')
  })
})
