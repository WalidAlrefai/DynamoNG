import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoBadge, for use in consumer app tests. */
export class DynamoBadgeHarness extends ComponentHarness {
  static hostSelector = 'dg-badge';

  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}
