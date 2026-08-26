import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTimeline, for use in consumer app tests. */
export class DynamoTimelineHarness extends ComponentHarness {
  static hostSelector = 'dg-timeline';

  private readonly itemsLocator = this.locatorForAll(
    '[data-testid="DynamoTimelineItem-content"]',
  );

  async getItemCount(): Promise<number> {
    return (await this.itemsLocator()).length;
  }

  async getItemContentText(index: number): Promise<string> {
    const items = await this.itemsLocator();
    const item = items[index];
    if (!item) {
      throw new Error(`No item at index ${index}`);
    }
    return (await item.text()).trim();
  }
}
