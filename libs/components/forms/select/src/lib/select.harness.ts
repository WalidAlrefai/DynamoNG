import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSelect, for use in consumer app tests. */
export class DynamoSelectHarness extends ComponentHarness {
  static hostSelector = 'dg-select';

  private readonly triggerEl = this.locatorFor('[role="combobox"]');
  private readonly optionEls = this.locatorForAll('[role="option"]');

  async open(): Promise<void> {
    const trigger = await this.triggerEl();
    await trigger.click();
  }

  async getTriggerText(): Promise<string> {
    const trigger = await this.triggerEl();
    return trigger.text();
  }

  async isOpen(): Promise<boolean> {
    const trigger = await this.triggerEl();
    return (await trigger.getAttribute('aria-expanded')) === 'true';
  }

  async selectOptionByText(text: string): Promise<void> {
    await this.open();
    const options = await this.optionEls();
    for (const option of options) {
      if ((await option.text()).trim() === text) {
        await option.click();
        return;
      }
    }
    throw new Error(`No option with text "${text}" found`);
  }
}
