import { ComponentHarness } from '@angular/cdk/testing';
import type { DynamoDividerOrientation } from './divider.types';

/** Refactor-safe interaction API for DynamoDivider, for use in consumer app tests. */
export class DynamoDividerHarness extends ComponentHarness {
  static hostSelector = 'dg-divider';

  private readonly separatorEl = this.locatorFor('[role="separator"]');

  async getOrientation(): Promise<DynamoDividerOrientation> {
    const separator = await this.separatorEl();
    const value = await separator.getAttribute('aria-orientation');
    return value === 'vertical' ? 'vertical' : 'horizontal';
  }
}
