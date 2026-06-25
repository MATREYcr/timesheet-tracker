import { type Page, expect } from '@playwright/test'

export class EmployeesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/employees')
  }

  async addEmployee(data: { firstName: string; lastName: string; hourlyRate: string }) {
    await this.page.getByRole('button', { name: 'Add employee' }).click()
    await this.page.getByLabel('First name').fill(data.firstName)
    await this.page.getByLabel('Last name').fill(data.lastName)
    await this.page.getByLabel('Hourly rate').fill(data.hourlyRate)
    await this.page.getByRole('dialog').getByRole('button', { name: 'Create' }).click()
    await expect(this.page.getByRole('dialog')).not.toBeVisible()
  }

  async editEmployee(
    currentFullName: string,
    data: Partial<{ firstName: string; lastName: string; hourlyRate: string }>,
  ) {
    await this.getRow(currentFullName).getByRole('button', { name: 'Edit' }).click()
    if (data.firstName !== undefined) await this.page.getByLabel('First name').fill(data.firstName)
    if (data.lastName !== undefined) await this.page.getByLabel('Last name').fill(data.lastName)
    if (data.hourlyRate !== undefined) await this.page.getByLabel('Hourly rate').fill(data.hourlyRate)
    await this.page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click()
    await expect(this.page.getByRole('dialog')).not.toBeVisible()
  }

  async deactivate(fullName: string) {
    await this.getRow(fullName).getByRole('button', { name: 'Deactivate' }).click()
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Deactivate' }).click()
    await expect(this.page.getByRole('alertdialog')).not.toBeVisible()
  }

  async reactivate(fullName: string) {
    await this.getRow(fullName).getByRole('button', { name: 'Reactivate' }).click()
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Reactivate' }).click()
    await expect(this.page.getByRole('alertdialog')).not.toBeVisible()
  }

  async filterByName(fullName: string) {
    const trigger = this.page.getByRole('combobox')
    const input = this.page.locator('input[role="combobox"]')

    for (let attempt = 0; attempt < 4; attempt++) {
      const expanded = await trigger.getAttribute('aria-expanded').catch(() => null)
      if (expanded !== 'true') await trigger.click()
      const opened = await input.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
      if (opened) break
    }

    await input.fill(fullName)
    await this.page.getByRole('option', { name: fullName }).click()
  }

  async toggleShowInactive() {
    await this.page.getByRole('switch', { name: 'Show inactive' }).click()
  }

  getRow(fullName: string) {
    return this.page.getByRole('row').filter({ hasText: fullName })
  }
}
