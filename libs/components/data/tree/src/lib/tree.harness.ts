import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for Tree, for use in consumer app tests. */
export class DynamoTreeHarness extends ComponentHarness {
  static hostSelector = 'dg-tree';

  async getVisibleNodeCount(): Promise<number> {
    const rows = await this.locatorForAll('[role="treeitem"]')();
    return rows.length;
  }

  async isNodeExpanded(id: string): Promise<boolean | null> {
    const row = await this.locatorFor(`[data-node-id="${id}"]`)();
    const value = await row.getAttribute('aria-expanded');
    return value === null ? null : value === 'true';
  }

  async getNodeCheckState(
    id: string,
  ): Promise<'true' | 'false' | 'mixed' | null> {
    const row = await this.locatorFor(`[data-node-id="${id}"]`)();
    return (await row.getAttribute('aria-checked')) as
      'true' | 'false' | 'mixed' | null;
  }

  async getActiveNodeId(): Promise<string | null> {
    const row = await this.locatorFor('[role="treeitem"][tabindex="0"]')();
    return row.getAttribute('data-node-id');
  }

  async clickNode(id: string): Promise<void> {
    const row = await this.locatorFor(`[data-node-id="${id}"]`)();
    await row.click();
  }

  private readonly filterInputLocator = this.locatorForOptional(
    'input[type="search"]',
  );

  /** Throws if `filterable` is not set — there is no search input to type into. */
  async setFilterText(text: string): Promise<void> {
    const input = await this.filterInputLocator();
    if (!input) {
      throw new Error(
        'DynamoTree is not filterable (filterable input not set)',
      );
    }
    await input.clear();
    await input.sendKeys(text);
  }

  async getFilterText(): Promise<string> {
    const input = await this.filterInputLocator();
    return (await input?.getProperty<string>('value')) ?? '';
  }
}
