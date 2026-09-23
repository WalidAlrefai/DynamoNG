import { ComponentHarness, TestKey } from '@angular/cdk/testing';

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
  // Same portaling reasoning as swatchLocators — must use
  // documentRootLocatorFactory(), not a host-scoped locator, or this
  // silently finds nothing whenever the picker isn't `inline`. Matched by
  // aria-label, not the generic `input[type="range"]` — when `customPicker`
  // is also on, the hue slider is a second `input[type="range"]` and would
  // otherwise collide with this locator.
  private readonly alphaSliderLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      'input[aria-label="Alpha"]',
    );
  private readonly hueSliderLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      'input[aria-label="Hue"]',
    );
  private readonly svSquareLocator =
    this.documentRootLocatorFactory().locatorForOptional(
      '[aria-label="Saturation and brightness"]',
    );

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

  /** `null` when the alpha slider isn't rendered (`showAlpha` is off, or the panel isn't open). */
  async getAlpha(): Promise<number | null> {
    const slider = await this.alphaSliderLocator();
    if (!slider) return null;
    return Number(await slider.getProperty<string>('value'));
  }

  async setAlpha(alpha: number): Promise<void> {
    const slider = await this.alphaSliderLocator();
    if (!slider) {
      throw new Error(
        'Alpha slider is not rendered (showAlpha is false, or the panel is not open)',
      );
    }
    // setInputValue only sets .value and stabilizes — it doesn't dispatch
    // an `input` event on its own, so that's done explicitly here.
    await slider.setInputValue(String(alpha));
    await slider.dispatchEvent('input');
  }

  /** `null` when the hue slider isn't rendered (`customPicker` is off, or the panel isn't open). */
  async getHue(): Promise<number | null> {
    const slider = await this.hueSliderLocator();
    if (!slider) return null;
    return Number(await slider.getProperty<string>('value'));
  }

  async setHue(hue: number): Promise<void> {
    const slider = await this.hueSliderLocator();
    if (!slider) {
      throw new Error(
        'Hue slider is not rendered (customPicker is false, or the panel is not open)',
      );
    }
    await slider.setInputValue(String(hue));
    await slider.dispatchEvent('input');
  }

  /** Nudges saturation/brightness via the saturation/brightness square's own
   *  arrow-key handling — mirrors DynamoSliderHarness's own keyboard-only
   *  increment()/decrement(), since there's no single-value pointer-drag
   *  equivalent to expose here (the square is a 2-axis pointer surface, not
   *  a single native control). */
  async nudgeSaturation(direction: 'increase' | 'decrease'): Promise<void> {
    const square = await this.svSquareLocator();
    if (!square) {
      throw new Error(
        'Saturation/brightness square is not rendered (customPicker is false, or the panel is not open)',
      );
    }
    await square.sendKeys(
      direction === 'increase' ? TestKey.RIGHT_ARROW : TestKey.LEFT_ARROW,
    );
  }

  async nudgeBrightness(direction: 'increase' | 'decrease'): Promise<void> {
    const square = await this.svSquareLocator();
    if (!square) {
      throw new Error(
        'Saturation/brightness square is not rendered (customPicker is false, or the panel is not open)',
      );
    }
    await square.sendKeys(
      direction === 'increase' ? TestKey.UP_ARROW : TestKey.DOWN_ARROW,
    );
  }
}
