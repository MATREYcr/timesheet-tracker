import { type Page, expect } from '@playwright/test'

export class TimeEntriesPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/time-entries')
  }

  async selectEmployee(fullName: string) {
    const trigger = this.page.getByRole('combobox')
    const input = this.page.locator('input[role="combobox"]')

    // Retry the click until the popover opens — the first visit to the page
    // may click before React hydration attaches the Radix Popover handler.
    for (let attempt = 0; attempt < 4; attempt++) {
      const expanded = await trigger.getAttribute('aria-expanded').catch(() => null)
      if (expanded !== 'true') await trigger.click()
      const opened = await input.waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false)
      if (opened) break
    }

    await input.fill(fullName)
    await this.page.getByRole('option', { name: fullName }).click()
  }

  async goToPreviousWeek() {
    await this.page.getByRole('button', { name: 'Previous week' }).click()
  }

  async addEntry(hours: number) {
    await this.page.getByRole('button', { name: 'Log time' }).click()
    await this.page.getByLabel('Hours').fill(String(hours))
    await this.page.getByRole('dialog').getByRole('button', { name: 'Log' }).click()
    await expect(this.page.getByRole('dialog')).not.toBeVisible()
  }

  async editFirstEntry(hours: number) {
    await this.page.getByRole('button', { name: 'Edit' }).first().click()
    await this.page.getByLabel('Hours').clear()
    await this.page.getByLabel('Hours').fill(String(hours))
    await this.page.getByRole('dialog').getByRole('button', { name: 'Save changes' }).click()
    await expect(this.page.getByRole('dialog')).not.toBeVisible()
  }

  async deleteFirstEntry() {
    await this.page.getByRole('button', { name: 'Delete' }).first().click()
    await this.page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(this.page.getByRole('alertdialog')).not.toBeVisible()
  }

  lockedAlert() {
    return this.page.getByTestId('week-locked-alert')
  }

  inactiveAlert() {
    return this.page.getByTestId('inactive-employee-alert')
  }

  addEntryButton() {
    return this.page.getByRole('button', { name: 'Log time' })
  }
}
