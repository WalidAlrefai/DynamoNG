import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoListbox, for use in consumer app tests. */
export class DynamoListboxHarness extends ComponentHarness {
  static hostSelector = 'dg-listbox';

  private readonly optionLocators = this.locatorForAll('[role="option"]');

  private async findOption(label: string) {
    const options = await this.optionLocators();
    for (const option of options) {
      if ((await option.text()).trim() === label) {
        return option;
      }
    }
    throw new Error(`No option found with label "${label}"`);
  }

  async clickOption(label: string): Promise<void> {
    const option = await this.findOption(label);
    await option.click();
  }

  async getSelectedLabels(): Promise<string[]> {
    const options = await this.optionLocators();
    const selected: string[] = [];
    for (const option of options) {
      if ((await option.getAttribute('aria-selected')) === 'true') {
        selected.push((await option.text()).trim());
      }
    }
    return selected;
  }

  async isOptionDisabled(label: string): Promise<boolean> {
    const option = await this.findOption(label);
    return (await option.getAttribute('aria-disabled')) === 'true';
  }
}
