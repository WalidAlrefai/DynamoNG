import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoMenu, for use in consumer app tests. */
export class DynamoMenuHarness extends ComponentHarness {
  static hostSelector = 'dg-menu';

  private readonly triggerLocator = this.locatorFor('button[aria-haspopup]');
  // The panel is portaled outside dg-menu's own host subtree by CDK Overlay,
  // so it must be located from the document root, same technique as
  // DynamoTooltipHarness.
  private readonly menuLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="menu"]');
  private readonly itemLocators =
    this.documentRootLocatorFactory().locatorForAll('[role="menuitem"]');

  async open(): Promise<void> {
    if (await this.isOpen()) {
      return;
    }
    await (await this.triggerLocator()).click();
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) {
      return;
    }
    await (await this.triggerLocator()).click();
  }

  async isOpen(): Promise<boolean> {
    return (await this.menuLocator()) !== null;
  }

  async getItemLabels(): Promise<string[]> {
    const items = await this.itemLocators();
    return Promise.all(items.map(async (item) => (await item.text()).trim()));
  }

  async selectItemByLabel(label: string): Promise<void> {
    const items = await this.itemLocators();
    for (const item of items) {
      if ((await item.text()).trim() === label) {
        await item.click();
        return;
      }
    }
    throw new Error(`No menu item "${label}" found`);
  }
}
