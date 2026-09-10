import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/** Refactor-safe interaction API for MegaMenu, for use in consumer app tests. */
export class DynamoMegaMenuHarness extends ComponentHarness {
  static hostSelector = 'dg-mega-menu';

  private readonly barItemLocators = this.locatorForAll(
    '[role="menubar"] > [role="menuitem"], [role="menubar"] > [role="combobox"]',
  );
  // The mega panel is portaled outside the host subtree by CDK Overlay, so
  // it must be located from the document root — same technique as Menubar's
  // harness.
  private readonly panelLocator = this.documentRootLocatorFactory().locatorForOptional(
    '[data-testid="DynamoMegaMenu-panel"]',
  );
  private readonly linkLocators = this.documentRootLocatorFactory().locatorForAll(
    '[data-testid="DynamoMegaMenu-panel"] [role="menuitem"]',
  );
  private readonly columnLocators = this.documentRootLocatorFactory().locatorForAll(
    '[data-testid="DynamoMegaMenu-panel"] [role="group"]',
  );

  async getRootItemLabels(): Promise<string[]> {
    const items = await this.barItemLocators();
    return Promise.all(items.map(async (i) => (await i.text()).trim()));
  }

  async isOpen(): Promise<boolean> {
    return (await this.panelLocator()) !== null;
  }

  async open(label: string): Promise<void> {
    const item = await this.findBarItem(label);
    if ((await item.getAttribute('aria-expanded')) === 'true') return;
    await item.click();
  }

  async close(): Promise<void> {
    const items = await this.barItemLocators();
    for (const item of items) {
      if ((await item.getAttribute('aria-expanded')) === 'true') {
        await item.click();
        return;
      }
    }
  }

  async getColumnHeaders(): Promise<string[]> {
    const columns = await this.columnLocators();
    const headers: string[] = [];
    for (const column of columns) {
      const label = await column.getAttribute('aria-label');
      if (label) headers.push(label);
    }
    return headers;
  }

  async getLinkLabels(): Promise<string[]> {
    const links = await this.linkLocators();
    return Promise.all(links.map(async (l) => (await l.text()).trim()));
  }

  async clickLink(label: string): Promise<void> {
    const links = await this.linkLocators();
    for (const link of links) {
      if ((await link.text()).trim() === label) {
        await link.click();
        return;
      }
    }
    throw new Error(`No mega-menu link labelled "${label}"`);
  }

  private async findBarItem(label: string): Promise<TestElement> {
    const items = await this.barItemLocators();
    for (const item of items) {
      if ((await item.text()).trim() === label) return item;
    }
    throw new Error(`No mega-menu item labelled "${label}"`);
  }
}
