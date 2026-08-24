import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoPopover, for use in consumer app tests. */
export class DynamoPopoverHarness extends ComponentHarness {
  static hostSelector = 'dg-popover';

  private readonly triggerLocator = this.locatorFor('[tabindex="-1"]');

  async open(): Promise<void> {
    const trigger = await this.triggerLocator();
    await trigger.click();
  }

  async close(): Promise<void> {
    const panel = await this.documentRootLocatorFactory().locatorForOptional(
      '[data-testid="popover-panel"]',
    )();
    await panel?.sendKeys(TestKey.ESCAPE);
  }

  async isOpen(): Promise<boolean> {
    const panel = await this.documentRootLocatorFactory().locatorForOptional(
      '[data-testid="popover-panel"]',
    )();
    return panel !== null;
  }

  async getPanelText(): Promise<string | null> {
    const panel = await this.documentRootLocatorFactory().locatorForOptional(
      '[data-testid="popover-panel"]',
    )();
    return panel ? (await panel.text()).trim() : null;
  }
}
