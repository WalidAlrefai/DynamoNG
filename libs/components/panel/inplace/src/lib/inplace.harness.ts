import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoInplace, for use in consumer app tests. */
export class DynamoInplaceHarness extends ComponentHarness {
  static hostSelector = 'dg-inplace';

  private readonly display = this.locatorForOptional(
    '[data-testid="DynamoInplace-display"]',
  );
  private readonly editor = this.locatorForOptional(
    '[data-testid="DynamoInplace-editor"]',
  );
  private readonly closeButton = this.locatorForOptional(
    '[data-testid="DynamoInplace-close"]',
  );

  async isActive(): Promise<boolean> {
    return (await this.editor()) !== null;
  }

  async getDisplayText(): Promise<string> {
    const display = await this.display();
    return display ? (await display.text()).trim() : '';
  }

  /** Click the display region to enter editor mode. */
  async activate(): Promise<void> {
    const display = await this.display();
    if (!display) throw new Error('Inplace is already active');
    await display.click();
  }

  /** Click the close button to return to display mode. */
  async deactivate(): Promise<void> {
    const close = await this.closeButton();
    if (!close) throw new Error('No close button (closable is false or inactive)');
    await close.click();
  }
}
