import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSplitButton, for use in consumer app tests. */
export class DynamoSplitButtonHarness extends ComponentHarness {
  static hostSelector = 'dg-split-button';

  private readonly primaryButtonLocator = this.locatorFor('dg-button button');
  private readonly triggerLocator = this.locatorFor('button[aria-haspopup]');
  // The panel is portaled outside dg-split-button's own host subtree by CDK
  // Overlay, so it must be located from the document root, same technique
  // as DynamoMenuHarness/DynamoTooltipHarness.
  private readonly panelLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="menu"]');
  private readonly itemLocators =
    this.documentRootLocatorFactory().locatorForAll('[role="menuitem"]');

  async clickPrimary(): Promise<void> {
    await (await this.primaryButtonLocator()).click();
  }

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
    throw new Error(`No split-button item "${label}" found`);
  }
}
