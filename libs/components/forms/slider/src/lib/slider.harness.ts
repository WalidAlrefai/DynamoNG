import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSlider, for use in consumer app tests. */
export class DynamoSliderHarness extends ComponentHarness {
  static hostSelector = 'dg-slider';

  private readonly thumbLocator = this.locatorFor('[role="slider"]');

  async getValue(): Promise<number> {
    const thumb = await this.thumbLocator();
    return Number(await thumb.getAttribute('aria-valuenow'));
  }

  async focus(): Promise<void> {
    await (await this.thumbLocator()).focus();
  }

  async increment(): Promise<void> {
    await (await this.thumbLocator()).sendKeys(TestKey.RIGHT_ARROW);
  }

  async decrement(): Promise<void> {
    await (await this.thumbLocator()).sendKeys(TestKey.LEFT_ARROW);
  }
}
