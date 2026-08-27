import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoToggleButton, for use in consumer app tests. */
export class DynamoToggleButtonHarness extends ComponentHarness {
  static hostSelector = 'dg-toggle-button';

  private readonly buttonLocator = this.locatorFor('button');

  async click(): Promise<void> {
    const button = await this.buttonLocator();
    await button.click();
  }

  async isPressed(): Promise<boolean> {
    const button = await this.buttonLocator();
    return (await button.getAttribute('aria-pressed')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    const button = await this.buttonLocator();
    return (await button.getProperty<boolean>('disabled')) ?? false;
  }
}
