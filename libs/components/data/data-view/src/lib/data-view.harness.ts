import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DataView, for use in consumer app tests. */
export class DynamoDataViewHarness extends ComponentHarness {
  static hostSelector = 'dg-data-view';

  private readonly content = this.locatorForOptional(
    '[data-testid="DynamoDataView-content"]',
  );
  private readonly empty = this.locatorForOptional(
    '[data-testid="DynamoDataView-empty"]',
  );

  /** Number of item elements rendered on the active page (direct children of the content container). */
  async getRenderedItemCount(): Promise<number> {
    const content = await this.content();
    if (!content) return 0;
    return (await content.getProperty<number>('childElementCount')) ?? 0;
  }

  /** Current layout, read from the content container's `data-layout`. */
  async getLayout(): Promise<'list' | 'grid' | null> {
    const content = await this.content();
    if (!content) return null;
    return (await content.getAttribute('data-layout')) as
      | 'list'
      | 'grid'
      | null;
  }

  async isEmpty(): Promise<boolean> {
    return (await this.empty()) !== null;
  }
}
