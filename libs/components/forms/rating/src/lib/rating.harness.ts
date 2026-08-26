import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoRating, for use in consumer app tests. */
export class DynamoRatingHarness extends ComponentHarness {
  static hostSelector = 'dg-rating';

  private readonly rootLocator = this.locatorFor('[role="slider"]');

  async getValue(): Promise<number> {
    const root = await this.rootLocator();
    return Number(await root.getAttribute('aria-valuenow'));
  }

  async focus(): Promise<void> {
    await (await this.rootLocator()).focus();
  }

  async clickStar(star: number): Promise<void> {
    const target = await this.locatorFor(`[data-star="${star}"]`)();
    await target.click();
  }

  async increment(): Promise<void> {
    await (await this.rootLocator()).sendKeys(TestKey.RIGHT_ARROW);
  }

  async decrement(): Promise<void> {
    await (await this.rootLocator()).sendKeys(TestKey.LEFT_ARROW);
  }
}
