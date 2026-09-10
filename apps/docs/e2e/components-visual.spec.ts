import { expect, test } from '@playwright/test';

// Visual-regression baselines are generated on ubuntu-latest by the
// "Update Visual Baselines" workflow (`nx e2e docs -- --update-snapshots`),
// never on a dev machine — cross-platform font rendering would otherwise
// produce false-positive diffs.
//
// Each entry screenshots the first `docs-example` section on that component's
// doc page (the default Preview view). Overlay components (dialog, menu,
// toast, …) render their trigger closed, so the card is stable.

const SLUGS = [
  'accordion',
  'alert',
  'avatar',
  'badge',
  'button',
  'card',
  'checkbox',
  'chip',
  'date-picker',
  'dialog',
  'divider',
  'drawer',
  'input-text',
  'menu',
  'multi-select',
  'pagination',
  'progress',
  'radio',
  'select',
  'skeleton',
  'switch',
  'table',
  'tabs',
  'tag',
  'textarea',
  'toast',
  'tooltip',
];

for (const slug of SLUGS) {
  test(`${slug} first example renders as expected`, async ({ page }) => {
    await page.goto(`/components/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const firstExample = page.locator('docs-example section').first();
    await firstExample.scrollIntoViewIfNeeded();
    await expect(firstExample).toHaveScreenshot();
  });
}
