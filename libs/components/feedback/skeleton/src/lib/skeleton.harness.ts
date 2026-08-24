import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSkeleton, for use in consumer app tests. */
export class DynamoSkeletonHarness extends ComponentHarness {
  static hostSelector = 'dg-skeleton';

  private readonly divLocator = this.locatorFor('div');

  async getWidth(): Promise<string | null> {
    const styleAttr = await (await this.divLocator()).getAttribute('style');
    return styleAttr?.match(/width:\s*([^;]+)/)?.[1]?.trim() ?? null;
  }
}
