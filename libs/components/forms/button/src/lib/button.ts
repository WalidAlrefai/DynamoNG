import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { buttonStyles } from './button.styles';
import type {
  DynamoButtonPart,
  DynamoButtonSeverity,
  DynamoButtonSize,
  DynamoButtonType,
  DynamoButtonVariant,
} from './button.types';

@Component({
  selector: 'dg-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
})
export class DynamoButton extends DynamoBaseComponent<DynamoButtonPart> {
  readonly severity = input<DynamoButtonSeverity>('primary');
  readonly size = input<DynamoButtonSize>('md');
  readonly variant = input<DynamoButtonVariant>('solid');
  readonly type = input<DynamoButtonType>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  /**
   * Forwarded to the native `<button>` as `aria-label`. Needed for icon-only
   * usage (no visible text content for the accessible name to come from) —
   * a plain `aria-label` attribute on `<dg-button>` itself would sit on the
   * non-interactive custom-element host, not the focusable native button
   * inside it, so it must be forwarded explicitly.
   */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded to the native `<button>` as `aria-current` — e.g. `'page'` for a pagination control's active page button. Same forwarding rationale as `ariaLabel`. */
  readonly ariaCurrent = input<
    | 'page'
    | 'step'
    | 'location'
    | 'date'
    | 'time'
    | 'true'
    | 'false'
    | undefined
  >(undefined);

  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          buttonStyles({
            severity: this.severity(),
            size: this.size(),
            variant: this.variant(),
          }),
          this.styleClass(),
        ),
  );
}
