import { ComponentHarness } from '@angular/cdk/testing';

/**
 * Refactor-safe interaction API for DynamoVirtualScroll, for use in
 * consumer app tests. Deliberately read-only: `TestElement` (the harness
 * abstraction every environment — testbed, real browser, protractor —
 * implements) has no generic "set an arbitrary DOM property" primitive, so
 * there's no portable way to drive `scrollTop` (and therefore which items
 * CDK renders) through this harness. A consumer test that needs to
 * exercise scrolling should call the component's own public
 * `scrollToIndex()`/`scrollToOffset()` methods directly via the component
 * instance, the same way this codebase's own specs already read component
 * state directly (e.g. Tree's `expandedIds()`) rather than only through a
 * harness.
 */
export class DynamoVirtualScrollHarness extends ComponentHarness {
  static hostSelector = 'dg-virtual-scroll';

  private readonly renderedItemLocators = this.locatorForAll(
    '.cdk-virtual-scroll-content-wrapper > *',
  );

  async getRenderedItemCount(): Promise<number> {
    return (await this.renderedItemLocators()).length;
  }

  async getRenderedItemTexts(): Promise<string[]> {
    const items = await this.renderedItemLocators();
    return Promise.all(items.map(async (item) => (await item.text()).trim()));
  }
}
