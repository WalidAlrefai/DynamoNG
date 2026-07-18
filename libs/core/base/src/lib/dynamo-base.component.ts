import { DynamoIdGenerator } from '@dynamong/core/a11y';
import { DYNAMONG_CONFIG } from '@dynamong/core/config';
import type { DynamoPassThrough } from '@dynamong/core/api';
import { Directive, inject, input } from '@angular/core';

/**
 * Shared base for every DynamoNG component. Provides the three customization escape
 * hatches every component exposes (`styleClass`, `pt`, `unstyled`) plus access to global
 * config and id generation.
 *
 * `TPart` is the union of named internal DOM "parts" the concrete component supports
 * passthrough attributes for, e.g. `DynamoBaseComponent<'root' | 'icon' | 'label'>`.
 */
@Directive()
export abstract class DynamoBaseComponent<TPart extends string = 'root'> {
  /** Extra class names merged onto the host element, in addition to DynamoNG's own. */
  readonly styleClass = input<string>('');

  /** Extra attributes/classes merged onto named internal parts. See `DynamoPassThrough`. */
  readonly pt = input<DynamoPassThrough<TPart> | undefined>(undefined);

  /** When `true`, DynamoNG's built-in Tailwind classes are not applied at all. */
  readonly unstyled = input(false);

  protected readonly config = inject(DYNAMONG_CONFIG);
  protected readonly idGenerator = inject(DynamoIdGenerator);

  /** Merges `pt()[part]` attributes into a template binding target; returns `{}` when unset. */
  protected ptFor(part: TPart): Record<string, unknown> {
    return this.pt()?.[part] ?? {};
  }
}
