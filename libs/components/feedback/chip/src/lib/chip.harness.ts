import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoChip, for use in consumer app tests. */
export class DynamoChipHarness extends ComponentHarness {
  static hostSelector = 'dg-chip';

  private readonly removeButtonLocator = this.locatorForOptional('button');

  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  async isRemovable(): Promise<boolean> {
    return (await this.removeButtonLocator()) !== null;
  }

  async remove(): Promise<void> {
    const removeButton = await this.removeButtonLocator();
    if (!removeButton) {
      throw new Error('DynamoChip is not removable (no remove button found)');
    }
    await removeButton.click();
  }
}
