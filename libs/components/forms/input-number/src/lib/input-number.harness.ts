import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoInputNumber, for use in consumer app tests. */
export class DynamoInputNumberHarness extends ComponentHarness {
  static hostSelector = 'dg-input-number';

  private readonly inputEl = this.locatorFor('input');
  private readonly incrementButton = this.locatorFor(
    'button[aria-label="Increment"]',
  );
  private readonly decrementButton = this.locatorFor(
    'button[aria-label="Decrement"]',
  );

  async getValue(): Promise<string> {
    const input = await this.inputEl();
    return (await input.getProperty<string>('value')) ?? '';
  }

  async setValue(value: string): Promise<void> {
    const input = await this.inputEl();
    await input.clear();
    await input.sendKeys(value);
    await input.blur();
  }

  async increment(): Promise<void> {
    await (await this.incrementButton()).click();
  }

  async decrement(): Promise<void> {
    await (await this.decrementButton()).click();
  }

  async isDisabled(): Promise<boolean> {
    const input = await this.inputEl();
    return (await input.getProperty<boolean>('disabled')) ?? false;
  }
}
