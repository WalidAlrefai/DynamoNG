import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSelect, for use in consumer app tests. */
export class DynamoSelectHarness extends ComponentHarness {
  static hostSelector = 'dg-select';

  private readonly triggerLocator = this.locatorFor('[role="combobox"]');
  // The panel is portaled outside dg-select's own host subtree by CDK
  // Overlay, so it must be located from the document root — same technique
  // as DynamoMenuHarness/DynamoTooltipHarness.
  private readonly listboxLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="listbox"]');
  private readonly optionLocators =
    this.documentRootLocatorFactory().locatorForAll('[role="option"]');
  // The filter box lives in the panel wrapper *outside* the `<ul
  // role="listbox">` (ARIA's listbox role only permits option/group
  // children — see select.styles.ts's `selectPanelWrapperStyles` comment),
  // so this can't be scoped under `[role="listbox"]`.
  private readonly filterInputLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      'input[type="search"]',
    );

  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.triggerLocator()).click();
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.triggerLocator()).click();
  }

  async getTriggerText(): Promise<string> {
    const trigger = await this.triggerLocator();
    return trigger.text();
  }

  async isOpen(): Promise<boolean> {
    return (await this.listboxLocator()) !== null;
  }

  async isDisabled(): Promise<boolean> {
    const trigger = await this.triggerLocator();
    return (await trigger.getProperty<boolean>('disabled')) ?? false;
  }

  async getOptionTexts(): Promise<string[]> {
    const options = await this.optionLocators();
    return Promise.all(
      options.map(async (option) => (await option.text()).trim()),
    );
  }

  async getActiveOptionText(): Promise<string | null> {
    const trigger = await this.triggerLocator();
    const activeId = await trigger.getAttribute('aria-activedescendant');
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
    await this.open();
    const options = await this.optionLocators();
    for (const option of options) {
      if ((await option.text()).trim() === text) {
        await option.click();
        return;
      }
    }
    throw new Error(`No option with text "${text}" found`);
  }

  /** Types into the filter box — throws if `filterable` is not set. */
  async filter(text: string): Promise<void> {
    await this.open();
    const input = await this.filterInputLocator();
    if (!input) {
      throw new Error(
        'DynamoSelect is not filterable (filterable input not set)',
      );
    }
    await input.clear();
    await input.sendKeys(text);
  }
}
