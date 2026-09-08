import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTieredMenu, for use in consumer app tests. */
export class DynamoTieredMenuHarness extends ComponentHarness {
  static hostSelector = 'dg-tiered-menu';

  private readonly triggerLocator = this.locatorFor('button[aria-haspopup="menu"]');
  // Panels are portaled outside dg-tiered-menu's own host subtree by CDK
  // Overlay, so they must be located from the document root — same technique
  // as DynamoCascadeSelectHarness/DynamoTreeSelectHarness.
  private readonly panelLocator = this.documentRootLocatorFactory().locatorForOptional('[role="menu"]');
  private readonly menuLocators = this.documentRootLocatorFactory().locatorForAll('[role="menu"]');

  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.triggerLocator()).click();
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.triggerLocator()).click();
  }

  async isOpen(): Promise<boolean> {
    return (await this.panelLocator()) !== null;
  }

  /** Text of every visible item within the menu at the given depth (0 = root). */
  async getVisibleLabelsAtLevel(depth: number): Promise<string[]> {
    const rows = await this.rowsAtLevel(depth);
    return Promise.all(rows.map(async (row) => (await row.text()).trim()));
  }

  /** Hovers each label in sequence, opening a flyout at each depth — root label first. */
  async drillInto(...labels: string[]): Promise<void> {
    await this.open();
    for (let depth = 0; depth < labels.length; depth++) {
      const label = labels[depth];
      if (label === undefined) continue;
      const row = await this.findRowAtLevel(depth, label);
      await row.hover();
    }
  }

  /** Drills through every label but the last, then clicks the final (leaf) one. */
  async selectPath(...labels: string[]): Promise<void> {
    if (labels.length === 0) return;
    await this.drillInto(...labels.slice(0, -1));
    const lastLabel = labels[labels.length - 1];
    if (lastLabel === undefined) return;
    const row = await this.findRowAtLevel(labels.length - 1, lastLabel);
    await row.click();
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
