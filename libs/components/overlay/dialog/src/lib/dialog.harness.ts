import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoDialog, for use in consumer app tests. */
export class DynamoDialogHarness extends ComponentHarness {
  static hostSelector = 'dg-dialog';

  private readonly panelLocator = this.locatorForOptional('[role="dialog"]');
  private readonly titleLocator = this.locatorForOptional('h2');
  private readonly closeButtonLocator = this.locatorForOptional('button[aria-label="Close dialog"]');

  async isOpen(): Promise<boolean> {
    return (await this.panelLocator()) !== null;
  }

  async close(): Promise<void> {
    const closeButton = await this.closeButtonLocator();
    await closeButton?.click();
  }

  async getTitleText(): Promise<string | null> {
    const heading = await this.titleLocator();
    return heading ? heading.text() : null;
  }
}
