import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoFieldset, for use in consumer app tests. */
export class DynamoFieldsetHarness extends ComponentHarness {
  static hostSelector = 'dg-fieldset';

  private readonly fieldsetLocator = this.locatorFor('fieldset');
  private readonly legendLocator = this.locatorFor('legend');
  private readonly toggleButtonLocator = this.locatorForOptional('[data-testid="dg-fieldset-toggle"]');

  async getLegendText(): Promise<string> {
    return (await (await this.legendLocator()).text()).trim();
  }

  async isCollapsed(): Promise<boolean> {
    const toggle = await this.toggleButtonLocator();
    if (!toggle) {
      return false;
    }
    return (await toggle.getAttribute('aria-expanded')) === 'false';
  }

  async toggle(): Promise<void> {
    await (await this.toggleButtonLocator())?.click();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.fieldsetLocator()).getProperty<boolean>('disabled');
  }
}
