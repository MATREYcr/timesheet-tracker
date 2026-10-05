import { type Page, expect } from '@playwright/test'

export class AuthPage {
  constructor(private page: Page) {}

  async gotoLogin() {
    await this.page.goto('/login')
  }

  async signIn(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Password').fill(password)
    await this.page.getByRole('button', { name: 'Sign in' }).click()
  }

  async register(data: { name: string; email: string; password: string }) {
    await this.page.getByLabel('Full name').fill(data.name)
    await this.page.getByLabel('Email').fill(data.email)
    await this.page.getByLabel('Password').fill(data.password)
    await this.page.getByRole('button', { name: 'Create account' }).click()
  }

  async signOut() {
    await this.page.getByRole('button', { name: 'Sign out' }).click()
    await expect(this.page).toHaveURL(/\/login$/)
  }

  async expectOnLogin() {
    await expect(this.page.getByText('Welcome back. Enter your email and password.')).toBeVisible()
  }
}
