import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSlider, for use in consumer app tests. */
export class DynamoSliderHarness extends ComponentHarness {
  static hostSelector = 'dg-slider';

  // In non-range mode there's exactly one `[role="slider"]`, matched by
  // `locatorFor`'s natural first-match behavior; in range mode this always
  // resolves to the min-thumb (declared first in the template), which is
  // why every method below defaults its `thumb` param to `'min'`.
  private readonly thumbLocator = this.locatorFor('[role="slider"]');
  private readonly minThumbLocator =
    this.locatorForOptional('[data-thumb="min"]');
  private readonly maxThumbLocator =
    this.locatorForOptional('[data-thumb="max"]');

  async getValue(): Promise<number> {
    const thumb = await this.thumbLocator();
    return Number(await thumb.getAttribute('aria-valuenow'));
  }

  /** Range mode only — throws if `range` is not set. */
  async getMinValue(): Promise<number> {
    const thumb = await this.minThumbLocator();
    if (!thumb) {
      throw new Error(
        'DynamoSlider is not in range mode (range input not set)',
      );
    }
    return Number(await thumb.getAttribute('aria-valuenow'));
  }

  /** Range mode only — throws if `range` is not set. */
  async getMaxValue(): Promise<number> {
    const thumb = await this.maxThumbLocator();
    if (!thumb) {
      throw new Error(
        'DynamoSlider is not in range mode (range input not set)',
      );
    }
    return Number(await thumb.getAttribute('aria-valuenow'));
  }

  async focus(thumb: 'min' | 'max' = 'min'): Promise<void> {
    await (await this.thumbFor(thumb)).focus();
  }

  async increment(thumb: 'min' | 'max' = 'min'): Promise<void> {
    await (await this.thumbFor(thumb)).sendKeys(TestKey.RIGHT_ARROW);
  }

  async decrement(thumb: 'min' | 'max' = 'min'): Promise<void> {
    await (await this.thumbFor(thumb)).sendKeys(TestKey.LEFT_ARROW);
  }

  private async thumbFor(thumb: 'min' | 'max') {
    if (thumb === 'max') {
      const maxThumb = await this.maxThumbLocator();
      if (maxThumb) return maxThumb;
    }
    return this.thumbLocator();
  }
}
