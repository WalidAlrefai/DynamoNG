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
  // The trigger button lives in toast-section, so it's scoped there to stay
  // unambiguous against the unrelated "success / solid|outline|text" severity
  // demo buttons elsewhere on the page. The resulting toast itself is a
  // different story: DynamoToastService mounts it directly onto
  // document.body via CDK Overlay (same portaling as Dialog/Tooltip/Menu
  // above), with no relation at all to toast-section's layout box, so that
  // one is targeted by ARIA role instead, unscoped.
  await page
    .getByTestId('toast-section')
    .getByRole('button', { name: 'Success' })
    .click();
  const toast = page.getByRole('status');
  await expect(toast).toBeVisible();
  await expect(toast).toHaveScreenshot();
});

test('drawer renders as expected', async ({ page }) => {
  // Same CDK Overlay portaling issue as Dialog/Tooltip/Menu/Toast above —
  // the drawer panel is portaled into `.cdk-overlay-container` outside the
  // `drawer-section` testid's layout box, so open it and target it by ARIA
  // role instead. The panel slides in over ~200ms (see DynamoDrawer's
  // animation state machine) — wait for the transition to settle before the
  // screenshot so it isn't captured mid-slide.
  await page.getByRole('button', { name: 'Open drawer' }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  await page.waitForTimeout(250);
  await expect(drawer).toHaveScreenshot();
});

test('badge renders as expected', async ({ page }) => {
  await expect(page.getByTestId('badge-section')).toHaveScreenshot();
});

test('card renders as expected', async ({ page }) => {
  await expect(page.getByTestId('card-section')).toHaveScreenshot();
});

test('date picker renders as expected', async ({ page }) => {
  await expect(page.getByTestId('date-picker-field')).toHaveScreenshot();
});

test('date picker calendar renders as expected', async ({ page }) => {
  await page
    .getByTestId('date-picker-field')
    .getByRole('button', { name: 'Start date' })
    .click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveScreenshot();
});

test('alert renders as expected', async ({ page }) => {
  await expect(page.getByTestId('alert-section')).toHaveScreenshot();
});

test('chip renders as expected', async ({ page }) => {
  await expect(page.getByTestId('chip-section')).toHaveScreenshot();
});

test('table renders as expected', async ({ page }) => {
  await expect(page.getByTestId('table-section')).toHaveScreenshot();
});

test('table sorts a column when its header is clicked', async ({ page }) => {
  const table = page.getByTestId('table-section');
  await table.getByRole('button', { name: 'Name' }).click();
  await expect(table).toHaveScreenshot();
});

test('table paginates to the next page when Next is clicked', async ({
  page,
}) => {
  const table = page.getByTestId('table-section');
  await table.getByRole('button', { name: 'Next page' }).click();
  await expect(table).toHaveScreenshot();
});

test('table filters rows when a search query is typed', async ({ page }) => {
  const table = page.getByTestId('table-section');
  await table.getByRole('searchbox').fill('Ava');
  await expect(table).toHaveScreenshot();
});

test('select panel opens via CDK Overlay and renders as expected', async ({
  page,
}) => {
  await page.getByTestId('select-field').getByRole('combobox').click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await expect(listbox).toHaveScreenshot();
});

test('multi select renders selected tags as expected', async ({ page }) => {
  await expect(page.getByTestId('multi-select-field')).toHaveScreenshot();
});

test('multi select panel opens and toggles an option', async ({ page }) => {
  await page.getByTestId('multi-select-field').getByRole('combobox').click();
  const listbox = page.getByRole('listbox');
  await expect(listbox).toBeVisible();
  await listbox.getByRole('option', { name: 'Vue' }).click();
  await expect(page.getByTestId('multi-select-field')).toHaveScreenshot();
});

test('pagination renders as expected', async ({ page }) => {
  await expect(page.getByTestId('pagination-section')).toHaveScreenshot();
});
