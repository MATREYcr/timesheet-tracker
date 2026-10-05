import { expect, test } from '@playwright/test'
import { AuthPage } from '../pages/auth.page'

// These scenarios start signed out, unlike the rest of the suite.
test.use({ storageState: { cookies: [], origins: [] } })

test('signed-out visitor is redirected to login and returns after signing in', async ({ page }) => {
  const auth = new AuthPage(page)
  await page.goto('/weekly-summary')
  await expect(page).toHaveURL(/\/login\?next=%2Fweekly-summary$/)
  await auth.expectOnLogin()

  await auth.signIn('demo@timesheet.dev', 'Demo1234!')
  await expect(page).toHaveURL(/\/weekly-summary$/)
  await expect(page.getByRole('heading', { name: 'Weekly summary' })).toBeVisible()
})

test('wrong password shows a generic error', async ({ page }) => {
  const auth = new AuthPage(page)
  await auth.gotoLogin()
  await auth.signIn('demo@timesheet.dev', 'not-the-password')
  await expect(page.getByText('Invalid email or password.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('register lands on the dashboard, sign out blocks the app, sign in restores it', async ({
  page,
}) => {
  const auth = new AuthPage(page)
  const user = { name: 'Ana García', email: `ana-${Date.now()}@example.com`, password: 'secret123' }

  await auth.gotoLogin()
  await page.getByRole('link', { name: 'Create an account' }).click()
  await auth.register(user)

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText(user.email)).toBeVisible()

  await auth.signOut()
  await page.goto('/employees')
  await expect(page).toHaveURL(/\/login\?next=%2Femployees$/)

  await auth.signIn(user.email, user.password)
  await expect(page).toHaveURL(/\/employees$/)
})

test('a signed-in user opening login is sent to the dashboard', async ({ page }) => {
  const auth = new AuthPage(page)
  await auth.gotoLogin()
  await auth.signIn('demo@timesheet.dev', 'Demo1234!')
  await expect(page).toHaveURL(/\/$/)

  await page.goto('/login')
  await expect(page).toHaveURL(/\/$/)
})
