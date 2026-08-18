import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoRadio, for use in consumer app tests. */
export class DynamoRadioHarness extends ComponentHarness {
  static hostSelector = 'dg-radio';

  private readonly inputEl = this.locatorFor('input[type="radio"]');

  async select(): Promise<void> {
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

  async getValue(): Promise<string> {
    const input = await this.inputEl();
    return (await input.getProperty<string>('value')) ?? '';
  }
}
