import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTreeSelect, for use in consumer app tests. */
export class DynamoTreeSelectHarness extends ComponentHarness {
  static hostSelector = 'dg-tree-select';

  private readonly triggerLocator = this.locatorFor('[role="combobox"]');
  // The panel is portaled outside dg-tree-select's own host subtree by CDK
  // Overlay, so it must be located from the document root — same technique
  // as DynamoSelectHarness/DynamoMenuHarness. Keyed on the panel's own
  // stable id prefix rather than `[role="tree"]`: the role is omitted while
  // showing only a no-results message (an empty `role="tree"` would itself
  // be an aria-required-children violation — see tree-select.html), which
  // would otherwise make `isOpen()` false-negative during that state, the
  // same unfixed quirk `DynamoCascadeSelectHarness`'s own `[role="listbox"]`
  // panel locator still has.
  private readonly panelLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      '[id^="dg-tree-select-panel"]',
    );
  private readonly rowLocators =
    this.documentRootLocatorFactory().locatorForAll('[role="treeitem"]');

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

  async getSelectedLabel(): Promise<string> {
    return (await this.triggerLocator()).text();
  }

  /** Text of every currently-visible row (respecting collapsed branches). */
  async getVisibleLabels(): Promise<string[]> {
    const rows = await this.rowLocators();
    return Promise.all(rows.map(async (row) => (await row.text()).trim()));
  }

  async expandNode(label: string): Promise<void> {
    await this.open();
    const rows = await this.rowLocators();
    for (const row of rows) {
      if ((await row.text()).trim() === label) {
        const rowId = await row.getAttribute('id');
        const expandButton =
          await this.documentRootLocatorFactory().locatorForOptional(
            `#${rowId} button`,
          )();
        if (!expandButton) {
          throw new Error(`Row "${label}" has no children to expand`);
        }
        await expandButton.click();
        return;
      }
    }
    throw new Error(`No row with label "${label}" found`);
  }

  async selectByLabel(label: string): Promise<void> {
    await this.open();
    const rows = await this.rowLocators();
    for (const row of rows) {
      if ((await row.text()).trim() === label) {
        await row.click();
        return;
      }
    }
    throw new Error(`No row with label "${label}" found`);
  }
}
