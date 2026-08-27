import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoChipsInput, for use in consumer app tests. */
export class DynamoChipsInputHarness extends ComponentHarness {
  static hostSelector = 'dg-chips-input';

  private readonly chipsLocator = this.locatorForAll(
    '[data-testid="DynamoChipsInput-chip"]',
  );
  private readonly removeButtonsLocator = this.locatorForAll(
    '[data-testid="DynamoChipsInput-chip"] button',
  );
  private readonly inputLocator = this.locatorFor('input');

  async getChips(): Promise<string[]> {
    const chips = await this.chipsLocator();
    const texts = await Promise.all(chips.map((chip) => chip.text()));
    return texts.map((text) => text.trim());
  }

  async addChip(text: string): Promise<void> {
    const input = await this.inputLocator();
    await input.sendKeys(text);
    await input.sendKeys(TestKey.ENTER);
  }

  async removeChip(index: number): Promise<void> {
    const buttons = await this.removeButtonsLocator();
    const button = buttons[index];
    if (!button) {
      throw new Error(`No chip at index ${index}`);
    }
    await button.click();
  }

  async focus(): Promise<void> {
    await (await this.inputLocator()).focus();
  }
}
