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

test('textarea renders as expected', async ({ page }) => {
  await expect(page.getByTestId('textarea-field')).toHaveScreenshot();
});

test('select renders as expected', async ({ page }) => {
  await expect(page.getByTestId('select-field')).toHaveScreenshot();
});

test('radio group renders as expected', async ({ page }) => {
  await expect(page.getByTestId('radio-group')).toHaveScreenshot();
});

test('switch renders as expected', async ({ page }) => {
  await expect(page.getByTestId('switch-field')).toHaveScreenshot();
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

test('tooltip renders as expected', async ({ page }) => {
  // The tooltip's content is portaled by CDK Overlay into a
  // `.cdk-overlay-container` appended near document.body — outside the
  // `dg-tooltip` host's own layout box, same issue as Dialog above — so
  // target it by ARIA role instead of a data-testid. Focus (not hover) is
  // used to trigger it: deterministic in CI (no real cursor position) and
  // doubles as a check that the tooltip is reachable by keyboard alone.
  await page.getByRole('button', { name: 'Submit' }).focus();
  const tooltip = page.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toHaveScreenshot();
});

test('tabs render as expected', async ({ page }) => {
  await expect(page.getByTestId('tabs-section')).toHaveScreenshot();
});

test('accordion renders as expected', async ({ page }) => {
  await expect(page.getByTestId('accordion-section')).toHaveScreenshot();
});

test('menu renders as expected', async ({ page }) => {
  // Same CDK Overlay portaling issue as Dialog/Tooltip above — the open
  // menu panel renders outside the `menu-section` testid's layout box, so
  // open it and target it by ARIA role instead.
  await page.getByRole('button', { name: 'Actions' }).click();
  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(menu).toHaveScreenshot();
});

test('toast renders as expected', async ({ page }) => {
  // Same CDK Overlay portaling issue as Dialog/Tooltip/Menu above — the
  // toast is mounted by DynamoToastService directly onto document.body, with
  // no relation at all to the `toast-section` testid's layout box, so open
  // one and target it by ARIA role instead.
  await page.getByRole('button', { name: 'Success' }).click();
  const toast = page.getByRole('status');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveScreenshot();
});
