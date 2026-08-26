import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoColorPicker, for use in consumer app tests. */
export class DynamoColorPickerHarness extends ComponentHarness {
  static hostSelector = 'dg-color-picker';

  private readonly hexInputLocator = this.locatorFor('input[type="text"]');
  private readonly triggerLocator = this.locatorFor('button[aria-haspopup]');
  // The panel is portaled outside dg-color-picker's own host subtree by CDK
  // Overlay, so it must be located from the document root — same technique
  // as DynamoSelectHarness/DynamoAutocompleteHarness.
  private readonly swatchLocators =
    this.documentRootLocatorFactory().locatorForAll('button[aria-pressed]');

  async typeHex(text: string): Promise<void> {
    const input = await this.hexInputLocator();
    await input.clear();
    await input.sendKeys(text);
  }

  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.triggerLocator()).click();
  }

  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.triggerLocator()).click();
  }

  async isOpen(): Promise<boolean> {
    const trigger = await this.triggerLocator();
    return (await trigger.getAttribute('aria-expanded')) === 'true';
  }

  async getSwatchColors(): Promise<string[]> {
    const swatches = await this.swatchLocators();
    return Promise.all(
      swatches.map(
        async (swatch) => (await swatch.getAttribute('aria-label')) ?? '',
      ),
    );
  }

  async selectSwatchByColor(color: string): Promise<void> {
    const swatches = await this.swatchLocators();
    for (const swatch of swatches) {
      const label = await swatch.getAttribute('aria-label');
      if (label === `Color ${color}`) {
        await swatch.click();
        return;
      }
    }
    throw new Error(`No swatch with color "${color}" found`);
  }
}
