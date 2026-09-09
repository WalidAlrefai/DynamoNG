import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoPanelMenu, for use in consumer app tests. */
export class DynamoPanelMenuHarness extends ComponentHarness {
  static hostSelector = 'dg-panel-menu';

  // Nothing is portaled here (no CDK overlay, unlike the overlay-menu
  // family's harnesses) — every row lives in the host's own subtree, so a
  // plain locatorForAll suffices.
  private readonly rowLocators = this.locatorForAll('[data-node-path]');

  /** Text of every currently visible row (collapsed branches' children are excluded), in document order. */
  async getVisibleLabels(): Promise<string[]> {
    const rows = await this.rowLocators();
    return Promise.all(rows.map(async (row) => (await row.text()).trim()));
  }

  async isExpanded(label: string): Promise<boolean | null> {
    const row = await this.findRow(label);
    const value = await row.getAttribute('aria-expanded');
    return value === null ? null : value === 'true';
  }

  /** Clicks the row with the given label — toggles expand for a branch, commits for a leaf. */
  async click(label: string): Promise<void> {
    const row = await this.findRow(label);
    await row.click();
  }

  /** Expands through every label but the last (no-op if already expanded), then clicks the final (leaf) one. */
  async selectPath(...labels: string[]): Promise<void> {
    if (labels.length === 0) return;
    for (const label of labels.slice(0, -1)) {
      if ((await this.isExpanded(label)) === false) {
        await this.click(label);
      }
    }
    const last = labels[labels.length - 1];
    if (last === undefined) return;
    await this.click(last);
  }

  private async findRow(label: string): Promise<TestElement> {
    const rows = await this.rowLocators();
    for (const row of rows) {
      if ((await row.text()).trim() === label) {
        return row;
      }
    }
    throw new Error(`No row with label "${label}" found`);
  }
}
