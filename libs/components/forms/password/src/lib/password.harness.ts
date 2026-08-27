import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoPassword, for use in consumer app tests. */
export class DynamoPasswordHarness extends ComponentHarness {
  static hostSelector = 'dg-password';

  private readonly inputEl = this.locatorFor('input');
  private readonly toggleEl = this.locatorFor('button');

  async setValue(value: string): Promise<void> {
    const input = await this.inputEl();
    await input.clear();
    await input.sendKeys(value);
  }

  async getValue(): Promise<string> {
    const input = await this.inputEl();
    return (await input.getProperty<string>('value')) ?? '';
  }

  async isMasked(): Promise<boolean> {
    const input = await this.inputEl();
    return (await input.getProperty<string>('type')) === 'password';
  }

  async toggleVisibility(): Promise<void> {
    const toggle = await this.toggleEl();
    await toggle.click();
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
