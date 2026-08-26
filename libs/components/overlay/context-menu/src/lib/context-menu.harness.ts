import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoContextMenu, for use in consumer app tests. */
export class DynamoContextMenuHarness extends ComponentHarness {
  static hostSelector = 'dg-context-menu';

  private readonly triggerLocator = this.locatorFor('div');
  // The panel is portaled outside dg-context-menu's own host subtree by CDK
  // Overlay, so it must be located from the document root, same technique
  // as DynamoMenuHarness/DynamoSplitButtonHarness.
  private readonly panelLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="menu"]');
  private readonly itemLocators =
    this.documentRootLocatorFactory().locatorForAll('[role="menuitem"]');

  async open(): Promise<void> {
    if (await this.isOpen()) {
      return;
    }
    const trigger = await this.triggerLocator();
    await trigger.rightClick(0, 0);
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) {
      return;
    }
    await (await this.panelLocator())?.sendKeys(TestKey.ESCAPE);
  }

  async isOpen(): Promise<boolean> {
    return (await this.panelLocator()) !== null;
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
    throw new Error(`No context-menu item "${label}" found`);
  }
}
