import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoInputText, for use in consumer app tests. */
export class DynamoInputTextHarness extends ComponentHarness {
  static hostSelector = 'dg-input-text';

  private readonly inputEl = this.locatorFor('input');

  async setValue(value: string): Promise<void> {
    const input = await this.inputEl();
    await input.clear();
    await input.sendKeys(value);
  }

  async getValue(): Promise<string> {
    const input = await this.inputEl();
    return (await input.getProperty<string>('value')) ?? '';
  }

  async isDisabled(): Promise<boolean> {
    const input = await this.inputEl();
    return (await input.getProperty<boolean>('disabled')) ?? false;
  }

  async blur(): Promise<void> {
    const input = await this.inputEl();
    await input.blur();
  }
}
