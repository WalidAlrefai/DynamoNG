import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for FloatLabel, for use in consumer app tests. */
export class DynamoFloatLabelHarness extends ComponentHarness {
  static hostSelector = 'dg-float-label';

  private readonly text = this.locatorFor(
    '[data-testid="DynamoFloatLabel-label"]',
  );

  async getLabelText(): Promise<string> {
    return (await (await this.text()).text()).trim();
  }

  /** Whether the label is currently in its floated (small) state. */
  async isFloating(): Promise<boolean> {
    const el = await this.text();
    const transform = await el.getCssValue('transform');
    // scale-75 shows up as a matrix with a leading 0.75.
    return transform.includes('0.75') || transform.includes('matrix(0.75');
  }
}

/** Refactor-safe interaction API for IftaLabel. */
export class DynamoIftaLabelHarness extends ComponentHarness {
  static hostSelector = 'dg-ifta-label';

  private readonly text = this.locatorFor(
    '[data-testid="DynamoIftaLabel-label"]',
  );

  async getLabelText(): Promise<string> {
    return (await (await this.text()).text()).trim();
  }
}
