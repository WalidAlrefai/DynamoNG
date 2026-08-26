import { ComponentHarness } from '@angular/cdk/testing';

export type DynamoToolbarSlot = 'start' | 'center' | 'end';

/** Refactor-safe interaction API for DynamoToolbar, for use in consumer app tests. */
export class DynamoToolbarHarness extends ComponentHarness {
  static hostSelector = 'dg-toolbar';

  async getSlotText(slot: DynamoToolbarSlot): Promise<string> {
    const el = await this.locatorFor(`[data-testid="DynamoToolbar-${slot}"]`)();
    return (await el.text()).trim();
  }
}
