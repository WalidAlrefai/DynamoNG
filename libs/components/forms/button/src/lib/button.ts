import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoSpinner } from '@dynamong/spinner';
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
  imports: [DynamoSpinner],
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
  /** Forwarded to the native `<button>` as `role`, overriding its implicit button role — e.g. `'radio'` for a button acting as one segment of a single-select group. Same forwarding rationale as `ariaLabel`. */
  readonly role = input<string | undefined>(undefined);
  /** Forwarded to the native `<button>` as `aria-checked` — for a button acting as a radio-group segment. */
  readonly ariaChecked = input<boolean | undefined>(undefined);
  /** Forwarded to the native `<button>` as `aria-pressed` — for a button acting as a toggle in a multi-select group. */
  readonly ariaPressed = input<boolean | undefined>(undefined);
  /** Forwarded to the native `<button>` as `tabindex`, overriding its default tab-stop membership — for roving-tabindex patterns like Select Button's segmented control. */
  readonly tabIndexOverride = input<number | undefined>(undefined);

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
