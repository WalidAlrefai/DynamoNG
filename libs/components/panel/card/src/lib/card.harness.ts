import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoCard, for use in consumer app tests. */
export class DynamoCardHarness extends ComponentHarness {
  static hostSelector = 'dg-card';

  async getHeaderText(): Promise<string | null> {
    const title = await this.locatorForOptional(
      '[data-testid="DynamoCard-title"]',
    )();
    return title ? (await title.text()).trim() : null;
  }

  async getSubheaderText(): Promise<string | null> {
    const subtitle = await this.locatorForOptional(
      '[data-testid="DynamoCard-subtitle"]',
    )();
    return subtitle ? (await subtitle.text()).trim() : null;
  }
}
