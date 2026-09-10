import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBadge } from '@dynamong/badge';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  overlayBadgeBadgeStyles,
  overlayBadgeDotStyles,
  overlayBadgeRootStyles,
} from './overlay-badge.styles';
import type {
  DynamoOverlayBadgePart,
  DynamoOverlayBadgePosition,
  DynamoSeverity,
} from './overlay-badge.types';

/**
 * Overlays a small `@dynamong/badge` (a count) or a bare dot on any single
 * projected element — an unread indicator on an avatar, an icon button, etc.
 * The marker is decorative (`aria-hidden`); label the wrapped control
 * yourself (e.g. `aria-label="Notifications, 3 unread"`).
 */
@Component({
  selector: 'dg-overlay-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoBadge],
  templateUrl: './overlay-badge.html',
})
export class DynamoOverlayBadge extends DynamoBaseComponent<DynamoOverlayBadgePart> {
  readonly value = input<string | number | undefined>(undefined);
  /** Force the bare-dot style (also the default when `value` is empty/unset). */
  readonly dot = input(false);
  /** A numeric `value` above `max` renders as `${max}+`. */
  readonly max = input<number | undefined>(undefined);
  readonly severity = input<DynamoSeverity>('danger');
  readonly position = input<DynamoOverlayBadgePosition>('top-right');

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(overlayBadgeRootStyles, this.styleClass()),
  );

  protected readonly showDot = computed(() => {
    const value = this.value();
    return this.dot() || value === undefined || value === null || value === '';
  });

  protected readonly displayValue = computed<string>(() => {
    const value = this.value();
    const max = this.max();
    if (typeof value === 'number' && max !== undefined && value > max) {
      return `${max}+`;
    }
    return String(value ?? '');
  });

  protected readonly badgeOverlayClasses = computed(() =>
    overlayBadgeBadgeStyles({ position: this.position() }),
  );

  protected readonly dotClasses = computed(() =>
    overlayBadgeDotStyles({
      position: this.position(),
      severity: this.severity(),
    }),
  );
}
