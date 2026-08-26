import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSplitter, for use in consumer app tests. */
export class DynamoSplitterHarness extends ComponentHarness {
  static hostSelector = 'dg-splitter';

  private readonly dividersLocator = this.locatorForAll('[role="separator"]');

  async getSizes(): Promise<number[]> {
    const dividers = await this.dividersLocator();
    return Promise.all(
      dividers.map(async (divider) =>
        Number(await divider.getAttribute('aria-valuenow')),
      ),
    );
  }

  async focusDivider(index: number): Promise<void> {
    const dividers = await this.dividersLocator();
    const divider = dividers[index];
    if (!divider) {
      throw new Error(`No divider at index ${index}`);
    }
    await divider.focus();
  }

  async resizeWithKeyboard(index: number, key: TestKey): Promise<void> {
    const dividers = await this.dividersLocator();
    const divider = dividers[index];
    if (!divider) {
      throw new Error(`No divider at index ${index}`);
    }
    await divider.sendKeys(key);
  }
}
