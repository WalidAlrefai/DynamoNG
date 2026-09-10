import { ComponentHarness } from '@angular/cdk/testing';
import type { DynamoOverlayBadgePosition } from './overlay-badge.types';

/** Refactor-safe interaction API for DynamoOverlayBadge, for use in consumer app tests. */
export class DynamoOverlayBadgeHarness extends ComponentHarness {
  static hostSelector = 'dg-overlay-badge';

  private readonly badge = this.locatorForOptional(
    '[data-testid="DynamoOverlayBadge-badge"]',
  );
  private readonly dot = this.locatorForOptional(
    '[data-testid="DynamoOverlayBadge-dot"]',
  );

  async isDot(): Promise<boolean> {
    return (await this.dot()) !== null;
  }

  /** The badge's rendered text, or `null` when showing a bare dot. */
  async getBadgeText(): Promise<string | null> {
    const badge = await this.badge();
    return badge ? (await badge.text()).trim() : null;
  }

  // `<dg-badge>` renders its classes onto an inner `<span>`; the dot carries
  // them directly.
  private readonly marker = this.locatorForOptional(
    '[data-testid="DynamoOverlayBadge-badge"] span, [data-testid="DynamoOverlayBadge-dot"]',
  );

  /** The corner keyword, parsed from the marker's positioning classes. */
  async getPosition(): Promise<DynamoOverlayBadgePosition | null> {
    const marker = await this.marker();
    if (!marker) return null;
    const cls = (await marker.getAttribute('class')) ?? '';
    const vertical = cls.includes('top-0') ? 'top' : 'bottom';
    const horizontal = cls.includes('left-0') ? 'left' : 'right';
    return `${vertical}-${horizontal}` as DynamoOverlayBadgePosition;
  }
}
