import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoPagination, for use in consumer app tests. */
export class DynamoPaginationHarness extends ComponentHarness {
  static hostSelector = 'dg-pagination';

  private readonly summaryLocator = this.locatorFor('[aria-live="polite"]');
  private readonly previousPageButtonLocator = this.locatorFor(
    'button[aria-label="Previous page"]',
  );
  private readonly nextPageButtonLocator = this.locatorFor(
    'button[aria-label="Next page"]',
  );
  private readonly pageSizeTriggerLocator =
    this.locatorForOptional('[role="combobox"]');
  private readonly pageButtonLocators = this.locatorForAll(
    'button[aria-label^="Page "]',
  );

  async getSummaryText(): Promise<string> {
    return (await this.summaryLocator()).text();
  }

  async goToNextPage(): Promise<void> {
    await (await this.nextPageButtonLocator()).click();
  }

  async goToPreviousPage(): Promise<void> {
    await (await this.previousPageButtonLocator()).click();
  }

  async isNextPageDisabled(): Promise<boolean> {
    return (
      (await (
        await this.nextPageButtonLocator()
      ).getProperty<boolean>('disabled')) ?? false
    );
  }

  async isPreviousPageDisabled(): Promise<boolean> {
    return (
      (await (
        await this.previousPageButtonLocator()
      ).getProperty<boolean>('disabled')) ?? false
    );
  }

  /** Clicks the numbered page button whose visible text is `page`, e.g. `clickPage(3)`. */
  async clickPage(page: number): Promise<void> {
    for (const button of await this.pageButtonLocators()) {
      if ((await button.text()).trim() === String(page)) {
        await button.click();
        return;
      }
    }
    throw new Error(`No page button for page ${page} found`);
  }

  /**
   * Visible text of every rendered page-number button/ellipsis marker, in
   * order, e.g. `['1', '…', '4', '5', '6', '…', '10']`. Scoped to
   * `button[aria-label^="Page "]` and the ellipsis `<span>` specifically
   * (not `[aria-hidden="true"]` generally, which would also match the
   * decorative Prev/Next chevron `<svg>`s).
   */
  async getVisiblePageLabels(): Promise<string[]> {
    const controls = await this.locatorForAll(
      'button[aria-label^="Page "], span[aria-hidden="true"]',
    )();
    const labels: string[] = [];
    for (const control of controls) {
      labels.push((await control.text()).trim());
    }
    return labels;
  }

  async getCurrentPage(): Promise<number | null> {
    for (const button of await this.pageButtonLocators()) {
      if ((await button.getAttribute('aria-current')) === 'page') {
        return Number((await button.text()).trim());
      }
    }
    return null;
  }

  /** `true` when the rows-per-page selector is rendered (`showPageSizeSelector` is true). */
  async hasPageSizeSelector(): Promise<boolean> {
    return (await this.pageSizeTriggerLocator()) !== null;
  }

  async getPageSizeText(): Promise<string> {
    const trigger = await this.pageSizeTriggerLocator();
    return (await trigger?.text())?.trim() ?? '';
  }

  async openPageSizeSelector(): Promise<void> {
    const trigger = await this.pageSizeTriggerLocator();
    if (!trigger) {
      throw new Error(
        'DynamoPagination has no page-size selector (showPageSizeSelector is false)',
      );
    }
    await trigger.click();
  }
}
