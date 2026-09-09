import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoMenubar, for use in consumer app tests. */
export class DynamoMenubarHarness extends ComponentHarness {
  static hostSelector = 'dg-menubar';

  private readonly barItemLocators = this.locatorForAll(
    '[role="menubar"] > [role="menuitem"], [role="menubar"] > [role="combobox"]',
  );
  // Panels are portaled outside dg-menubar's own host subtree by CDK
  // Overlay, so they must be located from the document root — same
  // technique as DynamoTieredMenuHarness/DynamoCascadeSelectHarness.
  private readonly openPanelLocator = this.documentRootLocatorFactory().locatorForOptional('[role="menu"]');
  private readonly menuLocators = this.documentRootLocatorFactory().locatorForAll('[role="menu"]');

  async getTopLevelLabels(): Promise<string[]> {
    const items = await this.barItemLocators();
    return Promise.all(items.map(async (item) => (await item.text()).trim()));
  }

  async isOpen(): Promise<boolean> {
    return (await this.openPanelLocator()) !== null;
  }

  /** Opens the given top-level item's dropdown (no-op if it's already open, or the item has no children). */
  async openTopLevel(label: string): Promise<void> {
    const item = await this.findBarItem(label);
    if ((await item.getAttribute('aria-expanded')) === 'true') return;
    await item.click();
  }

  /** Closes whichever dropdown is currently open, if any. */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    const items = await this.barItemLocators();
    for (const item of items) {
      if ((await item.getAttribute('aria-expanded')) === 'true') {
        await item.click();
        return;
      }
    }
  }

  /** Text of every visible item within the dropdown/flyout at the given depth (0 = the open bar item's own dropdown). */
  async getVisibleLabelsAtLevel(depth: number): Promise<string[]> {
    const rows = await this.rowsAtLevel(depth);
    return Promise.all(rows.map(async (row) => (await row.text()).trim()));
  }

  /** Opens the first label's top-level dropdown, then hovers each remaining label in sequence, opening a flyout at each depth. */
  async drillInto(...labels: string[]): Promise<void> {
    if (labels.length === 0) return;
    const [rootLabel, ...rest] = labels;
    if (rootLabel === undefined) return;
    await this.openTopLevel(rootLabel);
    for (let depth = 0; depth < rest.length; depth++) {
      const label = rest[depth];
      if (label === undefined) continue;
      const row = await this.findRowAtLevel(depth, label);
      await row.hover();
    }
  }

  /** Drills through every label but the last, then clicks the final (leaf) one. A single label commits a childless top-level item directly. */
  async selectPath(...labels: string[]): Promise<void> {
    if (labels.length === 0) return;
    if (labels.length === 1) {
      const label = labels[0];
      if (label === undefined) return;
      const item = await this.findBarItem(label);
      await item.click();
      return;
    }
    await this.drillInto(...labels.slice(0, -1));
    const lastLabel = labels[labels.length - 1];
    if (lastLabel === undefined) return;
    const row = await this.findRowAtLevel(labels.length - 2, lastLabel);
    await row.click();
  }

  private async findBarItem(label: string): Promise<TestElement> {
    const items = await this.barItemLocators();
    for (const item of items) {
      if ((await item.text()).trim() === label) {
        return item;
      }
    }
    throw new Error(`No top-level item with label "${label}" found`);
  }

  private async rowsAtLevel(depth: number): Promise<TestElement[]> {
    const menus = await this.menuLocators();
    const menu = menus[depth];
    if (!menu) return [];
    const menuId = await menu.getAttribute('id');
    return this.documentRootLocatorFactory().locatorForAll(`#${menuId} [role="menuitem"]`)();
  }

  private async findRowAtLevel(depth: number, label: string): Promise<TestElement> {
    const rows = await this.rowsAtLevel(depth);
    for (const row of rows) {
      if ((await row.text()).trim() === label) {
        return row;
      }
    }
    throw new Error(`No item with label "${label}" found at level ${depth}`);
  }
}
