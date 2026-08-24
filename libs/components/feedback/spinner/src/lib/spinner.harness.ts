import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSpinner, for use in consumer app tests. */
export class DynamoSpinnerHarness extends ComponentHarness {
  static hostSelector = 'dg-spinner';

  private readonly rootEl = this.locatorFor('span');

  async getLabel(): Promise<string | null> {
    const root = await this.rootEl();
    return root.getAttribute('aria-label');
  }
}
