import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoButton, for use in consumer app tests. */
export class DynamoButtonHarness extends ComponentHarness {
  static hostSelector = 'dg-button';

  private readonly buttonEl = this.locatorFor('button');

  async click(): Promise<void> {
    const button = await this.buttonEl();
    await button.click();
  }

  async getText(): Promise<string> {
    const button = await this.buttonEl();
    return button.text();
  }

  async isDisabled(): Promise<boolean> {
    const button = await this.buttonEl();
    return (await button.getProperty<boolean>('disabled')) ?? false;
  }

  async isLoading(): Promise<boolean> {
    const button = await this.buttonEl();
    return (await button.getAttribute('aria-busy')) === 'true';
  }
}
