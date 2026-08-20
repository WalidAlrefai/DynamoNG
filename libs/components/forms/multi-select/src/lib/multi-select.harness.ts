import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoMultiSelect, for use in consumer app tests. */
export class DynamoMultiSelectHarness extends ComponentHarness {
  static hostSelector = 'dg-multi-select';

  private readonly triggerLocator = this.locatorFor('[role="combobox"]');
  // The panel is portaled outside dg-multi-select's own host subtree by CDK
  // Overlay, so it must be located from the document root — same technique
  // as DynamoSelectHarness/DynamoMenuHarness.
  private readonly listboxLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="listbox"]');
  private readonly optionLocators =
    this.documentRootLocatorFactory().locatorForAll('[role="option"]');
  private readonly tagLocators = this.locatorForAll('[role="combobox"] button');
  // Both the filter box and the select-all checkbox live in the panel
  // wrapper *outside* the `<ul role="listbox">` (ARIA's listbox role only
  // permits option/group children), so neither can be scoped under
  // `[role="listbox"]`.
  private readonly filterInputLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      'input[type="search"]',
    );
  // Targets the real native checkbox input inside `<dg-checkbox
  // data-testid="dg-multi-select-select-all">` directly, rather than the
  // custom-element host, so a click always lands on the actual form control.
  private readonly selectAllCheckboxLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      '[data-testid="dg-multi-select-select-all"] input[type="checkbox"]',
    );

  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.triggerLocator()).click();
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.triggerLocator()).click();
  }

  async isOpen(): Promise<boolean> {
    return (await this.listboxLocator()) !== null;
  }

  async getTriggerTagTexts(): Promise<string[]> {
    const tags = await this.tagLocators();
    const labels: string[] = [];
    for (const tag of tags) {
      const ariaLabel = await tag.getAttribute('aria-label');
      if (ariaLabel?.startsWith('Remove ')) {
        labels.push(ariaLabel.slice('Remove '.length));
      }
    }
    return labels;
  }

  async getOptionTexts(): Promise<string[]> {
    const options = await this.optionLocators();
    return Promise.all(
      options.map(async (option) => (await option.text()).trim()),
    );
  }

  async toggleOptionByText(text: string): Promise<void> {
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

  async removeTagByText(text: string): Promise<void> {
    const tags = await this.tagLocators();
    for (const tag of tags) {
      const label = await tag.getAttribute('aria-label');
      if (label === `Remove ${text}`) {
        await tag.click();
        return;
      }
    }
    throw new Error(`No selected tag "${text}" found`);
  }

  /** Clicks the header's tri-state select-all/clear-all checkbox. */
  async toggleSelectAll(): Promise<void> {
    await this.open();
    const checkbox = await this.selectAllCheckboxLocator();
    if (!checkbox) {
      throw new Error(
        'DynamoMultiSelect has no select-all control (showSelectAll false?)',
      );
    }
    await checkbox.click();
  }

  async isSelectAllChecked(): Promise<boolean> {
    const checkbox = await this.selectAllCheckboxLocator();
    return (await checkbox?.getProperty<boolean>('checked')) ?? false;
  }

  async isSelectAllIndeterminate(): Promise<boolean> {
    const checkbox = await this.selectAllCheckboxLocator();
    return (await checkbox?.getProperty<boolean>('indeterminate')) ?? false;
  }

  /** Types into the filter box — throws if `filterable` is not set. */
  async filter(text: string): Promise<void> {
    await this.open();
    const input = await this.filterInputLocator();
    if (!input) {
      throw new Error(
        'DynamoMultiSelect is not filterable (filterable input not set)',
      );
    }
    await input.clear();
    await input.sendKeys(text);
  }
}
