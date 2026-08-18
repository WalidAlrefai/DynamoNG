import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('buttons render as expected', async ({ page }) => {
  await expect(page.getByTestId('buttons-section')).toHaveScreenshot();
});

test('checkbox renders as expected', async ({ page }) => {
  await expect(page.getByTestId('checkbox-field')).toHaveScreenshot();
});

test('input text renders as expected', async ({ page }) => {
  await expect(page.getByTestId('input-text-field')).toHaveScreenshot();
});

test('select renders as expected', async ({ page }) => {
  await expect(page.getByTestId('select-field')).toHaveScreenshot();
});

test('radio group renders as expected', async ({ page }) => {
  await expect(page.getByTestId('radio-group')).toHaveScreenshot();
});

test('dialog renders as expected', async ({ page }) => {
  await page.getByRole('button', { name: 'Submit' }).click();
  // The `dg-dialog` host element's visible content uses `position: fixed`,
  // which escapes the host's layout box (zero-size, not screenshot-able) —
  // target the actual dialog panel by its ARIA role instead.
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveScreenshot();
});
