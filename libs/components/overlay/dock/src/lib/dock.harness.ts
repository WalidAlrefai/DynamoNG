import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoDock, for use in consumer app tests. */
export class DynamoDockHarness extends ComponentHarness {
  static hostSelector = 'dg-dock';

  private readonly tiles = this.locatorForAll('[role="menuitem"]');

  async getItemLabels(): Promise<string[]> {
    const tiles = await this.tiles();
    return Promise.all(
      tiles.map(async (t) => (await t.getAttribute('aria-label')) ?? ''),
    );
  }

  async clickItem(label: string): Promise<void> {
    const tile = await this.findTile(label);
    await tile.click();
  }

  async focusItem(label: string): Promise<void> {
    const tile = await this.findTile(label);
    await tile.focus();
  }

  async isDisabled(label: string): Promise<boolean> {
    const tile = await this.findTile(label);
    return (await tile.getAttribute('aria-disabled')) === 'true';
  }

  private async findTile(label: string) {
    const tiles = await this.tiles();
    for (const tile of tiles) {
      if ((await tile.getAttribute('aria-label')) === label) return tile;
    }
    throw new Error(`No dock item labelled "${label}"`);
  }
}
