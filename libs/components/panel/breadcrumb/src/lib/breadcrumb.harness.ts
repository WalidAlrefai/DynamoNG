import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoBreadcrumb, for use in consumer app tests. */
export class DynamoBreadcrumbHarness extends ComponentHarness {
  static hostSelector = 'dg-breadcrumb';

  // Excludes the aria-hidden separator span — each <li> otherwise contains
  // exactly one of these (the link/current/plain label element).
  private readonly itemLabelLocators = this.locatorForAll(
    'li > a, li > span:not([aria-hidden="true"])',
  );

  async getItemLabels(): Promise<string[]> {
    const labels = await this.itemLabelLocators();
    return Promise.all(
      labels.map(async (label) => (await label.text()).trim()),
    );
  }

  async getCurrentLabel(): Promise<string | null> {
    const current = await this.locatorForOptional('[aria-current="page"]')();
    return current ? (await current.text()).trim() : null;
  }

  async getHref(index: number): Promise<string | null> {
    const link = await this.locatorForOptional(
      `li:nth-child(${index + 1}) a`,
    )();
    return link ? link.getAttribute('href') : null;
  }
}
