import { ComponentHarness } from '@angular/cdk/testing';

/**
 * Refactor-safe interaction API for DynamoDrawer, for use in consumer app
 * tests. Unlike DynamoDialogHarness, locators are rooted at the document
 * (`documentRootLocatorFactory()`), not the host — the drawer panel is
 * portaled via CDK Overlay to `document.body`, so it is never a DOM
 * descendant of `<dg-drawer>` the way Dialog's panel is a descendant of
 * `<dg-dialog>`.
 */
export class DynamoDrawerHarness extends ComponentHarness {
  static hostSelector = 'dg-drawer';

  private readonly panelLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="dialog"]');
  private readonly titleLocator =
    this.documentRootLocatorFactory().locatorForOptional('h2');
  private readonly closeButtonLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      'button[aria-label="Close drawer"]',
    );

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
