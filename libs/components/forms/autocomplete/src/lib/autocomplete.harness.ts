import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoAutocomplete, for use in consumer app tests. */
export class DynamoAutocompleteHarness extends ComponentHarness {
  static hostSelector = 'dg-autocomplete';

  private readonly fieldLocator = this.locatorFor('[role="combobox"]');
  // The panel is portaled outside dg-autocomplete's own host subtree by CDK
  // Overlay, so it must be located from the document root — same technique
  // as DynamoSelectHarness/DynamoMenuHarness.
  private readonly listboxLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="listbox"]');
  private readonly optionLocators =
    this.documentRootLocatorFactory().locatorForAll('[role="option"]');

  async type(text: string): Promise<void> {
    const field = await this.fieldLocator();
    await field.clear();
    await field.sendKeys(text);
  }

  async isOpen(): Promise<boolean> {
    return (await this.listboxLocator()) !== null;
  }

  async getOptionTexts(): Promise<string[]> {
    const options = await this.optionLocators();
    return Promise.all(
      options.map(async (option) => (await option.text()).trim()),
    );
  }

  async getActiveOptionText(): Promise<string | null> {
    const field = await this.fieldLocator();
    const activeId = await field.getAttribute('aria-activedescendant');
    if (!activeId) return null;
    const options = await this.optionLocators();
    for (const option of options) {
      if ((await option.getAttribute('id')) === activeId) {
        return (await option.text()).trim();
      }
    }
    return null;
  }

  async selectOptionByText(text: string): Promise<void> {
    const options = await this.optionLocators();
    for (const option of options) {
      if ((await option.text()).trim() === text) {
        await option.click();
        return;
      }
    }
    throw new Error(`No option with text "${text}" found`);
  }
}
