import { ComponentHarness, TestKey } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoKnob, for use in consumer app tests. */
export class DynamoKnobHarness extends ComponentHarness {
  static hostSelector = 'dg-knob';

  private readonly dialLocator = this.locatorFor('[role="slider"]');

  async getValue(): Promise<number> {
    const dial = await this.dialLocator();
    return Number(await dial.getAttribute('aria-valuenow'));
  }

  async focus(): Promise<void> {
    await (await this.dialLocator()).focus();
  }

  async increment(): Promise<void> {
    await (await this.dialLocator()).sendKeys(TestKey.RIGHT_ARROW);
  }

  async decrement(): Promise<void> {
    await (await this.dialLocator()).sendKeys(TestKey.LEFT_ARROW);
  }
}
