import { ComponentHarness } from '@angular/cdk/testing';

type DynamoPicklistSide = 'source' | 'target';
type DynamoPicklistMoveButton = 'selected-right' | 'selected-left' | 'all-right' | 'all-left';

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

  async getLabels(side: DynamoPicklistSide): Promise<string[]> {
    const options = await this.optionLocators(side)();
    return Promise.all(options.map((option) => option.text().then((text) => text.trim())));
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
}
