import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTag, for use in consumer app tests. */
export class DynamoTagHarness extends ComponentHarness {
  static hostSelector = 'dg-tag';

  async getText(): Promise<string> {
    return (await this.host()).text();
  }
}
