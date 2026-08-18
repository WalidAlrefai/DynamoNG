import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSwitch, for use in consumer app tests. */
export class DynamoSwitchHarness extends ComponentHarness {
  static hostSelector = 'dg-switch';

  private readonly inputEl = this.locatorFor('input[type="checkbox"]');

  async toggle(): Promise<void> {
    const input = await this.inputEl();
    await input.click();
  }

  async isChecked(): Promise<boolean> {
    const input = await this.inputEl();
    return (await input.getProperty<boolean>('checked')) ?? false;
  }

  async isDisabled(): Promise<boolean> {
    const input = await this.inputEl();
    return (await input.getProperty<boolean>('disabled')) ?? false;
  }
}
