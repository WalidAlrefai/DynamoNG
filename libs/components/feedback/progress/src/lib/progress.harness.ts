import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoProgress, for use in consumer app tests. */
export class DynamoProgressHarness extends ComponentHarness {
  static hostSelector = 'dg-progress';

  private readonly trackEl = this.locatorFor('[role="progressbar"]');

  async getValue(): Promise<number> {
    const track = await this.trackEl();
    const value = await track.getAttribute('aria-valuenow');
    return value === null ? 0 : Number(value);
  }
}
