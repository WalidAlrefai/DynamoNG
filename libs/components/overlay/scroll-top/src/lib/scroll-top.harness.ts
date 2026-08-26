import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoScrollTop, for use in consumer app tests. */
export class DynamoScrollTopHarness extends ComponentHarness {
  static hostSelector = 'dg-scroll-top';

  private readonly buttonLocator = this.locatorForOptional('button');

  async isVisible(): Promise<boolean> {
    return (await this.buttonLocator()) !== null;
  }

  async click(): Promise<void> {
    const button = await this.buttonLocator();
    if (!button) {
      throw new Error('DynamoScrollTop is not currently visible');
    }
    await button.click();
  }
}
