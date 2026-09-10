import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoMeterGroup, for use in consumer app tests. */
export class DynamoMeterGroupHarness extends ComponentHarness {
  static hostSelector = 'dg-meter-group';

  private readonly segments = this.locatorForAll(
    '[data-testid="DynamoMeterGroup-segment"]',
  );
  private readonly legend = this.locatorForOptional(
    '[data-testid="DynamoMeterGroup-legend"]',
  );

  async getSegmentCount(): Promise<number> {
    return (await this.segments()).length;
  }

  async getSegmentLabels(): Promise<string[]> {
    const segments = await this.segments();
    return Promise.all(
      segments.map(async (s) => (await s.getAttribute('aria-label')) ?? ''),
    );
  }

  /** Each segment's rendered size, read from its inline `flex-basis` (percent). */
  async getSegmentPercents(): Promise<number[]> {
    const segments = await this.segments();
    return Promise.all(
      segments.map(async (s) => {
        const basis = await s.getCssValue('flex-basis');
        return Number.parseFloat(basis) || 0;
      }),
    );
  }

  async hasLegend(): Promise<boolean> {
    return (await this.legend()) !== null;
  }
}
