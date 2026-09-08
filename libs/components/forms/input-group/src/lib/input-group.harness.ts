import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoInputGroup, for use in consumer app tests. */
export class DynamoInputGroupHarness extends ComponentHarness {
  static hostSelector = 'dg-input-group';

  private readonly prefixLocator = this.locatorFor('[data-testid="dg-input-group-prefix"]');
  private readonly suffixLocator = this.locatorFor('[data-testid="dg-input-group-suffix"]');

  async getPrefixText(): Promise<string> {
    return (await (await this.prefixLocator()).text()).trim();
  }

  async getSuffixText(): Promise<string> {
    return (await (await this.suffixLocator()).text()).trim();
  }
}
