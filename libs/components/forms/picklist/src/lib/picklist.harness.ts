import { ComponentHarness } from '@angular/cdk/testing';

type DynamoPicklistSide = 'source' | 'target';
type DynamoPicklistMoveButton =
  'selected-right' | 'selected-left' | 'all-right' | 'all-left';

// Fixed render order of the four move buttons in the middle column — see
// picklist.html. Indexed rather than matched by aria-label text so this
// keeps working regardless of a consumer's custom sourceLabel/targetLabel.
const MOVE_BUTTON_INDEX: Record<DynamoPicklistMoveButton, number> = {
  'selected-right': 0,
  'selected-left': 1,
  'all-right': 2,
  'all-left': 3,
};

/** Refactor-safe interaction API for DynamoPicklist, for use in consumer app tests. */
export class DynamoPicklistHarness extends ComponentHarness {
  static hostSelector = 'dg-picklist';

  private optionLocators(side: DynamoPicklistSide) {
    return this.locatorForAll(`[data-part="${side}Panel"] [role="option"]`);
  }

  private moveButtonLocators() {
    return this.locatorForAll('[data-part="moveButtons"] button');
  }

  private filterInputLocator(side: DynamoPicklistSide) {
    return this.locatorForOptional(
      `[data-part="${side}Panel"] input[type="search"]`,
    );
  }

  private noResultsLocator(side: DynamoPicklistSide) {
    return this.locatorForOptional(
      `[data-part="${side}Panel"] [role="status"]`,
    );
  }

  private listLocator(side: DynamoPicklistSide) {
    return this.locatorFor(`[data-part="${side}Panel"] [role="listbox"]`);
  }

  async getLabels(side: DynamoPicklistSide): Promise<string[]> {
    const options = await this.optionLocators(side)();
    return Promise.all(
      options.map((option) => option.text().then((text) => text.trim())),
    );
  }

  async toggleOption(side: DynamoPicklistSide, label: string): Promise<void> {
    const options = await this.optionLocators(side)();
    for (const option of options) {
      if ((await option.text()).trim() === label) {
        await option.click();
        return;
      }
    }
    throw new Error(`No option "${label}" found in ${side} panel`);
  }

  async clickMoveButton(name: DynamoPicklistMoveButton): Promise<void> {
    const buttons = await this.moveButtonLocators()();
    const button = buttons[MOVE_BUTTON_INDEX[name]];
    if (!button) {
      throw new Error(`No move button found for "${name}"`);
    }
    await button.click();
  }

  /** Throws if that panel isn't `filterable` (no box rendered). */
  async setFilterText(side: DynamoPicklistSide, text: string): Promise<void> {
    const input = await this.filterInputLocator(side)();
    if (!input) {
      throw new Error(
        `No filter box found in ${side} panel — is \`filterable\` set?`,
      );
    }
    await input.clear();
    if (text) {
      await input.sendKeys(text);
    }
  }

  async getFilterText(side: DynamoPicklistSide): Promise<string> {
    const input = await this.filterInputLocator(side)();
    return input ? ((await input.getProperty<string>('value')) ?? '') : '';
  }

  /** True when that panel's filter matched nothing and its no-results message is showing. */
  async hasNoResults(side: DynamoPicklistSide): Promise<boolean> {
    return (await this.noResultsLocator(side)()) !== null;
  }

  /** True when that panel's drop list is CDK-disabled (filtering active, virtualized, disabled, or readOnly). */
  async isDragDisabled(side: DynamoPicklistSide): Promise<boolean> {
    const classes = await (
      await this.listLocator(side)()
    ).getAttribute('class');
    return (classes ?? '').includes('cdk-drop-list-disabled');
  }
}
