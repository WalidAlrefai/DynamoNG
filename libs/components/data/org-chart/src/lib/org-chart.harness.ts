import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for OrgChart, for use in consumer app tests. */
export class DynamoOrgChartHarness extends ComponentHarness {
  static hostSelector = 'dg-org-chart';

  private readonly nodes = this.locatorForAll(
    '[data-testid="DynamoOrgChart-node"]',
  );

  /** Visible node boxes, in document order. */
  async getNodeLabels(): Promise<string[]> {
    const nodes = await this.nodes();
    return Promise.all(nodes.map((node) => node.text()));
  }

  async getNodeCount(): Promise<number> {
    return (await this.nodes()).length;
  }

  /** `true` / `false` for a branch node, `null` for a leaf (no toggle state). */
  async isExpanded(nodeId: string): Promise<boolean | null> {
    const box = await this.locatorFor(
      `[data-testid="DynamoOrgChart-node"][data-node-id="${nodeId}"]`,
    )();
    const value = await box.getAttribute('aria-expanded');
    return value === null ? null : value === 'true';
  }

  /** Clicks the collapse/expand toggle of a branch node. */
  async toggle(nodeId: string): Promise<void> {
    const toggler = await this.locatorFor(
      `dg-org-chart-item[data-node-id="${nodeId}"] > [data-testid="DynamoOrgChart-toggler"]`,
    )();
    await toggler.click();
  }

  /** Clicks a node box. */
  async selectNode(nodeId: string): Promise<void> {
    const box = await this.locatorFor(
      `[data-testid="DynamoOrgChart-node"][data-node-id="${nodeId}"]`,
    )();
    await box.click();
  }

  async getSelectedNodeIds(): Promise<string[]> {
    const boxes = await this.locatorForAll(
      '[data-testid="DynamoOrgChart-node"][aria-selected="true"]',
    )();
    return Promise.all(
      boxes.map(async (box) => (await box.getAttribute('data-node-id')) ?? ''),
    );
  }
}
