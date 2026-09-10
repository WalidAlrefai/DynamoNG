import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for SpeedDial, for use in consumer app tests. */
export class DynamoSpeedDialHarness extends ComponentHarness {
  static hostSelector = 'dg-speed-dial';

  private readonly trigger = this.locatorFor('button[aria-haspopup]');
  private readonly actionButtons = this.locatorForAll('[role="menuitem"]');

  async isOpen(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  async toggle(): Promise<void> {
    await (await this.trigger()).click();
  }

  async getActionLabels(): Promise<string[]> {
    const buttons = await this.actionButtons();
    return Promise.all(
      buttons.map(async (b) => (await b.getAttribute('aria-label')) ?? ''),
    );
  }

  async clickAction(label: string): Promise<void> {
    const buttons = await this.actionButtons();
    for (const button of buttons) {
      if ((await button.getAttribute('aria-label')) === label) {
        await button.click();
        return;
      }
    }
    throw new Error(`No speed-dial action labelled "${label}"`);
  }

  async close(): Promise<void> {
    if (await this.isOpen()) await this.toggle();
  }
}
