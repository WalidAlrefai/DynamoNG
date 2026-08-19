import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoAlert, for use in consumer app tests. */
export class DynamoAlertHarness extends ComponentHarness {
  static hostSelector = 'dg-alert';

  private readonly rootLocator = this.locatorForOptional('[role="alert"]');
  private readonly closeButtonLocator = this.locatorForOptional(
    'button[aria-label="Dismiss"]',
  );

  async isVisible(): Promise<boolean> {
    return (await this.rootLocator()) !== null;
  }

  async getText(): Promise<string> {
    const root = await this.rootLocator();
    return root ? root.text() : '';
  }

  async dismiss(): Promise<void> {
    const closeButton = await this.closeButtonLocator();
    if (!closeButton) {
      throw new Error('DynamoAlert is not closable (no dismiss button found)');
    }
    await closeButton.click();
  }
}
