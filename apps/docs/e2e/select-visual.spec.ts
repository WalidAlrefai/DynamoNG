import { expect, test } from '@playwright/test';

// Visual-regression baselines are generated on ubuntu-latest by the
// "Update Visual Baselines" workflow (`nx e2e docs -- --update-snapshots`),
// never on a dev machine — cross-platform font rendering would otherwise
// produce false-positive diffs.

const EXAMPLES = [
  'basic',
  'clearable',
  'filter',
  'grouped',
  'sizes',
  'disabled',
  'invalid',
  'forms',
  'virtual-scroll',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/components/select');
  await expect(page.getByRole('heading', { name: 'Select', level: 1 })).toBeVisible();
});

for (const id of EXAMPLES) {
  test(`select example "${id}" renders as expected`, async ({ page }) => {
    const example = page.locator(`#${id}`);
    await example.scrollIntoViewIfNeeded();
    await expect(example).toHaveScreenshot();
  });
}
