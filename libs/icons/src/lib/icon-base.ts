import { Directive, computed, input } from '@angular/core';
import type { DynamoSize } from '@dynamong/core/api';

const ICON_SIZE_PX: Record<DynamoSize, number> = { sm: 14, md: 16, lg: 20 };

/**
 * Shared base for every DynamoNG icon component. Icons are internal visual
 * primitives embedded inside other components' templates (e.g. Checkbox's
 * checkmark), not top-level consumer-facing components — so this does NOT
 * extend `DynamoBaseComponent`; it only centralizes sizing.
 */
@Directive()
export abstract class DynamoIconBase {
  readonly size = input<DynamoSize>('md');

  protected readonly sizePx = computed(() => ICON_SIZE_PX[this.size()]);
}
