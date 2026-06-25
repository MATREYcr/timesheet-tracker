import { type Page, expect } from '@playwright/test'

export class WeeklySummaryPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/weekly-summary')
  }

  async goToPreviousWeek() {
    await this.page.getByRole('button', { name: 'Previous week' }).click()
  }

  async filterByEmployee(fullName: string) {
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

  getRow(fullName: string) {
    return this.page.getByRole('row').filter({ hasText: fullName })
  }

  async approve(fullName: string) {
    const row = this.getRow(fullName)
    await row.getByRole('button', { name: 'Approve' }).click()
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Approve' }).click()
    await expect(this.page.getByRole('alertdialog')).not.toBeVisible()
    await expect(row).toContainText('Approved')
  }

  async reject(fullName: string) {
    const row = this.getRow(fullName)
    await row.getByRole('button', { name: 'Reject' }).click()
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Reject' }).click()
    await expect(this.page.getByRole('alertdialog')).not.toBeVisible()
    await expect(row).toContainText('Rejected')
  }
}
